/**
 * OCR Engine for Sanskrit & Devanagari Documents
 * Uses Tesseract.js WebAssembly worker with Sanskrit/Devanagari traineddata
 */

import { createWorker } from 'tesseract.js';

export interface OcrResult {
  rawText: string;
  confidence: number;
  lines: string[];
}

export async function runSanskritOcr(imageSource: string | Buffer): Promise<OcrResult> {
  try {
    // Initialize Tesseract worker with Sanskrit/Hindi language pack
    const worker = await createWorker(['san', 'hin']);
    
    const ret = await worker.recognize(imageSource);
    await worker.terminate();

    const text = ret.data.text || '';
    const confidence = ret.data.confidence || 0;
    const lines = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    return {
      rawText: text,
      confidence,
      lines
    };
  } catch (err: any) {
    console.warn('[OCR Engine] Tesseract extraction warning, fallback applied:', err.message);
    return {
      rawText: '',
      confidence: 0,
      lines: []
    };
  }
}
