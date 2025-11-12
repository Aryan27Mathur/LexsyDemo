'use client';

import { useState } from 'react';
import { GoogleGenAI, createPartFromUri } from '@google/genai';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Loader2 } from 'lucide-react';
import mammoth from 'mammoth';
import { PDFDocument } from 'pdf-lib';
import { ThemeToggle } from '@/components/ThemeToggle';
import Editor from '@/components/Editor';
import { motion, AnimatePresence } from 'motion/react';
import { useTypewriter } from '@/hooks/useTypewriter';

interface MarkdownResult {
  content: string;
  fileName: string;
}

export default function TestPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<MarkdownResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
    }
  };

  const convertDocxToPdf = async (docxBuffer: ArrayBuffer): Promise<Uint8Array> => {
    // Convert DOCX to text/markdown using mammoth
    const result = await mammoth.extractRawText({ arrayBuffer: docxBuffer });
    const text = result.value;

    // Create PDF from text content
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // Letter size (8.5 x 11 inches)
    const { height } = page.getSize();

    // Split text into paragraphs
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    const fontSize = 12;
    const lineHeight = fontSize * 1.2;
    const margin = 72; // 1 inch margin
    const maxWidth = 612 - (margin * 2);
    let y = height - margin;

    let currentPage = page;

    for (const paragraph of paragraphs) {
      // Split long paragraphs into lines that fit the page width
      const words = paragraph.split(/\s+/);
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        // Rough estimate: 7 pixels per character for font size 12
        const textWidth = testLine.length * 7;

        if (textWidth > maxWidth && currentLine) {
          // Draw current line
          if (y < margin + lineHeight) {
            currentPage = pdfDoc.addPage([612, 792]);
            y = height - margin;
          }
          
          currentPage.drawText(currentLine, {
            x: margin,
            y: y,
            size: fontSize,
            maxWidth: maxWidth,
          });
          y -= lineHeight;
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }

      // Draw remaining line
      if (currentLine) {
        if (y < margin + lineHeight) {
          currentPage = pdfDoc.addPage([612, 792]);
          y = height - margin;
        }
        
        currentPage.drawText(currentLine, {
          x: margin,
          y: y,
          size: fontSize,
          maxWidth: maxWidth,
        });
        y -= lineHeight * 1.5; // Extra space between paragraphs
      }
    }

    return await pdfDoc.save();
  };

  const processFile = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not configured. Please set NEXT_PUBLIC_GEMINI_API_KEY in your .env.local file.');
      }

      const ai = new GoogleGenAI({ apiKey });

      // Check if file is DOCX and convert to PDF
      const isDocx = file.name.toLowerCase().endsWith('.docx') || 
                     file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      
      let fileBlob: Blob;
      let uploadFileName = file.name;

      if (isDocx) {
        // Convert DOCX to PDF
        const arrayBuffer = await file.arrayBuffer();
        const pdfBytes = await convertDocxToPdf(arrayBuffer);
        // Create Blob from Uint8Array - Blob accepts Uint8Array directly
        fileBlob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
        uploadFileName = file.name.replace(/\.docx?$/i, '.pdf');
      } else {
        // Use file as-is
        fileBlob = new Blob([await file.arrayBuffer()], { type: file.type });
      }

      // Upload file to Gemini
      const uploadedFile = await ai.files.upload({
        file: fileBlob,
        config: {
          displayName: uploadFileName,
        },
      });

      // Wait for the file to be processed
      if (!uploadedFile.name) {
        throw new Error('File upload failed: missing file name');
      }
      
      const fileName = uploadedFile.name;
      let getFile = await ai.files.get({ name: fileName });
      while (getFile.state === 'PROCESSING') {
        getFile = await ai.files.get({ name: fileName });
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      if (getFile.state === 'FAILED') {
        throw new Error('File processing failed.');
      }

      // Generate markdown content
      const contents: Array<string | ReturnType<typeof createPartFromUri>> = [
        'Convert this document to markdown format. Preserve all structure, headings, tables, and formatting.',
      ];

      if (getFile.uri && getFile.mimeType) {
        const fileContent = createPartFromUri(getFile.uri, getFile.mimeType);
        contents.push(fileContent);
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: contents,
        config: {
          temperature: 0,
        },
      });

      setResult({
        content: response.text || '',
        fileName: file.name,
      });
    } catch (err) {
      console.error('Error processing file:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while processing the file');
    } finally {
      setIsProcessing(false);
    }
  };

  // Typewriter effect for editor content at 10 lines per second (line by line)
  const { displayedText: animatedContent } = useTypewriter(result?.content || null, 10);

  // Show upload component only when there's no result
  const showUpload = !result;

  return (
    <>
      <div className="container mx-auto max-w-6xl" style={{ padding: 'max(2vw, 1rem) max(3vw, 1.5rem)' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          style={{ marginBottom: 'max(3vw, 1.5rem)' }}
        >
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground" style={{ marginBottom: 'max(1vw, 0.5rem)' }}>Welcome to Lexsy! Your AI Legal expert</h1>
            <p className="text-sm sm:text-base text-muted-foreground">get started by uploading a MIME compatible document</p>
          </div>
          <ThemeToggle />
        </motion.div>

        <AnimatePresence mode="wait">
          {showUpload && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50, scale: 0.95 }}
              transition={{ duration: 0.5 }}
            >
              <Card style={{ marginBottom: 'max(2.5vw, 1.25rem)' }}>
                <CardHeader>
                  <CardTitle>Upload File</CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'max(2vw, 1rem)' }}>
                    <div className="flex items-center" style={{ gap: 'max(2vw, 1rem)' }}>
                      <div className="flex-1">
                        <Label htmlFor="file-upload" className="cursor-pointer">
                          <div className="border-2 border-dashed border-[var(--border)] rounded-lg hover:border-[var(--accent)] transition-colors bg-[var(--card)] text-[var(--card-foreground)]" style={{ padding: 'max(3vw, 1.5rem)' }}>
                            <div className="flex flex-col items-center justify-center" style={{ gap: 'max(1vw, 0.5rem)' }}>
                              <Upload className="text-[var(--muted-foreground)] transition-colors" style={{ width: 'max(4vw, 2rem)', height: 'max(4vw, 2rem)' }} />
                              <span className="text-xs sm:text-sm font-medium text-[var(--foreground)] transition-colors">
                                {file ? file.name : 'Click to upload or drag and drop'}
                              </span>
                              <span className="text-xs text-[var(--muted-foreground)] transition-colors">
                                PDF, DOCX, Images, and other supported formats
                              </span>
                            </div>
                          </div>
                        </Label>
                        <Input
                          id="file-upload"
                          type="file"
                          onChange={handleFileChange}
                          className="hidden"
                          disabled={isProcessing}
                        />
                      </div>
                    </div>

                    {file && (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center" style={{ gap: 'max(1vw, 0.5rem)' }}>
                        <Button
                          onClick={processFile}
                          disabled={isProcessing}
                          className="w-full sm:flex-1"
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            'Convert to Markdown'
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setFile(null);
                            setResult(null);
                            setError(null);
                          }}
                          disabled={isProcessing}
                          className="w-full sm:w-auto"
                        >
                          Clear
                        </Button>
                      </div>
                    )}

                    {error && (
                      <div className="bg-[var(--destructive)]/10 border border-[var(--destructive)]/30 rounded-lg text-[var(--destructive-foreground)] transition-colors" style={{ padding: 'max(2vw, 1rem)' }}>
                        <p className="font-medium">Error</p>
                        <p className="text-sm">{error}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {result && (
            <motion.div
              key="editor"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card style={{ marginBottom: 'max(2.5vw, 1.25rem)' }}>
                <CardHeader>
                  <CardTitle>Editor</CardTitle>
                </CardHeader>
                <CardContent>
                  <Editor content={animatedContent || null} />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

