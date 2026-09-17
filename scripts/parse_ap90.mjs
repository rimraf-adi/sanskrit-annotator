import fs from 'node:fs';
import path from 'node:path';
import { slp1ToDevanagari } from './fetch_and_build_datasets.mjs';

const rawFile = path.resolve('data/raw_datasets/ap90.txt');
const outFile = path.resolve('data/lexicon/ap90.json');

console.log('Parsing Apte 1890 Dictionary...');
const content = fs.readFileSync(rawFile, 'utf-8');
const entries = content.split('<LEND>');
console.log(`Total raw entries: ${entries.length}`);

const apteIndex = {};
let count = 0;

for (let i = 0; i < entries.length; i++) {
  const entry = entries[i];
  const match = entry.match(/<k1>([^<]+)<k2>([^<]+)/);
  if (!match) continue;

  const slp1 = match[1].trim();
  const deva = slp1ToDevanagari(slp1);

  // Extract clean text definition
  // Apte has markup like {#word#} for Sanskrit, {%word%} for italics, <ab>abbr</ab>
  let body = entry
    .replace(/<L>[^>]+>/g, '')
    .replace(/<k[12]>[^<]+<\/k[12]>/g, '')
    .replace(/<lbinfo[^>]*\/>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\{#[^#]+#\}/g, (m) => m.slice(2, -2))
    .replace(/\{%[^%]+%\}/g, (m) => m.slice(2, -2))
    .replace(/\s+/g, ' ')
    .trim();

  // Detect POS / Gender
  let pos = 'noun';
  let gender = '';
  if (/\b(ind|indecl)\b/i.test(body)) pos = 'avyaya';
  else if (/\ba\.\b|\badj\b/i.test(body)) pos = 'adj';
  else if (/\bm\.\b/i.test(body)) { pos = 'noun'; gender = 'm'; }
  else if (/\bf\.\b/i.test(body)) { pos = 'noun'; gender = 'f'; }
  else if (/\bn\.\b/i.test(body)) { pos = 'noun'; gender = 'n'; }
  else if (/\bv\.\b|\b(Par|Atm|Ubhay)\b/i.test(body)) pos = 'verb';

  // Take the first concise portion of the definition
  let shortDef = body.slice(0, 220).replace(/^¦\s*/, '').trim();

  // Store first entry or highest quality entry per headword
  if (!apteIndex[deva]) {
    apteIndex[deva] = {
      headword: deva,
      slp1: slp1,
      pos: pos,
      gender: gender || undefined,
      meaning: shortDef,
      source: 'V. S. Apte Practical Sanskrit-English Dictionary (1890)'
    };
    count++;
  }
}

console.log(`Indexed ${count} unique Devanagari headwords from Apte!`);
fs.writeFileSync(outFile, JSON.stringify(apteIndex));
const sizeMb = (fs.statSync(outFile).size / (1024 * 1024)).toFixed(2);
console.log(`Saved ${outFile} (${sizeMb} MB)`);
