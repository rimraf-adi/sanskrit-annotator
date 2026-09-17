/**
 * Sanskrit Sandhi Vigraha & Compound Decomposition Engine
 */

export interface SandhiAnalysis {
  original: string;
  split: string[];
  vigrahaFormula: string;
  rules: string[];
  isCompound: boolean;
}

// Rule patterns for Sandhi split detection
const sandhiPatterns: Array<{
  regex: RegExp;
  split: (m: RegExpExecArray) => string[];
  ruleName: string;
}> = [
  // 1. Purvarupa (ओऽ -> ओ + अ, एऽ -> ए + अ)
  {
    regex: /([क-ह][ेो])ऽ([क-ह])/g,
    split: (m) => [m[1].replace('ऽ', ''), 'अ' + m[2]],
    ruleName: 'पूर्वरूप सन्धि (एङ् पदान्तादति : ए/ओ + अ -> ए/ओ + ऽ)'
  },
  // 2. Savarnadeergha (आ -> अ + अ / आ + आ)
  {
    regex: /ना([क-ह])/g,
    split: (m) => ['न', 'अ' + m[1]],
    ruleName: 'सवर्णदीर्घ स्वर-सन्धि (अकः सवर्णे दीर्घः : अ + अ -> आ)'
  },
  // 3. Yan Sandhi (त्य -> ति + अ, प्य -> पि + अ, ध्य -> धि + अ)
  {
    regex: /([क-ह])्य([क-ह])/g,
    split: (m) => [m[1] + 'ि', 'अ' + m[2]],
    ruleName: 'यण् सन्धि (इको यणचि : इ + अ -> य्)'
  },
  // 4. Vriddhi Sandhi (ऐ -> अ/आ + ए)
  {
    regex: /([क-ह])ै([क-ह])/g,
    split: (m) => [m[1] + 'ा', 'ए' + m[2]],
    ruleName: 'वृद्धि स्वर-सन्धि (वृद्धिरेचि : आ + ए -> ऐ)'
  },
  // 5. Jashtva Sandhi (द् + घोष व्यञ्जन -> त् + ...)
  {
    regex: /([क-ह]+)द्\s*([क-ह])/g,
    split: (m) => [m[1] + 'त्', m[2]],
    ruleName: 'जश्त्व व्यञ्जन-सन्धि (झलां जशोऽन्ते : त् -> द्)'
  },
  // 6. Visarga Repha (र्न -> ः + न, र्द्य -> ः + द्य)
  {
    regex: /([क-ह]+)र्([क-ह])/g,
    split: (m) => [m[1] + 'ः', m[2]],
    ruleName: 'विसर्ग-रेफ सन्धि (ससजुषो रुः : ः -> र्)'
  }
];

export function analyzeSandhi(token: string, knownHeritage: Record<string, any> = {}): SandhiAnalysis {
  const cleaned = token.replace(/[।॥,;\.\s]/g, '').trim();

  // Check known Heritage morphology database first
  if (knownHeritage[cleaned]?.split && knownHeritage[cleaned].split.length > 1) {
    const entry = knownHeritage[cleaned];
    return {
      original: cleaned,
      split: entry.split,
      vigrahaFormula: entry.split.join(' + '),
      rules: entry.sandhiRules || ['परम्परागत सन्धि-विच्छेद'],
      isCompound: entry.split.length > 1
    };
  }

  // Fallback to algorithmic sandhi splitting
  for (const pattern of sandhiPatterns) {
    pattern.regex.lastIndex = 0;
    const match = pattern.regex.exec(cleaned);
    if (match) {
      const parts = pattern.split(match);
      if (parts && parts.length > 1) {
        return {
          original: cleaned,
          split: parts,
          vigrahaFormula: parts.join(' + '),
          rules: [pattern.ruleName],
          isCompound: true
        };
      }
    }
  }

  // If no split is needed or found, single pada
  return {
    original: cleaned,
    split: [cleaned],
    vigrahaFormula: cleaned,
    rules: ['पद (अखण्डित)'],
    isCompound: false
  };
}
