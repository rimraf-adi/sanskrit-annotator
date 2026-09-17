import fs from 'node:fs';
import path from 'node:path';

async function downloadApte() {
  const url = 'https://raw.githubusercontent.com/sanskrit-lexicon/csl-orig/main/v02/ap90/ap90.txt';
  const dest = path.resolve('data/raw_datasets/ap90.txt');
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1000000) {
    console.log('ap90.txt already exists, size:', fs.statSync(dest).size);
    return;
  }
  console.log('Downloading ap90.txt...');
  const res = await fetch(url);
  const text = await res.text();
  fs.writeFileSync(dest, text);
  console.log('Downloaded ap90.txt successfully, size:', text.length);
}

downloadApte().catch(console.error);
