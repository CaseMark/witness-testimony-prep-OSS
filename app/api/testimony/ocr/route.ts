import { NextRequest, NextResponse } from 'next/server';
import { processDocumentOCR } from '@/lib/case-dev/api';
import { DEMO_LIMITS } from '@/lib/demo-limits/config';

// POST /api/testimony/ocr - Process a document with OCR
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check file size limit
    if (file.size > DEMO_LIMITS.ocr.maxFileSize) {
      const maxSizeMB = (DEMO_LIMITS.ocr.maxFileSize / (1024 * 1024)).toFixed(0);
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return NextResponse.json(
        {
          error: `File size (${fileSizeMB}MB) exceeds demo limit of ${maxSizeMB}MB`,
          limitReached: true,
          limitType: 'fileSize',
        },
        { status: 400 }
      );
    }

    // Check file type
    const allowedTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/tiff',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.tiff', '.doc', '.docx'];

    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const isAllowedType = allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension);

    if (!isAllowedType) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: PDF, PNG, JPG, TIFF, DOC, DOCX' },
        { status: 400 }
      );
    }

    // For text files, read directly without OCR
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      const text = await file.text();
      return NextResponse.json({
        text,
        pageCount: 1,
        status: 'completed',
        ocrUsed: false,
      });
    }

    // Process with OCR
    try {
      const result = await processDocumentOCR(file, file.name);

      // Check page count limit
      const pageCount = result.page_count || result.pages?.length || 1;
      if (pageCount > DEMO_LIMITS.ocr.maxPagesPerDocument) {
        return NextResponse.json(
          {
            error: `Document has ${pageCount} pages, exceeds demo limit of ${DEMO_LIMITS.ocr.maxPagesPerDocument} pages`,
            limitReached: true,
            limitType: 'pagesPerDocument',
            pageCount,
          },
          { status: 400 }
        );
      }

      // Combine all page text
      let fullText = '';
      if (result.pages && Array.isArray(result.pages)) {
        fullText = result.pages.map(p => p.text).join('\n\n--- Page Break ---\n\n');
      } else if (result.text) {
        fullText = result.text;
      }

      return NextResponse.json({
        text: fullText,
        pageCount,
        status: 'completed',
        ocrUsed: true,
      });
    } catch (ocrError) {
      console.error('OCR processing error:', ocrError);

      // Fallback: return placeholder for non-text documents
      return NextResponse.json({
        text: `[Document: ${file.name}]\n\nOCR processing is currently unavailable. Please upload a text file (.txt) for full content analysis, or try again later.`,
        pageCount: 1,
        status: 'fallback',
        ocrUsed: false,
        error: 'OCR service temporarily unavailable',
      });
    }
  } catch (error) {
    console.error('Error processing document:', error);
    return NextResponse.json(
      { error: 'Failed to process document' },
      { status: 500 }
    );
  }
}
