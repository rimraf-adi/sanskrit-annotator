'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { IngestedDocument, ShlokaVerse } from '@/../lib/pipeline/types';
import { WordHover } from './WordHover';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Copy,
  Check,
  FileText,
  Sparkles,
  Layers,
  ArrowRight,
  Eye,
  Info
} from 'lucide-react';

interface DocumentReaderProps {
  document: IngestedDocument;
  onOpenIngestModal?: () => void;
}

export function DocumentReader({ document, onOpenIngestModal }: DocumentReaderProps) {
  const [zoom, setZoom] = useState<number>(100);
  const [showOcrDiff, setShowOcrDiff] = useState<boolean>(false);
  const [copiedVerse, setCopiedVerse] = useState<string | null>(null);

  const handleCopy = (verse: ShlokaVerse) => {
    const text = verse.lines.join('\n');
    navigator.clipboard.writeText(text);
    setCopiedVerse(verse.verseNumber);
    setTimeout(() => setCopiedVerse(null), 2000);
  };

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6">
      {/* Left Column: Original Scanned Image / PDF View */}
      <div className="w-full lg:w-1/2 flex flex-col rounded-2xl bg-stone-900/90 text-stone-100 shadow-xl overflow-hidden border border-stone-800">
        {/* Viewer Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 bg-stone-950 border-b border-stone-800 text-xs text-stone-300">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-stone-200">
              {(document.type || 'image').toUpperCase()} स्रोत (Source Scan)
            </span>
            <span className="text-stone-500 font-mono text-[11px]">
              {document.id}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-stone-900 px-2 py-1 rounded-lg border border-stone-800">
            <button
              onClick={() => setZoom(prev => Math.max(prev - 20, 60))}
              title="Zoom Out"
              className="p-1 hover:text-white rounded hover:bg-stone-800 transition"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono w-10 text-center">{zoom}%</span>
            <button
              onClick={() => setZoom(prev => Math.min(prev + 20, 200))}
              title="Zoom In"
              className="p-1 hover:text-white rounded hover:bg-stone-800 transition"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(100)}
              title="Reset Zoom"
              className="p-1 hover:text-white rounded hover:bg-stone-800 transition ml-1"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Image / Canvas Display */}
        <div className="relative flex-1 min-h-[500px] max-h-[750px] overflow-auto p-4 flex items-center justify-center bg-stone-950/70">
          {document.imageUrl ? (
            <div
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
              className="transition-transform duration-150 ease-out max-w-full"
            >
              <img
                src={document.imageUrl}
                alt="Sanskrit Scan Ground Truth"
                className="rounded-lg shadow-2xl border border-stone-800 object-contain max-h-[700px]"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-stone-400 text-center">
              <FileText className="w-12 h-12 text-stone-600 mb-3" />
              <p className="text-sm font-medium">Text Ingestion Mode (No Image Provided)</p>
              <p className="text-xs text-stone-500 mt-1">
                Verses parsed and indexed into 0ms memory cache.
              </p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-stone-950/90 border-t border-stone-800 flex items-center justify-between text-[11px] text-stone-400">
          <span>{document.versesCount || document.verses?.length || 0} श्लोकाः (Verses) Indexed</span>
          <span>{document.wordsCount || 0} पदानि (Words) Annotated</span>
        </div>
      </div>

      {/* Right Column: Interactive Shloka Verses with 0ms Hover */}
      <div className="w-full lg:w-1/2 flex flex-col">
        {/* Header with Title & OCR Diff Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-stone-200">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-serif font-bold text-stone-900 tracking-tight">
                {document.title}
              </h2>
              <span className="rounded-full bg-amber-100 text-amber-800 text-[10px] font-semibold px-2 py-0.5 border border-amber-300/60">
                0ms Hover Active
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Hover your cursor over any Sanskrit word for Instant Meaning, Root, Grammar, and Sandhi Vigrah.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowOcrDiff(!showOcrDiff)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                showOcrDiff
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>OCR Diff & ByT5</span>
            </button>
          </div>
        </div>

        {/* OCR Diff Notification if enabled */}
        {showOcrDiff && document.diffSummary && (
          <div className="mb-4 rounded-xl bg-amber-50/80 p-3.5 border border-amber-200/90 text-xs text-amber-900 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 font-semibold mb-1">
              <Sparkles className="w-4 h-4 text-amber-700" />
              <span>OCR Post-Correction Engine (ByT5 & N-gram Confusion Ranker)</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Applied glyph confusion corrections (e.g. <code>विषवत्यज</code> → <code>विषवत्त्यज</code>, <code>पिऊषवद्</code> → <code>पीयूषवद्</code>, <code>ईले</code> → <code>ईळे</code>). Accuracy gain: <strong>{document.diffSummary.accuracyGain}</strong>.
            </p>
          </div>
        )}

        {/* Verses Container */}
        <div className="space-y-4 max-h-[750px] overflow-y-auto pr-1">
          {document.verses.map((verse, idx) => (
            <div
              key={verse.verseNumber || idx}
              className="sanskrit-verse-card rounded-2xl p-5 transition-all hover:border-amber-300 hover:shadow-md"
            >
              {/* Verse Header */}
              <div className="flex items-center justify-between text-xs text-stone-500 mb-3 border-b border-stone-100 pb-2">
                <span className="font-serif font-semibold text-amber-900 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md">
                  श्लोकः {verse.verseNumber}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(verse)}
                    className="flex items-center gap-1 text-[11px] text-stone-500 hover:text-stone-800 transition"
                    title="Copy Sanskrit Verse"
                  >
                    {copiedVerse === verse.verseNumber ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700 font-medium">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Sanskrit Lines with Hoverable Tokens */}
              <div className="sanskrit-text text-xl md:text-2xl text-stone-900 leading-loose">
                {verse.lines.map((line, lIdx) => {
                  // Find tokens matching this line, supporting both tokens and words structure
                  const rawTokens = verse.tokens || (verse as any).words?.map((w: any) => ({
                    token: w.token,
                    cleanedToken: w.token.replace(/[।॥,;\.\s]/g, '').trim(),
                    annotation: {
                      token: w.token,
                      meaning: w.meaning,
                      root: w.root,
                      grammar: w.grammar,
                      sandhiVigraha: w.sandhiVigraha
                    }
                  })) || [];

                  const lineTokens = rawTokens.filter((tok: any) =>
                    line.includes(tok.token) || line.includes(tok.cleanedToken)
                  );

                  return (
                    <div key={lIdx} className="my-1.5 flex flex-wrap items-baseline gap-x-2">
                      {lineTokens.length > 0 ? (
                        lineTokens.map((tok: any, tIdx: number) => (
                          <WordHover key={`${tok.token}_${tIdx}`} wordToken={tok}>
                            <span>{tok.token}</span>
                          </WordHover>
                        ))
                      ) : (
                        <span>{line}</span>
                      )}
                      <span className="text-stone-400 font-serif font-bold text-lg select-none">
                        {lIdx === verse.lines.length - 1 ? `॥ १-${verse.verseNumber} ॥` : '।'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Raw OCR Comparison Line if toggled */}
              {showOcrDiff && verse.rawOcr && (
                <div className="mt-3 pt-2.5 border-t border-dashed border-stone-200 text-[11px] text-stone-500 font-mono">
                  <div className="flex items-center gap-1 text-stone-400 text-[10px] uppercase tracking-wider mb-0.5">
                    <span>Raw OCR Extract</span>
                  </div>
                  <div className="bg-stone-50 p-2 rounded text-stone-600">
                    {verse.rawOcr}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
