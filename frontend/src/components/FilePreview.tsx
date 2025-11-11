'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Download, RefreshCw, AlertCircle, X } from 'lucide-react';
import DocxPreview from './DocxPreview';
import XlsxPreview from './XlsxPreview';
import StlPreview from './StlPreview';
import { NonViewableFilePage } from './non-viewable-file-page';

interface FilePreviewProps {
  documentId: number;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  onClose?: () => void;
  onDownload?: () => void;
}

export default function FilePreview({ 
  documentId, 
  fileName = 'Document', 
  fileType,
  fileSize,
  onClose,
  onDownload 
}: FilePreviewProps) {
  const [presignedUrl, setPresignedUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Generate presigned URL when component mounts or documentId changes
  useEffect(() => {
    if (!documentId) return;
    
    const generatePresignedUrl = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/s3/presigned-url', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ documentId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to generate presigned URL');
        }

        const result = await response.json();
        setPresignedUrl(result.presignedUrl);
      } catch (error) {
        console.error('Error generating presigned URL:', error);
        setError(error instanceof Error ? error.message : 'Failed to generate presigned URL');
      } finally {
        setLoading(false);
      }
    };

    generatePresignedUrl();
  }, [documentId]);

  const refreshPresignedUrl = async () => {
    setIsRefreshing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/s3/presigned-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to refresh presigned URL');
      }

      const result = await response.json();
      setPresignedUrl(result.presignedUrl);
    } catch (error) {
      console.error('Error refreshing presigned URL:', error);
      setError(error instanceof Error ? error.message : 'Failed to refresh presigned URL');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDownload = () => {
    if (presignedUrl) {
      window.open(presignedUrl, '_blank');
    }
    onDownload?.();
  };

  const getFileExtension = (fileType?: string): string => {
    if (!fileType) return '';
    const parts = fileType.split('.');
    return parts[parts.length - 1]?.toLowerCase() || '';
  };

  const getFileTypeFromExtension = (extension: string): string => {
    const mimeTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'stl': 'application/sla',
      'txt': 'text/plain',
    };
    return mimeTypes[extension] || 'application/octet-stream';
  };

  const isViewableFile = (fileType?: string): boolean => {
    const extension = getFileExtension(fileType);
    const viewableExtensions = ['pdf', 'docx', 'xlsx', 'stl', 'txt'];
    return viewableExtensions.includes(extension);
  };

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mx-auto" />
            <p className="text-sm text-gray-600">Generating secure preview...</p>
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
              <p className="text-sm font-medium text-red-700">Failed to load preview</p>
              <p className="text-xs text-red-600 mt-1">{error}</p>
            </div>
            <div className="space-x-2">
              <Button variant="outline" size="sm" onClick={refreshPresignedUrl} disabled={isRefreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Retry
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (!presignedUrl) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <FileText className="h-8 w-8 text-gray-400 mx-auto" />
            <p className="text-sm text-gray-600">No preview available</p>
          </div>
        </div>
      );
    }

    const fileExtension = getFileExtension(fileType);
    const isViewable = isViewableFile(fileType);
    
    console.log('FilePreview file type detection:', { 
      fileType, 
      fileExtension, 
      isViewable,
      fileName 
    });

    if (!isViewable) {
      return (
        <NonViewableFilePage
          fileName={fileName}
          fileType={getFileTypeFromExtension(fileExtension)}
          fileSize={fileSize}
          onDownload={handleDownload}
          onBack={onClose}
        />
      );
    }

    // Render appropriate preview based on file type
    switch (fileExtension) {
      case 'docx':
        return <DocxPreview downloadUrl={presignedUrl} onDownload={handleDownload} />;
      case 'xlsx':
        return <XlsxPreview downloadUrl={presignedUrl} onDownload={handleDownload} />;
      case 'stl':
        return <StlPreview downloadUrl={presignedUrl} onDownload={handleDownload} />;
      case 'pdf':
        return (
          <div className="w-full h-full">
            <iframe
              src={presignedUrl}
              className="w-full h-full border-0"
              title={`Preview of ${fileName}`}
            />
          </div>
        );
      case 'txt':
        return (
          <div className="w-full h-full p-4">
            <iframe
              src={presignedUrl}
              className="w-full h-full border-0"
              title={`Preview of ${fileName}`}
            />
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-4">
              <FileText className="h-8 w-8 text-gray-400 mx-auto" />
              <p className="text-sm text-gray-600">Preview not available for this file type</p>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download File
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-blue-600" />
          <div>
            <h3 className="font-medium text-gray-900 truncate">{fileName}</h3>
            <p className="text-xs text-gray-500">
              {fileType || 'Unknown type'} • {fileSize ? `${(fileSize / 1024 / 1024).toFixed(1)} MB` : 'Unknown size'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshPresignedUrl}
            disabled={isRefreshing}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-8 w-8 p-0"
          >
            <Download className="h-4 w-4" />
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 min-h-0">
        {renderPreview()}
      </div>
    </div>
  );
}
