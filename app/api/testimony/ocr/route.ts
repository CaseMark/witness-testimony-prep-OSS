import { NextRequest, NextResponse } from 'next/server';

// POST /api/testimony/ocr - Process a document (client-side extraction, server validates)
// Note: This endpoint name is historical - it no longer uses OCR
// Text extraction happens client-side using PDF.js for PDFs and File.text() for text files
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, pageCount, fileName } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      text,
      pageCount: pageCount || 1,
      status: 'completed',
      fileName,
      cost: 0,
      charsProcessed: text.length,
    });
  } catch (error) {
    console.error('Error processing document:', error);
    return NextResponse.json(
      { error: 'Failed to process document' },
      { status: 500 }
    );
  }
}
