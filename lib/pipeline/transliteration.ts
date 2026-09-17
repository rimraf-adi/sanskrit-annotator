/**
 * High-precision Devanagari <-> IAST Transliterator
 */

const devaVowels: Record<string, string> = {
  'अ': 'a', 'आ': 'ā', 'इ': 'i', 'ई': 'ī', 'उ': 'u', 'ऊ': 'ū',
  'ऋ': 'ṛ', 'ॠ': 'ṝ', 'ऌ': 'ḷ', 'ॡ': 'ḹ',
  'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au'
};

const devaMatras: Record<string, string> = {
  'ा': 'ā', 'ि': 'i', 'ी': 'ī', 'ु': 'u', 'ू': 'ū',
  'ृ': 'ṛ', 'ॄ': 'ṝ', 'ॢ': 'ḷ', 'ॣ': 'ḹ',
  'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au'
};

const devaConsonants: Record<string, string> = {
  'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ṅ',
  'च': 'c', 'छ': 'ch', 'ज': 'j', 'झ': 'jh', 'ञ': 'ñ',
  'ट': 'ṭ', 'ठ': 'ṭh', 'ड': 'ḍ', 'ढ': 'ḍh', 'ण': 'ṇ',
  'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
  'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
  'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v',
  'श': 'ś', 'ष': 'ṣ', 'स': 's', 'ह': 'h',
  'ळ': 'ḷ', 'क्ष': 'kṣ', 'ज्ञ': 'jñ'
};

const devaSpecials: Record<string, string> = {
  'ं': 'ṃ', 'ः': 'ḥ', 'ँ': 'm̐', 'ऽ': "'", '।': '|', '॥': '||'
};

export function devanagariToIast(text: string): string {
  if (!text) return '';
  let out = '';
  const len = text.length;
  let i = 0;

  while (i < len) {
    const char = text[i];
    const next = text[i + 1] || '';

    if (devaVowels[char]) {
      out += devaVowels[char];
      i++;
    } else if (devaConsonants[char]) {
      const roman = devaConsonants[char];
      if (next === '्') {
        // Halanta
        out += roman;
        i += 2;
      } else if (devaMatras[next]) {
        out += roman + devaMatras[next];
        i += 2;
      } else {
        // Inherent 'a'
        out += roman + 'a';
        i++;
      }
    } else if (devaSpecials[char]) {
      out += devaSpecials[char];
      i++;
    } else if (char === '्') {
      i++;
    } else {
      out += char;
      i++;
    }
  }
  return out;
}

export function cleanSanskritToken(token: string): string {
  return token.replace(/[।॥,;:\.0-9१-९\-\s]/g, '').trim();
}
