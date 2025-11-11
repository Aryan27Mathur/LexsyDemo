'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, AlertCircle } from 'lucide-react';

interface DocxPreviewProps {
  downloadUrl?: string;
  file?: File;
  onDownload?: () => void;
}

interface DocxContent {
  text: string;
  wordCount: number;
  paragraphCount: number;
}

export default function DocxPreview({ downloadUrl, file, onDownload }: DocxPreviewProps) {
  const [content, setContent] = useState<DocxContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDocxFile = async () => {
      setLoading(true);
      setError(null);

      try {
        let arrayBuffer: ArrayBuffer;

        if (file) {
          // Use File object directly
          arrayBuffer = await file.arrayBuffer();
        } else if (downloadUrl) {
          // Fetch from URL
          const response = await fetch(downloadUrl);
          if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.status}`);
          }
          arrayBuffer = await response.arrayBuffer();
        } else {
          return;
        }

        const parsedContent = await parseDocxFile(arrayBuffer);
        setContent(parsedContent);

      } catch (error) {
        console.error('Error loading DOCX file:', error);
        setError(error instanceof Error ? error.message : 'Failed to load DOCX file');
      } finally {
        setLoading(false);
      }
    };

    loadDocxFile();
  }, [downloadUrl, file]);

  const parseDocxFile = async (arrayBuffer: ArrayBuffer): Promise<DocxContent> => {
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(arrayBuffer);

      const documentXml = await zipContent.file('word/document.xml')?.async('string');
      if (!documentXml) {
        throw new Error('Could not find document content');
      }

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(documentXml, 'application/xml');

      const paragraphNodes = xmlDoc.getElementsByTagName('w:p');
      let extractedText = '';

      for (let i = 0; i < paragraphNodes.length; i++) {
        const paragraph = paragraphNodes[i];
        const textNodes = paragraph.getElementsByTagName('w:t');
        let paragraphText = '';

        for (let j = 0; j < textNodes.length; j++) {
          paragraphText += textNodes[j].textContent || '';
        }

        if (paragraphText.trim()) {
          extractedText += paragraphText.trim() + '\n\n';
        }
      }

      const words = extractedText.split(/\s+/).filter(w => w.length > 0);
      const paragraphs = extractedText.split('\n\n').filter(p => p.trim().length > 0);

      return {
        text: extractedText.trim(),
        wordCount: words.length,
        paragraphCount: paragraphs.length,
      };
    } catch (error) {
      console.error('Error parsing DOCX:', error);
      return {
        text: 'Unable to parse document content. Please download to view.',
        wordCount: 0,
        paragraphCount: 0,
      };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="text-sm text-muted-foreground">Loading document...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
          <div>
            <p className="text-sm font-medium text-red-700">Failed to load document</p>
            <p className="text-xs text-red-600 mt-1">{error}</p>
          </div>
          <div className="space-x-2">
            {downloadUrl && (
              <Button variant="outline" size="sm" onClick={() => window.open(downloadUrl, "_blank")}>
                Open in Browser
              </Button>
            )}
            {onDownload && (
              <Button variant="outline" size="sm" onClick={onDownload}>
                Download File
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <FileText className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">No content found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 min-h-[400px]">
            <div className="prose prose-sm max-w-none">
              {content.text.split('\n\n').filter(p => p.trim()).map((paragraph, index) => (
                <p key={index} className="mb-4 text-gray-800 leading-relaxed">
                  {paragraph.trim()}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

