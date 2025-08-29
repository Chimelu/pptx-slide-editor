import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    message: 'PPTX Parser Test Endpoint',
    status: 'ready',
    features: [
      'PPTX file parsing with JSZip',
      'Slide extraction and object parsing',
      'Text, image, shape, and group support',
      'Theme and metadata extraction',
      'Relationship mapping for media files',
      'Error handling and validation',
      'CORS support'
    ],
    maxFileSize: '10MB',
    supportedFormats: ['.pptx'],
    objectTypes: ['text', 'image', 'shape', 'group', 'chart']
  })
}
