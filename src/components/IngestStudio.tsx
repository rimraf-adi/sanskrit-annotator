'use client';

import React, { useState } from 'react';
import { Upload, FileUp, Sparkles, CheckCircle2, Loader2, BookOpen, Layers, ArrowRight } from 'lucide-react';
import { IngestedDocument } from '@/../lib/pipeline/types';

interface IngestStudioProps {
  onDocumentIndexed: (doc: IngestedDocument) => void;
  onClose?: () => void;
}

export function IngestStudio({ onDocumentIndexed, onClose }: IngestStudioProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'text' | 'presets'>('presets');
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState<string>('');
  const [pastedText, setPastedText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const steps = [
    'Document Normalization & Upload',
    'Devanagari OCR Extraction (Tesseract)',
    'Post-Correction (ByT5 & Confusion Ranker)',
    'Sandhi Vigraha & Multi-Lexicon Resolution',
    'Incremental Persistent Cache Commit'
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!title) setTitle(selected.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleRunPipeline = async (type: 'file' | 'text' | 'preset', presetId?: string) => {
    setIsProcessing(true);
    setErrorMsg(null);
    setCurrentStep(1);

    try {
      let res: Response;

      if (type === 'preset') {
        setCurrentStep(2);
        await new Promise(r => setTimeout(r, 300));
        setCurrentStep(3);
        await new Promise(r => setTimeout(r, 400));
        setCurrentStep(4);

        if (presetId === 'ground_truth') {
          res = await fetch('/api/pipeline/ingest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ preset: 'ground_truth' })
          });
        } else if (presetId === 'rigveda_1_1') {
          res = await fetch('/api/pipeline/ingest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: 'rigveda_1_1',
              title: 'Rigveda Hymn 1.1 (Agni Sukta)',
              text: 'अग्निमीळे पुरोहितं यज्ञस्य देवमृत्विजम् । होतारं रत्नधातमम् ॥ १ ॥ अग्निः पूर्वेभिरृषिभिरीड्यो नूतनैरुत । स देवाँ एह वक्षति ॥ २ ॥',
              type: 'text'
            })
          });
        } else {
          res = await fetch('/api/pipeline/ingest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: 'gita_2_47',
              title: 'Bhagavad Gita - Chapter 2 Verse 47',
              text: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन । मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि ॥ २-४७ ॥',
              type: 'text'
            })
          });
        }
      } else if (type === 'text') {
        if (!pastedText.trim()) throw new Error('Please enter Sanskrit text to index');
        setCurrentStep(2);
        await new Promise(r => setTimeout(r, 200));
        setCurrentStep(3);

        res = await fetch('/api/pipeline/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title || 'Custom Ingested Sanskrit Verses',
            text: pastedText,
            type: 'text'
          })
        });
      } else {
        if (!file) throw new Error('Please select an image or PDF file to upload');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title || file.name);

        setCurrentStep(2);
        res = await fetch('/api/pipeline/ingest', {
          method: 'POST',
          body: formData
        });
      }

      setCurrentStep(5);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Ingestion pipeline error');
      }

      await new Promise(r => setTimeout(r, 400));
      setIsProcessing(false);
      onDocumentIndexed(data.document);
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMsg(err.message || 'Failed to process document');
    }
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-xl border border-stone-200">
      <div className="flex items-center justify-between pb-4 border-b border-stone-100">
        <div>
          <h3 className="text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600" />
            Corpus Ingestion Studio
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Ingest Sanskrit manuscripts, scans, or text documents with automated morphological resolution.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 my-5">
        <button
          onClick={() => setActiveTab('presets')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            activeTab === 'presets'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          Canonical Texts
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            activeTab === 'upload'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          Upload PDF / Image
        </button>
        <button
          onClick={() => setActiveTab('text')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            activeTab === 'text'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          Direct Sanskrit Text
        </button>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
          {errorMsg}
        </div>
      )}

      {/* Pipeline Progress Stepper */}
      {isProcessing && (
        <div className="my-6 p-4 rounded-xl bg-amber-50/60 border border-amber-200">
          <div className="flex items-center gap-2 font-semibold text-amber-950 text-xs mb-3">
            <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
            <span>Executing Ingestion & Multi-Lexicon Resolution...</span>
          </div>

          <div className="space-y-2">
            {steps.map((step, idx) => {
              const isDone = currentStep > idx + 1;
              const isCurrent = currentStep === idx + 1;
              return (
                <div key={idx} className="flex items-center gap-2.5 text-xs">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : isCurrent ? (
                    <div className="w-4 h-4 rounded-full border-2 border-amber-600 border-t-transparent animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-stone-300" />
                  )}
                  <span className={`${isCurrent ? 'font-semibold text-amber-900' : isDone ? 'text-stone-700 line-through' : 'text-stone-400'}`}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 1: Presets */}
      {activeTab === 'presets' && !isProcessing && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            onClick={() => handleRunPipeline('preset', 'ground_truth')}
            className="group cursor-pointer rounded-xl border border-stone-200 p-4 transition-all hover:border-amber-400 hover:shadow-md bg-stone-50/60"
          >
            <div className="flex items-center justify-between text-xs text-amber-700 font-semibold mb-2">
              <span>Manuscript Scan</span>
              <span className="text-[10px] bg-amber-100 px-1.5 py-0.5 rounded">Ashtavakra Gita</span>
            </div>
            <h4 className="font-serif font-bold text-stone-900 text-sm">
              Chapter 1 (Verses 1.2 - 1.8)
            </h4>
            <p className="text-xs text-stone-500 mt-1">
              High-resolution scan with full verse segmentation, Sandhi Vigraha, and morphological parsing.
            </p>
            <button className="mt-3 text-xs font-semibold text-amber-800 flex items-center gap-1 group-hover:translate-x-0.5 transition">
              Load & Inspect <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div
            onClick={() => handleRunPipeline('preset', 'rigveda_1_1')}
            className="group cursor-pointer rounded-xl border border-stone-200 p-4 transition-all hover:border-amber-400 hover:shadow-md bg-stone-50/60"
          >
            <div className="flex items-center justify-between text-xs text-amber-700 font-semibold mb-2">
              <span>Vedic Samhita</span>
              <span className="text-[10px] bg-amber-100 px-1.5 py-0.5 rounded">Rigveda 1.1</span>
            </div>
            <h4 className="font-serif font-bold text-stone-900 text-sm">
              अग्नि सूक्त (Agni Sukta)
            </h4>
            <p className="text-xs text-stone-500 mt-1">
              Rigveda Mandala 1, Hymn 1 with Vedic morphology and Grassmann Rig-Veda lexicon cross-referencing.
            </p>
            <button className="mt-3 text-xs font-semibold text-amber-800 flex items-center gap-1 group-hover:translate-x-0.5 transition">
              Ingest & Index <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div
            onClick={() => handleRunPipeline('preset', 'gita_2_47')}
            className="group cursor-pointer rounded-xl border border-stone-200 p-4 transition-all hover:border-amber-400 hover:shadow-md bg-stone-50/60"
          >
            <div className="flex items-center justify-between text-xs text-amber-700 font-semibold mb-2">
              <span>Philosophical Smriti</span>
              <span className="text-[10px] bg-amber-100 px-1.5 py-0.5 rounded">Gita 2.47</span>
            </div>
            <h4 className="font-serif font-bold text-stone-900 text-sm">
              कर्मण्येवाधिकारस्ते
            </h4>
            <p className="text-xs text-stone-500 mt-1">
              Bhagavad Gita 2.47 featuring compound sandhi decomposition, verbal roots, and case inflection analysis.
            </p>
            <button className="mt-3 text-xs font-semibold text-amber-800 flex items-center gap-1 group-hover:translate-x-0.5 transition">
              Ingest & Index <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Upload File */}
      {activeTab === 'upload' && !isProcessing && (
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-700">Document Title</label>
            <input
              type="text"
              placeholder="e.g. Isha Upanishad Scan / Gita Chapter 3"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="rounded-lg border border-stone-300 px-3 py-2 text-xs focus:border-amber-500 focus:outline-hidden"
            />
          </div>

          <div className="rounded-xl border-2 border-dashed border-stone-300 p-6 text-center hover:border-amber-500 transition cursor-pointer relative bg-stone-50/50">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <FileUp className="w-8 h-8 text-stone-400 mx-auto mb-2" />
            <p className="text-xs font-medium text-stone-700">
              {file ? file.name : 'Click to select or drag & drop any PDF or Image'}
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Supports PNG, JPG, TIFF, WebP, PDF. Devanagari OCR will automatically run.
            </p>
          </div>

          <button
            onClick={() => handleRunPipeline('file')}
            disabled={!file}
            className="w-full rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium py-2.5 text-xs transition disabled:opacity-50 shadow-xs"
          >
            Process & Index Document
          </button>
        </div>
      )}

      {/* Tab 3: Paste Text */}
      {activeTab === 'text' && !isProcessing && (
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-700">Document Title</label>
            <input
              type="text"
              placeholder="e.g. Mandukya Karika"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="rounded-lg border border-stone-300 px-3 py-2 text-xs focus:border-amber-500 focus:outline-hidden"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-stone-700">Devanagari Verses</label>
            <textarea
              rows={5}
              placeholder="Paste any Sanskrit shlokas with । and ॥ ..."
              value={pastedText}
              onChange={e => setPastedText(e.target.value)}
              className="sanskrit-text text-sm rounded-lg border border-stone-300 p-3 focus:border-amber-500 focus:outline-hidden"
            />
          </div>

          <button
            onClick={() => handleRunPipeline('text')}
            disabled={!pastedText.trim()}
            className="w-full rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium py-2.5 text-xs transition disabled:opacity-50 shadow-xs"
          >
            Tokenize & Annotate Verses
          </button>
        </div>
      )}
    </div>
  );
}
