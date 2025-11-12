'use client';

import { useEffect, useState, useRef } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

interface FileExportProps {
  editorContent: string;
  fileName: string;
  onBack: () => void;
}

function FileExport({ editorContent, fileName, onBack }: FileExportProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const pdfUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const generatePDF = async () => {
      try {
        setIsGenerating(true);
        setError(null);

        // Create a new PDF document
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([612, 792]); // Letter size (8.5 x 11 inches)
        const { width, height } = page.getSize();

        // Load fonts
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        // Parse content - handle markdown-like structure
        const lines = editorContent.split('\n');
        
        const fontSize = 12;
        const lineHeight = fontSize * 1.2;
        const margin = 72; // 1 inch margin
        const maxWidth = width - (margin * 2);
        let y = height - margin;
        let currentPage = page;

        for (const line of lines) {
          const trimmedLine = line.trim();
          
          // Check if line is empty
          if (!trimmedLine) {
            y -= lineHeight * 0.5; // Small spacing for empty lines
            continue;
          }

          // Check if line is a heading (starts with #)
          let isHeading = false;
          let headingLevel = 0;
          let text = trimmedLine;
          
          if (trimmedLine.startsWith('#')) {
            isHeading = true;
            headingLevel = trimmedLine.match(/^#+/)?.[0].length || 1;
            text = trimmedLine.replace(/^#+\s*/, '');
          }

          // Check if line is a list item
          const isListItem = /^[-*+]\s/.test(trimmedLine) || /^\d+\.\s/.test(trimmedLine);
          if (isListItem) {
            text = trimmedLine.replace(/^[-*+]\s/, '').replace(/^\d+\.\s/, '');
          }

          // Calculate font size based on heading level
          let currentFontSize = fontSize;
          let currentFont = helveticaFont;
          
          if (isHeading) {
            currentFont = helveticaBoldFont;
            if (headingLevel === 1) {
              currentFontSize = 24;
            } else if (headingLevel === 2) {
              currentFontSize = 20;
            } else if (headingLevel === 3) {
              currentFontSize = 16;
            } else {
              currentFontSize = 14;
            }
          }

          // Check if we need a new page
          if (y < margin + currentFontSize * 1.5) {
            currentPage = pdfDoc.addPage([612, 792]);
            y = height - margin;
          }

          // Handle text wrapping
          const words = text.split(' ');
          let currentLine = '';
          const currentLineHeight = currentFontSize * 1.2;

          for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const textWidth = currentFont.widthOfTextAtSize(testLine, currentFontSize);

            if (textWidth > maxWidth && currentLine) {
              // Draw current line
              if (y < margin + currentLineHeight) {
                currentPage = pdfDoc.addPage([612, 792]);
                y = height - margin;
              }
              
              currentPage.drawText(currentLine, {
                x: margin + (isListItem ? 20 : 0),
                y: y,
                size: currentFontSize,
                font: currentFont,
                color: rgb(0, 0, 0),
              });
              y -= currentLineHeight;
              currentLine = word;
            } else {
              currentLine = testLine;
            }
          }

          // Draw remaining line
          if (currentLine) {
            if (y < margin + currentLineHeight) {
              currentPage = pdfDoc.addPage([612, 792]);
              y = height - margin;
            }
            
            currentPage.drawText(currentLine, {
              x: margin + (isListItem ? 20 : 0),
              y: y,
              size: currentFontSize,
              font: currentFont,
              color: rgb(0, 0, 0),
            });
            y -= currentLineHeight * (isHeading ? 1.5 : 1);
          }
        }

        // Generate PDF bytes
        const pdfBytes = await pdfDoc.save();
        
        // Create blob URL for iframe
        // Revoke old URL if it exists
        if (pdfUrlRef.current) {
          URL.revokeObjectURL(pdfUrlRef.current);
        }
        const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        pdfUrlRef.current = url;
        setPdfUrl(url);
      } catch (err) {
        console.error('Error generating PDF:', err);
        setError(err instanceof Error ? err.message : 'Failed to generate PDF');
      } finally {
        setIsGenerating(false);
      }
    };

    generatePDF();

    // Cleanup blob URL on unmount
    return () => {
      if (pdfUrlRef.current) {
        URL.revokeObjectURL(pdfUrlRef.current);
      }
    };
  }, [editorContent]);

  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `${fileName.replace(/\.[^/.]+$/, '')}_export.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">PDF Export</h1>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>

        {/* PDF Preview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Document Preview</CardTitle>
              {pdfUrl && (
                <Button onClick={handleDownload} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isGenerating && (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
                  <p className="text-[var(--muted-foreground)]">Generating PDF...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-[var(--destructive)]/10 border border-[var(--destructive)]/30 rounded-lg text-[var(--destructive-foreground)] p-4">
                <p className="font-medium">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            )}

            {pdfUrl && !isGenerating && (
              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                <iframe
                  ref={iframeRef}
                  src={pdfUrl}
                  className="w-full"
                  style={{ height: '80vh', minHeight: '600px' }}
                  title="PDF Preview"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default FileExport;

