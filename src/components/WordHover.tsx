'use client';

import React, { useState, useRef, useEffect } from 'react';
import { WordToken, WordAnnotation } from '@/../lib/pipeline/types';
import { Sparkles, BookOpen, Layers, Split, Feather } from 'lucide-react';

interface WordHoverProps {
  wordToken: WordToken;
  children: React.ReactNode;
}

export function WordHover({ wordToken, children }: WordHoverProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; placeAbove: boolean }>({
    top: 0,
    left: 0,
    placeAbove: true
  });

  const triggerRef = useRef<HTMLSpanElement>(null);
  const enterTimerRef = useRef<NodeJS.Timeout | null>(null);
  const leaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const annotation: WordAnnotation = wordToken.annotation || {
    token: wordToken.token,
    meaning: 'अन्वेषणीय पद',
    grammar: 'सामान्य पद'
  };

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = 360;
    const tooltipHeight = 220;

    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    if (left < 16) left = 16;
    if (left + tooltipWidth > window.innerWidth - 16) {
      left = window.innerWidth - tooltipWidth - 16;
    }

    const spaceAbove = rect.top;
    const placeAbove = spaceAbove > tooltipHeight + 12;
    const top = placeAbove
      ? rect.top + window.scrollY - 8
      : rect.bottom + window.scrollY + 8;

    setCoords({ top, left, placeAbove });
  };

  const handleMouseEnter = () => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }

    // Micro-delay (45ms): virtually zero delay, but eliminates jitter when sweeping across text
    enterTimerRef.current = setTimeout(() => {
      updatePosition();
      setIsMounted(true);
      // Trigger animation on next frame
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    }, 45);
  };

  const handleMouseLeave = () => {
    if (enterTimerRef.current) {
      clearTimeout(enterTimerRef.current);
      enterTimerRef.current = null;
    }

    // Gentle exit: fade out smoothly over 140ms before unmounting
    leaveTimerRef.current = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        setIsMounted(false);
      }, 140);
    }, 50);
  };

  useEffect(() => {
    return () => {
      if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
  }, []);

  return (
    <span
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`hover-trigger relative inline-block cursor-help select-text font-medium transition-all duration-200 ease-out rounded-sm px-1 -mx-0.5 border-b border-dotted ${
        isVisible
          ? 'bg-amber-100/90 text-amber-950 border-amber-500 shadow-xs ring-2 ring-amber-300/60'
          : 'text-stone-900 border-amber-400/70 hover:bg-amber-50 hover:text-amber-900'
      }`}
    >
      {children}

      {isMounted && (
        <div
          role="tooltip"
          style={{
            position: 'fixed',
            top: coords.placeAbove ? 'auto' : `${coords.top - window.scrollY}px`,
            bottom: coords.placeAbove ? `${window.innerHeight - (coords.top - window.scrollY)}px` : 'auto',
            left: `${coords.left}px`,
            width: '360px',
            zIndex: 9999,
            transition: 'opacity 140ms cubic-bezier(0.16, 1, 0.3, 1), transform 140ms cubic-bezier(0.16, 1, 0.3, 1)',
            transform: isVisible
              ? 'translateY(0px) scale(1)'
              : coords.placeAbove
              ? 'translateY(6px) scale(0.97)'
              : 'translateY(-6px) scale(0.97)',
            opacity: isVisible ? 1 : 0
          }}
          className="pointer-events-none rounded-xl bg-white/95 backdrop-blur-md p-4 shadow-2xl border border-amber-200/90 text-stone-800 text-xs font-sans ring-1 ring-amber-950/5 will-change-transform"
        >
          {/* Header: Token & IAST */}
          <div className="border-b border-stone-100 pb-2.5 mb-2.5">
            <div className="flex items-baseline gap-2">
              <span className="sanskrit-text text-xl font-bold text-amber-950">
                {wordToken.cleanedToken || wordToken.token}
              </span>
              {annotation.iast && (
                <span className="font-serif italic text-stone-500 text-sm">
                  {annotation.iast}
                </span>
              )}
            </div>
            {annotation.lemma && annotation.lemma !== wordToken.cleanedToken && (
              <div className="text-[11px] text-stone-400 mt-0.5">
                मूल पद / Lemma: <span className="text-stone-600 font-semibold">{annotation.lemma}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {/* 1. Sandhi Vigraha (सन्धि-विग्रह) */}
            {annotation.sandhiVigraha && (
              <div className="rounded-lg bg-amber-50/70 p-2 border border-amber-100/80">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-900 mb-1">
                  <Split className="w-3.5 h-3.5 text-amber-700" />
                  <span>सन्धि-विग्रह (Sandhi Split)</span>
                </div>
                <div className="font-medium text-amber-950 text-xs tracking-wide">
                  {annotation.sandhiVigraha}
                </div>
                {annotation.sandhiRules && annotation.sandhiRules.length > 0 && (
                  <div className="text-[10px] text-amber-700/80 mt-1 italic">
                    नियम: {annotation.sandhiRules.join(', ')}
                  </div>
                )}
              </div>
            )}

            {/* 2. Root (धातु) & Verb Class (गण) */}
            {annotation.root && (
              <div className="flex items-baseline gap-1.5 text-stone-700">
                <span className="font-semibold text-stone-500 flex items-center gap-1 min-w-[55px]">
                  <Feather className="w-3 h-3 text-orange-600" />
                  धातु:
                </span>
                <span className="font-medium text-stone-900 bg-stone-100 px-1.5 py-0.5 rounded text-[11px]">
                  {annotation.root} {annotation.gana ? `(${annotation.gana})` : ''}
                </span>
                {annotation.padaType && (
                  <span className="text-[10px] text-stone-400">[{annotation.padaType}]</span>
                )}
              </div>
            )}

            {/* 3. Grammar (व्याकरण: विभक्ति, वचन, लकार) */}
            <div className="flex items-baseline gap-1.5 text-stone-700">
              <span className="font-semibold text-stone-500 flex items-center gap-1 min-w-[55px]">
                <Layers className="w-3 h-3 text-indigo-600" />
                व्याकरण:
              </span>
              <span className="text-stone-800 text-[11px] leading-relaxed">
                {annotation.grammar}
              </span>
            </div>

            {/* 4. Meaning (अर्थ) */}
            <div className="flex items-baseline gap-1.5 text-stone-700">
              <span className="font-semibold text-stone-500 flex items-center gap-1 min-w-[55px]">
                <BookOpen className="w-3 h-3 text-emerald-600" />
                अर्थ:
              </span>
              <span className="text-stone-800 font-normal text-[11px] leading-relaxed">
                {annotation.meaning}
              </span>
            </div>

            {/* 5. Rigvedic citation if present */}
            {annotation.vedicCitation && (
              <div className="text-[10px] text-amber-800 bg-amber-100/50 rounded px-2 py-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
                <span>ऋग्वेद संदर्भ: <strong>{annotation.vedicCitation}</strong></span>
              </div>
            )}
          </div>

          {/* Footer: Lexicon Source */}
          <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-400">
            <span>कोष संदर्भ (Lexicon): <span className="text-stone-600 font-medium">{annotation.source || 'Monier-Williams & Apte'}</span></span>
          </div>
        </div>
      )}
    </span>
  );
}
