import { NextRequest, NextResponse } from 'next/server';
import { processAndIndexDocument, getDocument } from '@/../lib/pipeline/cache_manager';
import { runSanskritOcr } from '@/../lib/pipeline/ocr';
import path from 'node:path';
import fs from 'node:fs';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    let id = 'doc_' + Date.now();
    let title = 'Untitled Ingested Document';
    let rawText = '';
    let imageUrl = '';
    let type: 'image' | 'pdf' | 'text' = 'text';

    if (contentType.includes('application/json')) {
      const body = await req.json();
      id = body.id || id;
      title = body.title || title;
      rawText = body.text || '';
      imageUrl = body.imageUrl || '';
      type = body.type || 'text';

      // If document is requested to load from ground truth
      if (body.preset === 'ground_truth') {
        const cached = getDocument('ashtavakra_ch1');
        if (cached) {
          return NextResponse.json({ success: true, document: cached });
        }
      }
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      title = (formData.get('title') as string) || (file ? file.name : 'Uploaded Scan');
      const textParam = formData.get('text') as string | null;

      if (file) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        const mimeType = file.type || 'image/png';
        const base64Str = buffer.toString('base64');
        imageUrl = `data:${mimeType};base64,${base64Str}`;
        type = file.type.includes('pdf') ? 'pdf' : 'image';

        // Best-effort local file write if filesystem is writable
        try {
          const uploadsDir = path.resolve(process.cwd(), 'public/uploads');
          if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
          const fileName = `${id}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
          fs.writeFileSync(path.join(uploadsDir, fileName), buffer);
        } catch (e) {
          // Read-only environment like Vercel Serverless; data URL handles display cleanly
        }

        if (textParam && textParam.trim().length > 0) {
          rawText = textParam;
        } else {
          // Run Devanagari OCR on image
          const ocrResult = await runSanskritOcr(buffer);
          rawText = ocrResult.rawText || textParam || '';
        }
      } else if (textParam) {
        rawText = textParam;
        type = 'text';
      }
    }

    if (!rawText.trim()) {
      return NextResponse.json(
        { error: 'No text extracted or provided for ingestion' },
        { status: 400 }
      );
    }

    const doc = await processAndIndexDocument({
      id,
      title,
      type,
      rawText,
      imageUrl
    });

    return NextResponse.json({ success: true, document: doc });
  } catch (error: any) {
    console.error('[API Ingest Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Pipeline ingestion failure' },
      { status: 500 }
    );
  }
}
