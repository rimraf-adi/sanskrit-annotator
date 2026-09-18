/**
 * Comprehensive Sanskrit Morphology & Multi-Lexicon Resolution Engine
 * Resolves padas across:
 * 1. Incremental Persistent Cache
 * 2. Sanskrit Heritage Morphology Database
 * 3. V.S. Apte Practical Sanskrit-English Dictionary (AP90)
 * 4. Hermann Grassmann Rig-Veda Dictionary (GRA)
 * 5. Monier-Williams Sanskrit-English Dictionary (MW)
 * 6. Classical Paninian Subanta & Tinganta Rule Heuristics
 */

import fs from 'node:fs';
import path from 'node:path';
import { WordAnnotation } from './types';
import { devanagariToIast, cleanSanskritToken } from './transliteration';
import { analyzeSandhi } from './sandhi';

// In-memory lazy caches for 0ms execution
let cachedAnnotations: Record<string, WordAnnotation> | null = null;
let heritageMorphology: Record<string, any> | null = null;
let apteLexicon: Record<string, any> | null = null;
let grassmannLexicon: Record<string, any> | null = null;
let mwLexicon: Record<string, any> | null = null;

function loadJsonSafe(filePath: string): any {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (err) {
    console.warn(`[Morphology] Could not load ${filePath}:`, err);
  }
  return {};
}

export function initializeLexicons() {
  if (!cachedAnnotations) {
    cachedAnnotations = loadJsonSafe(path.resolve(process.cwd(), 'cache/annotations.json'));
  }
  if (!heritageMorphology) {
    heritageMorphology = loadJsonSafe(path.resolve(process.cwd(), 'data/lexicon/heritage_morphology.json'));
  }
  if (!apteLexicon) {
    apteLexicon = loadJsonSafe(path.resolve(process.cwd(), 'data/lexicon/ap90.json'));
  }
  if (!grassmannLexicon) {
    grassmannLexicon = loadJsonSafe(path.resolve(process.cwd(), 'data/lexicon/grassmann_vedic.json'));
  }
  if (!mwLexicon) {
    mwLexicon = loadJsonSafe(path.resolve(process.cwd(), 'data/lexicon/monier_williams.json'));
  }
}

// Paninian stemmer patterns for Classical Sanskrit nouns and verbs
interface StemRule {
  suffix: string;
  removeLen: number;
  addStem: string;
  grammar: string;
  type: 'subanta' | 'tinganta' | 'krdanta' | 'avyaya';
  vibhakti?: string;
  vacana?: string;
  lakara?: string;
  purusha?: string;
}

const stemRules: StemRule[] = [
  // Subanta (Noun cases)
  { suffix: 'स्य', removeLen: 3, addStem: 'अ', grammar: 'षष्ठी विभक्ति (Genitive), एकवचन, पुंल्लिङ्ग/नपुंसकलिङ्ग', type: 'subanta', vibhakti: 'षष्ठी', vacana: 'एकवचन' },
  { suffix: 'म्', removeLen: 2, addStem: 'अ', grammar: 'द्वितीया विभक्ति (Accusative) / प्रथमा एकवचन नपुं.', type: 'subanta', vibhakti: 'द्वितीया', vacana: 'एकवचन' },
  { suffix: 'ान्', removeLen: 3, addStem: 'अ', grammar: 'द्वितीया विभक्ति (Accusative), बहुवचन, पुंल्लिङ्ग', type: 'subanta', vibhakti: 'द्वितीया', vacana: 'बहुवचन' },
  { suffix: 'ात्', removeLen: 3, addStem: 'अ', grammar: 'पञ्चमी विभक्ति (Ablative), एकवचन, पुंल्लिङ्ग/नपुं.', type: 'subanta', vibhakti: 'पञ्चमी', vacana: 'एकवचन' },
  { suffix: 'ाय', removeLen: 2, addStem: 'अ', grammar: 'चतुर्थी विभक्ति (Dative), एकवचन, पुंल्लिङ्ग/नपुं.', type: 'subanta', vibhakti: 'चतुर्थी', vacana: 'एकवचन' },
  { suffix: 'ेण', removeLen: 2, addStem: 'अ', grammar: 'तृतीया विभक्ति (Instrumental), एकवचन', type: 'subanta', vibhakti: 'तृतीया', vacana: 'एकवचन' },
  { suffix: 'ेषु', removeLen: 2, addStem: 'अ', grammar: 'सप्तमी विभक्ति (Locative), बहुवचन', type: 'subanta', vibhakti: 'सप्तमी', vacana: 'बहुवचन' },
  { suffix: 'ौ', removeLen: 1, addStem: 'अ', grammar: 'प्रथमा/द्वितीया विभक्ति, द्विवचन, पुंल्लिङ्ग', type: 'subanta', vibhakti: 'प्रथमा/द्वितीया', vacana: 'द्विवचन' },
  { suffix: 'ाः', removeLen: 2, addStem: 'अ', grammar: 'प्रथमा/द्वितीया विभक्ति, बहुवचन', type: 'subanta', vibhakti: 'प्रथमा', vacana: 'बहुवचन' },
  { suffix: 'े', removeLen: 1, addStem: 'अ', grammar: 'सप्तमी विभक्ति एकवचन / प्रथमा द्विवचन', type: 'subanta', vibhakti: 'सप्तमी', vacana: 'एकवचन' },
  { suffix: 'ः', removeLen: 1, addStem: 'अ', grammar: 'प्रथमा विभक्ति (Nominative), एकवचन, पुंल्लिङ्ग', type: 'subanta', vibhakti: 'प्रथमा', vacana: 'एकवचन' },

  // Tinganta (Verbal suffixes)
  { suffix: 'ति', removeLen: 2, addStem: '', grammar: 'लट् लकार (वर्तमान), प्रथम पुरुष, एकवचन, परस्मैपद', type: 'tinganta', lakara: 'लट् (वर्तमान)', purusha: 'प्रथम पुरुष', vacana: 'एकवचन' },
  { suffix: 'न्ति', removeLen: 3, addStem: '', grammar: 'लट् लकार (वर्तमान), प्रथम पुरुष, बहुवचन, परस्मैपद', type: 'tinganta', lakara: 'लट् (वर्तमान)', purusha: 'प्रथम पुरुष', vacana: 'बहुवचन' },
  { suffix: 'सि', removeLen: 2, addStem: '', grammar: 'लट् लकार (वर्तमान), मध्यम पुरुष, एकवचन, परस्मैपद', type: 'tinganta', lakara: 'लट् (वर्तमान)', purusha: 'मध्यम पुरुष', vacana: 'एकवचन' },
  { suffix: 'थ', removeLen: 1, addStem: '', grammar: 'लट् लकार (वर्तमान), मध्यम पुरुष, बहुवचन, परस्मैपद', type: 'tinganta', lakara: 'लट् (वर्तमान)', purusha: 'मध्यम पुरुष', vacana: 'बहुवचन' },
  { suffix: 'मि', removeLen: 2, addStem: '', grammar: 'लट् लकार (वर्तमान), उत्तम पुरुष, एकवचन, परस्मैपद', type: 'tinganta', lakara: 'लट् (वर्तमान)', purusha: 'उत्तम पुरुष', vacana: 'एकवचन' },
  { suffix: 'ते', removeLen: 1, addStem: '', grammar: 'लट् लकार (वर्तमान), प्रथम पुरुष, एकवचन, आत्मनेपद', type: 'tinganta', lakara: 'लट् (वर्तमान)', purusha: 'प्रथम पुरुष', vacana: 'एकवचन' },
  { suffix: 'न्ते', removeLen: 2, addStem: '', grammar: 'लट् लकार (वर्तमान), प्रथम पुरुष, बहुवचन, आत्मनेपद', type: 'tinganta', lakara: 'लट् (वर्तमान)', purusha: 'प्रथम पुरुष', vacana: 'बहुवचन' },
  { suffix: 'से', removeLen: 1, addStem: '', grammar: 'लट् लकार (वर्तमान), मध्यम पुरुष, एकवचन, आत्मनेपद', type: 'tinganta', lakara: 'लट् (वर्तमान)', purusha: 'मध्यम पुरुष', vacana: 'एकवचन' },
  { suffix: 'ष्यति', removeLen: 4, addStem: '', grammar: 'लृट् लकार (भविष्यत्), प्रथम पुरुष, एकवचन', type: 'tinganta', lakara: 'लृट् (भविष्यत्)', purusha: 'प्रथम पुरुष', vacana: 'एकवचन' },
  { suffix: 'ष्यसि', removeLen: 4, addStem: '', grammar: 'लृट् लकार (भविष्यत्), मध्यम पुरुष, एकवचन', type: 'tinganta', lakara: 'लृट् (भविष्यत्)', purusha: 'मध्यम पुरुष', vacana: 'एकवचन' },

  // Krdanta & Absolutives
  { suffix: 'त्वा', removeLen: 3, addStem: '', grammar: 'कृदन्त क्त्वा प्रत्यय (Absolutive / Having done)', type: 'krdanta' },
  { suffix: 'त्य', removeLen: 2, addStem: '', grammar: 'कृदन्त ल्यप् प्रत्यय (Absolutive / Having done with upasarga)', type: 'krdanta' },
  { suffix: 'तुम्', removeLen: 3, addStem: '', grammar: 'कृदन्त तुमुन् प्रत्यय (Infinitive / In order to do)', type: 'krdanta' }
];

/**
 * Main resolution function for any Sanskrit word token
 */
export function resolveWordAnnotation(rawToken: string): WordAnnotation {
  initializeLexicons();

  const token = cleanSanskritToken(rawToken);
  if (!token) {
    return {
      token: rawToken,
      meaning: 'विराम चिन्ह / पङ्क्तिच्छेद',
      grammar: 'अविभक्तिक'
    };
  }

  // 1. Direct hit in Persistent Cache
  if (cachedAnnotations && cachedAnnotations[token]) {
    const annot = { ...cachedAnnotations[token] };
    if (!annot.padas && heritageMorphology && heritageMorphology[token]?.padas) {
      annot.padas = heritageMorphology[token].padas;
    }
    return {
      ...annot,
      iast: annot.iast || devanagariToIast(token)
    };
  }

  // 2. Direct hit in Sanskrit Heritage Morphology
  if (heritageMorphology && heritageMorphology[token]) {
    const h = heritageMorphology[token];
    const firstPada = h.padas?.[0];
    const joinedMeaning = h.padas?.map((p: any) => `${p.pada}: ${p.meaning}`).join('; ') || h.meaning || '';
    const joinedGrammar = h.padas?.map((p: any) => `${p.pada} (${p.vibhakti || p.lakara || p.type || ''})`).join(' + ') || h.grammar || '';
    
    return {
      token: token,
      lemma: firstPada?.lemma || token,
      iast: devanagariToIast(token),
      meaning: joinedMeaning || 'संस्कृत हेरिटेज पद विश्लेषण',
      root: firstPada?.root || undefined,
      grammar: joinedGrammar || 'पद (हेरिटेज कोष)',
      sandhiVigraha: h.split?.length > 1 ? h.split.join(' + ') : undefined,
      sandhiRules: h.sandhiRules,
      padas: h.padas,
      source: 'Sanskrit Heritage Grammar'
    };
  }

  // 3. Sandhi Vigraha Analysis (for compounds and joint tokens)
  const sandhi = analyzeSandhi(token, heritageMorphology || {});
  let sandhiVigrahaStr: string | undefined = undefined;
  if (sandhi.isCompound && sandhi.split.length > 1) {
    sandhiVigrahaStr = sandhi.vigrahaFormula;
  }

  // 4. Exact hit in Apte Practical Sanskrit Dictionary
  if (apteLexicon && apteLexicon[token]) {
    const entry = apteLexicon[token];
    return {
      token: token,
      lemma: entry.headword,
      iast: devanagariToIast(token),
      meaning: entry.meaning,
      grammar: `${entry.pos} ${entry.gender ? `(${entry.gender})` : ''} - आप्टे कोष`,
      sandhiVigraha: sandhiVigrahaStr,
      sandhiRules: sandhi.rules,
      source: entry.source
    };
  }

  // 5. Exact hit in Grassmann Rigveda Lexicon
  if (grassmannLexicon && grassmannLexicon[token]) {
    const g = grassmannLexicon[token];
    return {
      token: token,
      lemma: g.headword,
      iast: devanagariToIast(token),
      meaning: g.meaning,
      grammar: 'वैदिक पद (ऋग्वेद)',
      vedicCitation: g.citation,
      sandhiVigraha: sandhiVigrahaStr,
      sandhiRules: sandhi.rules,
      source: g.source
    };
  }

  // 6. Exact hit in Monier-Williams Core
  if (mwLexicon && mwLexicon[token]) {
    const m = mwLexicon[token];
    return {
      token: token,
      lemma: m.lemma,
      iast: m.iast || devanagariToIast(token),
      meaning: m.meaning,
      root: m.root,
      gana: m.gana,
      padaType: m.pada,
      grammar: `${m.pos} ${m.gender ? `(${m.gender})` : ''}`,
      sandhiVigraha: sandhiVigrahaStr,
      sandhiRules: sandhi.rules,
      source: m.source
    };
  }

  // 7. Morphological Stemming & Grammatical Deduction
  for (const rule of stemRules) {
    if (token.endsWith(rule.suffix) && token.length > rule.suffix.length + 1) {
      const base = token.slice(0, -rule.removeLen) + rule.addStem;
      
      // Look up base in Apte or MW
      const baseApte = apteLexicon?.[base];
      const baseMw = mwLexicon?.[base];
      const baseGra = grassmannLexicon?.[base];

      if (baseApte || baseMw || baseGra) {
        const found = baseApte || baseMw || baseGra;
        return {
          token: token,
          lemma: base,
          iast: devanagariToIast(token),
          meaning: found.meaning || `प्रतिपादक: ${base}`,
          root: found.root || (rule.type === 'tinganta' ? base : undefined),
          grammar: rule.grammar,
          type: rule.type,
          vibhakti: rule.vibhakti,
          vacana: rule.vacana,
          lakara: rule.lakara,
          purusha: rule.purusha,
          sandhiVigraha: sandhiVigrahaStr,
          sandhiRules: sandhi.rules,
          source: found.source || 'व्याकरण व्युत्पत्ति (पाणिनीय प्रक्रिया)'
        };
      }
    }
  }

  // 8. Compound part lookup (if sandhi has split the token into components)
  if (sandhi.isCompound && sandhi.split.length > 1) {
    const subPadas = sandhi.split.map(part => {
      const subAnnot = resolveWordAnnotation(part);
      return {
        pada: part,
        lemma: subAnnot.lemma || part,
        root: subAnnot.root,
        grammar: subAnnot.grammar,
        meaning: subAnnot.meaning
      };
    });

    return {
      token: token,
      lemma: sandhi.split[0],
      iast: devanagariToIast(token),
      meaning: subPadas.map(p => `${p.pada} (${p.meaning.slice(0, 50)})`).join(' + '),
      grammar: `सामासिक पद / सन्धि-युक्त (${sandhi.rules.join(', ')})`,
      sandhiVigraha: sandhi.vigrahaFormula,
      sandhiRules: sandhi.rules,
      padas: subPadas,
      source: 'सन्धि व समास विच्छेद'
    };
  }

  // 9. Generic Sanskrit Pada fallback
  return {
    token: token,
    lemma: token,
    iast: devanagariToIast(token),
    meaning: 'संस्कृत पद (विस्तृत कोष में अन्वेषणीय)',
    grammar: 'संस्कृत सुबन्त/तिङन्त पद',
    sandhiVigraha: sandhiVigrahaStr,
    source: 'पारम्परिक संस्कृत व्याकरण'
  };
}
