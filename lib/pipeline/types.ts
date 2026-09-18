export interface ConstituentPada {
  pada: string;
  lemma?: string;
  root?: string;
  type?: string;
  vibhakti?: string;
  vacana?: string;
  linga?: string;
  lakara?: string;
  purusha?: string;
  meaning: string;
  grammar?: string;
}

export interface WordAnnotation {
  token: string;
  lemma?: string;
  iast?: string;
  meaning: string;
  root?: string;
  rootIast?: string;
  gana?: string;
  padaType?: string;
  grammar: string;
  type?: 'subanta' | 'tinganta' | 'avyaya' | 'krdanta' | 'taddhita' | 'samasa';
  vibhakti?: string;
  vacana?: string;
  linga?: string;
  lakara?: string;
  purusha?: string;
  sandhiVigraha?: string;
  sandhiRules?: string[];
  padas?: ConstituentPada[];
  vedicCitation?: string;
  source?: string;
  verse?: string;
}

export interface WordToken {
  token: string;
  cleanedToken: string;
  annotation: WordAnnotation;
}

export interface ShlokaVerse {
  verseNumber: string;
  rawOcr?: string;
  correctedText: string;
  lines: string[];
  tokens: WordToken[];
}

export interface IngestedDocument {
  id: string;
  title: string;
  type: 'image' | 'pdf' | 'text';
  imageUrl?: string;
  pdfUrl?: string;
  totalPages?: number;
  versesCount: number;
  wordsCount: number;
  verses: ShlokaVerse[];
  status: 'pending' | 'processing' | 'indexed' | 'error';
  indexedAt: string;
  rawOcrText?: string;
  correctedText?: string;
  diffSummary?: {
    totalChars: number;
    correctedChars: number;
    accuracyGain: string;
  };
}

export interface DocumentRegistryItem {
  id: string;
  title: string;
  type: 'image' | 'pdf' | 'text';
  imageUrl?: string;
  versesCount: number;
  wordsCount: number;
  status: 'indexed' | 'processing';
  indexedAt: string;
}
