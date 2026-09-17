'use client';

import React from 'react';
import { Sparkles, BookOpen, Layers, PlusCircle, Database, Check } from 'lucide-react';
import { DocumentRegistryItem } from '@/../lib/pipeline/types';

interface NavbarProps {
  documents: DocumentRegistryItem[];
  currentDocId: string;
  onSelectDoc: (id: string) => void;
  onOpenIngest: () => void;
  activeView: 'reader' | 'ingest' | 'cache';
  setActiveView: (view: 'reader' | 'ingest' | 'cache') => void;
}

export function Navbar({
  documents,
  currentDocId,
  onSelectDoc,
  onOpenIngest,
  activeView,
  setActiveView
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 bg-[#faf8f5]/90 backdrop-blur-md border-b border-stone-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-serif font-bold text-xl shadow-md shadow-amber-600/20">
            ॐ
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif font-bold text-stone-900 text-lg tracking-tight">
                Sanskrit Live
              </h1>
              <span className="bg-amber-100/90 text-amber-800 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-amber-200">
                0ms Incremental Annotations
              </span>
            </div>
            <p className="text-[11px] text-stone-500 font-sans hidden sm:block">
              Exact CDSL Dictionaries • ByT5 OCR Post-Correction • Sandhi Vigraha
            </p>
          </div>
        </div>

        {/* Navigation Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Document Switcher Dropdown */}
          <select
            value={currentDocId}
            onChange={e => onSelectDoc(e.target.value)}
            className="text-xs bg-white border border-stone-300 rounded-lg px-3 py-1.5 font-medium text-stone-700 focus:border-amber-500 focus:outline-hidden max-w-[180px] sm:max-w-[240px] truncate"
          >
            {documents.map(doc => (
              <option key={doc.id} value={doc.id}>
                {doc.title} ({doc.versesCount} श्लोकाः)
              </option>
            ))}
          </select>

          {/* View Toggles */}
          <div className="flex items-center bg-stone-200/70 p-1 rounded-xl">
            <button
              onClick={() => setActiveView('reader')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                activeView === 'reader'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Reader
            </button>
            <button
              onClick={() => setActiveView('ingest')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                activeView === 'ingest'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Ingest</span>
            </button>
            <button
              onClick={() => setActiveView('cache')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                activeView === 'cache'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Cache</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
