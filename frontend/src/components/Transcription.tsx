'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Upload, Loader2, FileText, AlertCircle, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import DocxPreview from './DocxPreview';

interface TranscriptionResult {
  transcription: string;
  fileName: string;
}

export default function Transcription() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Check if it's a DOCX file
      const isDocx = selectedFile.name.toLowerCase().endsWith('.docx') || 
                     selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      
      if (!isDocx) {
        setError('Please upload a DOCX file');
        return;
      }

      setFile(selectedFile);
      setResult(null);
      setError(null);
      setShowPreview(true);
    }
  };

  // Start progress timer (10 seconds)
  const startProgressTimer = () => {
    setProgress(0);
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
          return 100;
        }
        return prev + 10; // Increment by 10% every second (10 seconds total)
      });
    }, 1000);
  };

  // Cleanup progress timer
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const handleTranscribe = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setResult(null);
    setShowPreview(false);
    startProgressTimer();

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      // Clear progress timer
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setProgress(100);

      // Check if response is ok
      if (!response.ok) {
        let errorMessage = 'Failed to transcribe file';
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
          
          // Add status code context if available
          if (response.status === 400) {
            errorMessage = `Bad Request: ${errorMessage}`;
          } else if (response.status === 500) {
            errorMessage = `Server Error: ${errorMessage}`;
          } else if (response.status === 502) {
            errorMessage = `Processing Error: ${errorMessage}`;
          }
        } catch {
          // If JSON parsing fails, use status text
          errorMessage = `Error ${response.status}: ${response.statusText || 'Unknown error'}`;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Validate response data
      if (!data.transcription) {
        throw new Error('Invalid response: transcription data is missing');
      }

      setResult({
        transcription: data.transcription,
        fileName: data.fileName || file.name,
      });
      setProgress(100);
    } catch (err) {
      console.error('Error transcribing file:', err);
      
      // Clear progress on error
      setProgress(0);
      
      // Set error message
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'string') {
        setError(err);
      } else {
        setError('An unexpected error occurred while transcribing the file. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setProgress(0);
    setShowPreview(false);
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    // Reset file input
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Document Transcription</h1>
        <p className="text-muted-foreground">Upload a DOCX file to preview and generate a transcription using Gemini</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Upload DOCX File</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed border-gray-400 rounded-lg p-6 hover:border-gray-500 transition-colors bg-gray-50">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Upload className="h-8 w-8 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">
                        {file ? file.name : 'Click to upload or drag and drop'}
                      </span>
                      <span className="text-xs text-gray-500">
                        DOCX files only
                      </span>
                    </div>
                  </div>
                </Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isProcessing}
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-red-900 mb-1">Error</p>
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File Preview Section */}
      {file && showPreview && !isProcessing && !result && (
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>Document Preview: {file.name}</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleTranscribe}
                disabled={isProcessing}
              >
                <FileText className="mr-2 h-4 w-4" />
                Generate Transcription
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleClear}
                disabled={isProcessing}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-gray-300 rounded-lg overflow-hidden" style={{ minHeight: '400px', maxHeight: '600px' }}>
              <DocxPreview file={file} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Section */}
      {isProcessing && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Transcribing Document</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2 p-3 border border-gray-300 rounded-lg bg-gray-50">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Processing file...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transcription Result Section */}
      {result && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>Transcription: {result.fileName}</CardTitle>
            <Button
              variant="outline"
              size="icon"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-auto max-h-[800px] border-2 border-gray-300 rounded-lg bg-gray-50">
              <div className="p-4 bg-white">
                <div className="prose prose-sm max-w-none prose-headings:font-semibold prose-p:mb-4 prose-p:leading-7 prose-pre:bg-gray-100 prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded prose-table:w-full prose-table:border-collapse prose-th:border prose-th:border-gray-300 prose-th:bg-gray-100 prose-th:p-2 prose-td:border prose-td:border-gray-300 prose-td:p-2">
                  <ReactMarkdown>{result.transcription}</ReactMarkdown>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
