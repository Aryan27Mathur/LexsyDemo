import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: NextRequest) {
  try {
    // TODO: Add proper authentication check here
    
    // Check AWS credentials
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.error('AWS credentials not configured');
      return NextResponse.json({ 
        error: 'AWS credentials not configured',
        details: 'Please check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables'
      }, { status: 500 });
    }
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentId = formData.get('documentId') as string;

    if (!file || !documentId) {
      return NextResponse.json({ 
        error: 'Missing required fields', 
        details: {
          file: !file ? 'File is required' : null,
          documentId: !documentId ? 'Document ID is required' : null
        }
      }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Get file extension from original filename
    const fileExtension = file.name.split('.').pop() || '';
    const s3Key = `documents/${documentId}${fileExtension ? '.' + fileExtension : ''}`;
    
    const uploadCommand = new PutObjectCommand({
      Bucket: 'helianfiles',
      Key: s3Key,
      Body: buffer,
      ContentType: file.type,
      Metadata: {
        documentId,
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        contentType: file.type,
      },
    });

    await s3Client.send(uploadCommand);

    return NextResponse.json({
      success: true,
      document: {
        id: documentId,
        originalName: file.name,
        size: file.size,
        contentType: file.type,
        s3Key,
      },
    });

  } catch (error) {
    console.error('S3 upload error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload document to storage',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}