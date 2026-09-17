import { NextRequest, NextResponse } from 'next/server';
import { listDocuments, getDocument } from '@/../lib/pipeline/cache_manager';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const doc = getDocument(id);
      if (!doc) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, document: doc });
    }

    const docs = listDocuments();
    return NextResponse.json({ success: true, documents: docs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
