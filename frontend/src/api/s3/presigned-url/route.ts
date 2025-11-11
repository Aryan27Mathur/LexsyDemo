import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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
    // For now, we'll allow presigned URL generation but you should implement proper auth

    // Check AWS credentials
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.error('AWS credentials not configured');
      return NextResponse.json({ 
        error: 'AWS credentials not configured',
        details: 'Please check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables'
      }, { status: 500 });
    }

    const { documentId } = await request.json();

    if (!documentId) {
      return NextResponse.json({ error: 'Missing documentId' }, { status: 400 });
    }

    // Try to find the file - first without extension (old files), then with common extensions
    let foundKey = null;
    const baseKey = `documents/${documentId}`;
    
    // Common file extensions to try
    const commonExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'stl'];
    
    // First, try without extension (for old files)
    try {
      const testCommand = new HeadObjectCommand({
        Bucket: 'helianfiles',
        Key: baseKey,
      });
      await s3Client.send(testCommand);
      foundKey = baseKey;
    } catch {
      // If no file without extension, try with common extensions
      for (const extension of commonExtensions) {
        try {
          const keyWithExtension = `${baseKey}.${extension}`;
          const testCommand = new HeadObjectCommand({
            Bucket: 'helianfiles',
            Key: keyWithExtension,
          });
          await s3Client.send(testCommand);
          foundKey = keyWithExtension;
          break; // Found the file, stop searching
        } catch {
          // Continue to next extension
          continue;
        }
      }
    }

    if (!foundKey) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Generate presigned URL for GET operation (expires in 1 hour)
    const command = new GetObjectCommand({
      Bucket: 'helianfiles',
      Key: foundKey,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    return NextResponse.json({
      success: true,
      presignedUrl,
      expiresIn: 3600,
      documentId,
    });

  } catch (error) {
    console.error('Presigned URL generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate presigned URL', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}