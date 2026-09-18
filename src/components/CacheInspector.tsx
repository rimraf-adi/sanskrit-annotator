'use client';

import React, { useState, useEffect } from 'react';
import { Database, Search, Layers } from 'lucide-react';
import { WordAnnotation } from '@/../lib/pipeline/types';

export function CacheInspector() {
  const [stats, setStats] = useState<any>({
    totalCachedPadas: 75,
    apteHeadwords: 34277,
    grassmannRigvedicEntries: 11108,
    morphologyRuleCount: 15,
    latency: '< 1ms (in-memory lookup)'
  });
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [lookupResult, setLookupResult] = useState<WordAnnotation | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  useEffect(() => {
    fetch('/api/pipeline/cache')
      .then(res => res.json())
      .then(data => {
        if (data.stats) setStats(data.stats);
      })
      .catch(() => {});
  }, []);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/pipeline/cache?word=${encodeURIComponent(searchTerm.trim())}`);
      const data = await res.json();
      if (data.annotation) {
        setLookupResult(data.annotation);
      }
    } catch (e) {}
    setIsSearching(false);
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-md border border-stone-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
        <div>
          <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-600" />
            Lexical Database & Corpus Index
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Curated morphological rules and indexed headwords across classical and Vedic lexicons.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[11px] bg-stone-100 text-stone-700 px-2.5 py-1 rounded-full border border-stone-200 font-medium">
            <Layers className="w-3 h-3 text-stone-500" />
            In-Memory Index
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80">
          <div className="text-[11px] text-stone-500 font-medium">Annotated Tokens</div>
          <div className="text-xl font-bold text-stone-900 mt-0.5">{stats.totalCachedPadas}</div>
          <div className="text-[10px] text-stone-500 font-medium mt-0.5">Pre-indexed Entries</div>
        </div>

        <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80">
          <div className="text-[11px] text-stone-500 font-medium">Apte (AP90)</div>
          <div className="text-xl font-bold text-stone-900 mt-0.5">34,277</div>
          <div className="text-[10px] text-stone-500 mt-0.5">Exact CDSL Headwords</div>
        </div>

        <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80">
          <div className="text-[11px] text-stone-500 font-medium">Grassmann (Rigveda)</div>
          <div className="text-xl font-bold text-stone-900 mt-0.5">11,108</div>
          <div className="text-[10px] text-stone-500 mt-0.5">Rigveda Citations</div>
        </div>

        <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80">
          <div className="text-[11px] text-stone-500 font-medium">Heritage Morphology</div>
          <div className="text-xl font-bold text-stone-900 mt-0.5">Active</div>
          <div className="text-[10px] text-stone-500 mt-0.5">Subanta & Tiṅanta</div>
        </div>
      </div>

      {/* Interactive Cache Lookup Search */}
      <div className="mt-4 pt-4 border-t border-stone-100">
        <form onSubmit={handleLookup} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Lookup headword or inflected token (e.g. मुक्तिमिच्छसि, अग्निम्, चिद्रूपं, शान्त)..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:border-amber-500 focus:outline-hidden"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-medium transition"
          >
            {isSearching ? 'Looking up...' : 'Lookup Token'}
          </button>
        </form>

        {lookupResult && (
          <div className="mt-3 p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs">
            <div className="flex items-center justify-between border-b border-amber-200/60 pb-2 mb-2">
              <span className="sanskrit-text text-base font-bold text-amber-950">
                {lookupResult.token} {lookupResult.iast && <span className="font-serif italic font-normal text-stone-600 text-xs">({lookupResult.iast})</span>}
              </span>
              <span className="text-[10px] text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full font-mono">
                {lookupResult.source || 'Persistent Cache'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-stone-700">
              {lookupResult.sandhiVigraha && (
                <div>
                  <strong className="text-amber-900">सन्धि-विच्छेद:</strong> {lookupResult.sandhiVigraha}
                </div>
              )}
              {lookupResult.root && (
                <div>
                  <strong className="text-orange-900">धातु:</strong> {lookupResult.root}
                </div>
              )}
              <div>
                <strong className="text-indigo-900">व्याकरण:</strong> {lookupResult.grammar}
              </div>
              <div className="sm:col-span-2">
                <strong className="text-emerald-900">अर्थ:</strong> {lookupResult.meaning}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
