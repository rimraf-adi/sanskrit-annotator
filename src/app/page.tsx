'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { DocumentReader } from '@/components/DocumentReader';
import { IngestStudio } from '@/components/IngestStudio';
import { CacheInspector } from '@/components/CacheInspector';
import { IngestedDocument, DocumentRegistryItem } from '@/../lib/pipeline/types';
import { Sparkles, BookOpen, Layers, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

export default function Home() {
  const [documents, setDocuments] = useState<DocumentRegistryItem[]>([]);
  const [currentDocId, setCurrentDocId] = useState<string>('ashtavakra_ch1');
  const [currentDoc, setCurrentDoc] = useState<IngestedDocument | null>(null);
  const [activeView, setActiveView] = useState<'reader' | 'ingest' | 'cache'>('reader');
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch document list and ground truth doc
  useEffect(() => {
    async function loadInitial() {
      try {
        const regRes = await fetch('/api/pipeline/documents');
        const regData = await regRes.json();
        if (regData.documents && regData.documents.length > 0) {
          setDocuments(regData.documents);
          const initialId = regData.documents[0].id;
          setCurrentDocId(initialId);
          
          const docRes = await fetch(`/api/pipeline/documents?id=${initialId}`);
          const docData = await docRes.json();
          if (docData.document) {
            setCurrentDoc(docData.document);
          }
        }
      } catch (err) {
        console.error('Error fetching initial documents:', err);
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, []);

  const handleSelectDoc = async (id: string) => {
    setCurrentDocId(id);
    setLoading(true);
    try {
      const res = await fetch(`/api/pipeline/documents?id=${id}`);
      const data = await res.json();
      if (data.document) {
        setCurrentDoc(data.document);
        setActiveView('reader');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentIndexed = (newDoc: IngestedDocument) => {
    setCurrentDoc(newDoc);
    setCurrentDocId(newDoc.id);
    setDocuments(prev => [
      {
        id: newDoc.id,
        title: newDoc.title,
        type: newDoc.type,
        imageUrl: newDoc.imageUrl,
        versesCount: newDoc.versesCount,
        wordsCount: newDoc.wordsCount,
        status: 'indexed',
        indexedAt: newDoc.indexedAt
      },
      ...prev.filter(d => d.id !== newDoc.id)
    ]);
    setActiveView('reader');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f6f0] text-stone-900">
      <Navbar
        documents={documents}
        currentDocId={currentDocId}
        onSelectDoc={handleSelectDoc}
        onOpenIngest={() => setActiveView('ingest')}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      {/* Hero Banner with Pipeline Specs */}
      <section className="bg-white/80 border-b border-stone-200/80 px-4 py-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-600">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-stone-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              Incremental Architecture:
            </span>
            <span className="rounded-md bg-stone-100 px-2 py-0.5 border border-stone-200/60 font-mono text-[11px]">
              0ms Latency Hover
            </span>
            <span className="rounded-md bg-stone-100 px-2 py-0.5 border border-stone-200/60 font-mono text-[11px]">
              Apte AP90 (34,277)
            </span>
            <span className="rounded-md bg-stone-100 px-2 py-0.5 border border-stone-200/60 font-mono text-[11px]">
              Grassmann Rigveda (11,108)
            </span>
            <span className="rounded-md bg-stone-100 px-2 py-0.5 border border-stone-200/60 font-mono text-[11px]">
              Heritage Morphology
            </span>
          </div>

          <div className="flex items-center gap-2 text-stone-500 font-mono text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Vercel Deployable (Self-Contained Next.js)</span>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {loading && (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-stone-500">
            <div className="w-8 h-8 rounded-full border-2 border-amber-600 border-t-transparent animate-spin mb-3" />
            <p className="text-sm font-serif">Loading Precomputed Sanskrit Cache...</p>
          </div>
        )}

        {!loading && activeView === 'reader' && currentDoc && (
          <DocumentReader
            document={currentDoc}
            onOpenIngestModal={() => setActiveView('ingest')}
          />
        )}

        {!loading && activeView === 'ingest' && (
          <div className="max-w-3xl mx-auto">
            <IngestStudio
              onDocumentIndexed={handleDocumentIndexed}
              onClose={() => setActiveView('reader')}
            />
          </div>
        )}

        {!loading && activeView === 'cache' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <CacheInspector />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white/70 py-6 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>Sanskrit Live</strong> — Complete Incremental Shloka Annotation Pipeline
          </div>
          <div>
            Sources: CDSL Monier-Williams • CDSL Apte (1890) • Grassmann Rig-Veda • Sanskrit Heritage
          </div>
        </div>
      </footer>
    </div>
  );
}
