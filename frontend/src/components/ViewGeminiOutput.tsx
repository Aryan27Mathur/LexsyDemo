'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { CheckCircle, X } from 'lucide-react';

interface ViewGeminiOutputProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summary: string;
  documentTitle?: string;
  version?: number;
}

export function ViewGeminiOutput({ open, onOpenChange, summary, documentTitle = 'Document', version }: ViewGeminiOutputProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Document Summary</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-[600px]">
          <div className="flex-1 flex flex-col items-center justify-center space-y-6 p-8">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <h2 className="text-2xl font-semibold text-gray-900">Document Summary Generated</h2>
            </div>
            <div className="w-full max-w-4xl">
              <div className="bg-gray-50 rounded-lg p-6 border">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Summary</h3>
                <div className="prose prose-sm max-w-none">
                  {summary ? (
                    <p className="text-gray-700 leading-relaxed text-base">{summary}</p>
                  ) : (
                    <p className="text-gray-500 italic">No summary available</p>
                  )}
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-500 text-center">
              {typeof version !== 'undefined' && (
                <p>Version {version} created successfully</p>
              )}
              <p>{documentTitle} processed</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="w-full">
            <X className="mr-2 h-4 w-4" />
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ViewGeminiOutput;



