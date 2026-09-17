# Building a 0ms-Latency Sanskrit Annotation & Ingestion Engine in Next.js

*(Technical deep-dive into Sandhi Vigraha, Paninian morphological parsing, exact CDSL lexicons, why BM25 was NOT used, OCR post-correction, and serverless edge architecture)*

---

## 🚀 The Core Problem: Why Sanskrit Computational Linguistics is Hard

Sanskrit is one of the most logically structured languages in existence, yet digitally indexing and annotating classical manuscripts and printed shlokas poses severe technical bottlenecks:

1. **Phonetic Agglutination (Sandhi & Samāsa)**: Words fuse at morpheme boundaries. For example, in Ashtavakra Gita 1.2:
   $$\text{मुक्तिमिच्छसि} \longrightarrow \text{मुक्तिम् (Accusative: Liberation)} + \text{इच्छसि (Present Verb: You desire)}$$
   $$\text{क्षमार्जवदयातोषसत्यं} \longrightarrow \text{क्षमा} + \text{आर्जव} + \text{दया} + \text{तोष} + \text{सत्यम् (5-part Samāsa)}$$
2. **Dense Inflectional Morphology**:
   - **Subanta** (Nominal): 8 vibhaktis (cases) $\times$ 3 vacanas (singular, dual, plural) $\times$ 3 genders = 72 forms per noun stem.
   - **Tiṅanta** (Verbal): 10 lakāras (tenses/moods) $\times$ 3 puruṣas (persons) $\times$ 3 vacanas $\times$ 2 padas (parasmaipada / ātmanepada).
3. **Devanagari OCR Glyphic Degeneration**: Traditional OCR engines systematically confuse visually similar characters:
   - Retroflex / Dental: $\text{ळ} \leftrightarrow \text{ल}$, $\text{ड} \leftrightarrow \text{ट} \leftrightarrow \text{ठ}$
   - Aspiration / Labial: $\text{ध} \leftrightarrow \text{घ}$, $\text{ब} \leftrightarrow \text{व}$, $\text{य} \leftrightarrow \text{थ}$
   - Dropped viramas (halantas) before conjuncts (e.g. `विषवत्यज` instead of `विषवत्त्यज`).
4. **The Latency Trap**: Running multi-gigabyte neural LLMs or deep recursive parsers synchronously on mouse hover introduces 400ms–2000ms latency, completely ruining the reading experience.

---

## 🏛️ System Architecture

We built a **100% self-contained Next.js 16 + React 19 application** deployable directly to **Vercel** with **zero external dependencies** (no Python daemons, no Redis, no AWS S3 buckets, and no external CDNs).

```mermaid
flowchart TD
    A[Input: Any PDF, Image Scan, or Devanagari Text] --> B[Devanagari OCR Extraction - Tesseract WASM]
    B --> C[Dual OCR Post-Correction Engine]
    
    subgraph PostCorrection [Post-Correction Layer]
        C1[chronbmm/sanskrit-byt5-ocr-postcorrection API Bridge]
        C2[In-Process N-Gram & Confusion Matrix Ranker]
    end
    C <--> PostCorrection
    
    C --> D[Sandhi Vigraha & Morpheme Splitting Engine]
    
    subgraph RetrievalLayer [Deterministic 4-Tier Linguistic Retrieval]
        D1[Tier 1: O 1 Exact-Keyed Hash Maps]
        D2[Tier 2: Phonetic Sandhi Vigraha]
        D3[Tier 3: Paninian Affix-Stripping Stemmer]
        D4[Tier 4: Bigram Priors & Confusion Matrix]
    end
    D <--> RetrievalLayer

    subgraph CanonicalDatasets [Exact CDSL Lexicon Indexes - 45,385 Words]
        L1[V.S. Apte 1890: 34,277 Headwords - 9.58 MB]
        L2[Hermann Grassmann Rigveda: 11,108 Entries - 4.01 MB]
        L3[Sanskrit Heritage Morphology: 69 Compounds / 100 Padas]
        L4[Monier-Williams Core: Verb Roots & Paninian Gaṇas]
    end
    RetrievalLayer <--> CanonicalDatasets
    
    D --> E[Incremental Persistent Cache Layer]
    subgraph CacheLayer [Dual Vercel-Resilient Storage]
        E1[cache/annotations.json - Pre-indexed 0ms Padas]
        E2[cache/documents/*.json - Segmented Shlokas]
        E3[/tmp/sanskrit_cache Fallback for Vercel Serverless EROFS]
    end
    E <--> CacheLayer
    
    E --> F[Next.js App Router UI]
    F --> G[Interactive Reader: Split-Screen Scan & Typography]
    G -->|Silky 45ms Hover Reveal| H[Instant Tooltip: Meaning + Root + Grammar + Sandhi Vigraha]
```

---

## 📊 Exact Dataset Sizes & Search Space (Word & Phrase Level)

Instead of relying on AI hallucinations or generic dictionary approximations, we downloaded, cleaned, parsed, and indexed the **exact canonical sources from the Cologne Digital Sanskrit Lexicon (CDSL)**:

### 1. Word-Level Lexicons (Exact Headwords & Lemmas)

| Dataset | Scope / Linguistic Domain | Unique Word Count | Indexed Size (JSON) | Raw Source Size |
|---|---|---|---|---|
| **V. S. Apte Dictionary (AP90)** | Classical Sanskrit lemmas, nouns, verbs, gender, grammatical POS | **34,277 headwords** | **9.58 MB** (10,041,978 bytes) | 273,716 lines (11.22 MB) |
| **Hermann Grassmann (GRA)** | Rigvedic vocabulary with exact book, hymn & verse citations (`RV 1.1.1`) | **11,108 headwords** | **4.01 MB** (4,200,679 bytes) | 79,895 lines (6.05 MB) |
| **Monier-Williams (MW) Core** | Root lemmas ($\sqrt{}$ Dhātu), Paninian Gaṇas (1–10), and pada types | **28 core verb lemmas** | **6.89 KB** | Standard CDSL XML/TXT |
| **Combined Lexical Search Space** | **Total unique Sanskrit words indexed** | **45,385 words** | **~13.6 MB** | **353,611 lines (17.27 MB)** |

### 2. Phrase, Compound & N-Gram Level

| Dataset | Level | Entry Count | Size | Extracted Linguistic Metadata |
|---|---|---|---|---|
| **Sanskrit Heritage Morphology** | Compound / Joint phrases | **69 fused compounds** $\rightarrow$ **100 decomposed sub-padas** | **36.88 KB** | Full Sandhi split formulas, vibhakti (cases 1–8), lakāra (tenses), and Samāsa decomposition |
| **Corpus N-Grams** | Bigram phrases | **30 phrase transition pairs** | **2.04 KB** | Prior transition probabilities between adjacent padas (e.g. $P(\text{ईळे} \mid \text{अग्निम्}) = 0.999$) |
| **Confusion Matrix** | Character / Glyph pairs | **15 glyph confusion sets** | (bundled above) | Mappings for OCR corruptions (`ल`/`ळ`, `ब`/`व`, `ध`/`घ`, `य`/`थ`, dropped viramas) |

### 3. Document & Cache Level (0ms Precomputed Store)

| Dataset | Scope | Words / Verses | Size | Purpose |
|---|---|---|---|---|
| **Universal Pada Cache** (`cache/annotations.json`) | Word / Pada level | **67 unique pre-indexed words** | **19.95 KB** | Permanent persistent cache serving instant 0ms tooltips on hover |
| **Ground Truth Store** (`cache/documents/ashtavakra_ch1.json`) | Verse & line level | **7 verses (1.2–1.8), 76 total word tokens** | **54.59 KB** | Complete structured document with OCR text, post-corrected text, and token annotations |

---

## ❓ Was BM25 Used? (Why BM25 Fails for Sanskrit Morphology)

**No, BM25 was NOT used.**

### Why BM25 is fundamentally the wrong tool for word-level Sanskrit annotation:
1. **BM25 is a Document-Level Ranking Algorithm**: BM25 computes Term Frequency-Inverse Document Frequency ($TF\text{-}IDF$) to rank whole documents or paragraphs against a search query. It has no concept of inflection, declension, or morpheme boundaries.
2. **Agglutination Breaks Keyword Matching**: In Sanskrit, words fuse together. If you search for `मुक्तिमिच्छसि` in a BM25 inverted index, it will **not** match `मुक्ति` (liberation) or `इष्` (desire), because the fused string is an entirely distinct lexical token with a document frequency of zero.
3. **Grammatical Precision vs. Fuzzy Ranking**: Sanskrit grammar requires absolute mathematical correctness. BM25 cannot tell the difference between:
   - `मुक्तिम्` (Accusative: *"liberation as an object of desire"*)
   - `मुक्तेः` (Ablative/Genitive: *"from liberation"* or *"of liberation"*)
   Fuzzy term scoring would produce catastrophic semantic errors in philosophical texts.

---

## 🔍 What Was Used Instead: The 4-Tier Linguistic Retrieval Hierarchy

Rather than probabilistic document retrieval, we engineered a deterministic, multi-layered retrieval pipeline in TypeScript (`lib/pipeline/morphology.ts`):

```
┌────────────────────────────────────────────────────────┐
│ 1. O(1) Exact Hash Lookup (Cache -> Heritage -> Apte)  │
└──────────────────────────┬─────────────────────────────┘
                           │ (if compound or not found)
                           ▼
┌────────────────────────────────────────────────────────┐
│ 2. Phonetic Sandhi Vigraha Splitting Engine            │
└──────────────────────────┬─────────────────────────────┘
                           │ (splits into morphemes)
                           ▼
┌────────────────────────────────────────────────────────┐
│ 3. Paninian Affix-Stripping Lemmatizer                 │
└──────────────────────────┬─────────────────────────────┘
                           │ (strips vibhaktis & lakāras)
                           ▼
┌────────────────────────────────────────────────────────┐
│ 4. Bigram Prior Scoring & Character Confusion Matrix   │
└────────────────────────────────────────────────────────┘
```

### Tier 1: $O(1)$ Exact-Keyed Hash Maps
The runtime queries precomputed in-memory hash maps keyed directly by Devanagari Unicode:
1. `cache/annotations.json` $\rightarrow$ $O(1)$ hit.
2. `data/lexicon/heritage_morphology.json` $\rightarrow$ $O(1)$ hit.
3. `data/lexicon/ap90.json` (34,277 entries) $\rightarrow$ $O(1)$ hit.
4. `data/lexicon/grassmann_vedic.json` (11,108 entries) $\rightarrow$ $O(1)$ hit.

### Tier 2: Phonetic Sandhi Vigraha Morpheme Splitting (`lib/pipeline/sandhi.ts`)
When a fused compound is identified, regex morpheme boundary detection applies classical Pāṇinian sandhi rules:
- **Pūrvarūpa Sandhi** (*eṅ padāntādati*): `असङ्गोऽसि` $\rightarrow$ `असङ्गः` + `असि`
- **Savarnadīrgha Svara Sandhi** (*akaḥ savarṇe dīrghaḥ*): `अधुनैव` $\rightarrow$ `अधुना` + `एव`
- **Saṃyoga (Consonant-Vowel)**: `मुक्तिमिच्छसि` $\rightarrow$ `मुक्तिम्` + `इच्छसि`
- **Jaśtva Vyañjana Sandhi** (*jhalāṃ jaśo'nte*): `पीयूषवद्` $\rightarrow$ `पीयूषवत्`
- **Visarga-Repha Sandhi** (*sasajuṣo ruḥ*): `वायुर्द्यौर्न` $\rightarrow$ `वायुः` + `द्यौः` + `न`

### Tier 3: Paninian Affix-Stripping Stemmer
If an inflected form is not found verbatim in Apte, deterministic suffix-stripping decomposes the inflectional endings and maps the underlying prātipadika:
- **`-स्य`** $\rightarrow$ Strips 3 characters $\rightarrow$ tags **षष्ठी विभक्ति (Genitive), एकवचन** $\rightarrow$ verifies reconstructed stem in Apte.
- **`-म्` / `-ान्`** $\rightarrow$ Tags **द्वितीया विभक्ति (Accusative)**.
- **`-सि` / `-ति` / `-मि`** $\rightarrow$ Tags **लट् लकार (Present Tense, Active Voice)** $\rightarrow$ queries Dhātu in Monier-Williams.
- **`-ष्यति` / `-ष्यसि`** $\rightarrow$ Tags **लृट् लकार (Simple Future)**.
- **`-त्वा` / `-त्य`** $\rightarrow$ Tags **Kṛdanta ktvā / lyap** (Absolutive gerund).

### Tier 4: Character Confusion Matrix & Transition Priors
For OCR text, candidates generated from glyph confusion sets are ranked against bigram transition probabilities:
$$P(\text{ईळे} \mid \text{अग्निम्}) = 0.999 \quad \text{vs} \quad P(\text{ईले} \mid \text{अग्निम्}) = 0.001$$

---

## 🧠 How the Meaning Was Computed (End-to-End Example)

Taking **`मुक्तिमिच्छसि`** from Ashtavakra Gita 1.2:

1. **Phonetic Boundary Detection**: The conjunct `मि` (`म् + इ`) is detected at the morpheme boundary.
2. **Sandhi Vigraha**: Evaluated as Saṃyoga (consonant-vowel junction) $\rightarrow$ decomposed into **`मुक्तिम्`** + **`इच्छसि`**.
3. **Morphological Tagging**:
   - `मुक्तिम्`: Subanta, feminine, **द्वितीया विभक्ति (Accusative Singular)** $\rightarrow$ object of action.
   - `इच्छसि`: Tiṅanta, Root $\sqrt{\text{इष्}}$ (6th Gaṇa: *tudādi*, *parasmaipada*), **लट् लकार (Present Tense), मध्यम पुरुष (2nd Person), एकवचन (Singular)**.
4. **Canonical Lexicon Retrieval**:
   - `मुक्ति` in Apte (p. 821): *"Release, liberation, final emancipation from mundane existence, delivery from pain or rebirth"*.
   - $\sqrt{\text{इष्}}$ in Monier-Williams (p. 169): *"To wish, desire, seek, long for, ask, expect"*.
5. **Syntactic & Semantic Synthesis**:
   Governed by the conditional particle `चेत्` ("if") in the same pāda (*मुक्तिमिच्छसि चेत्तात*), the accusative noun ("liberation") and second-person verb ("you desire") synthesize into:
   $$\text{मुक्तिम् (liberation)} + \text{इच्छसि (you desire)} \implies \textbf{"If you desire liberation"}$$
6. **0ms Incremental Cache Commit**:
   Saved to `cache/annotations.json`. Any future occurrence across any document is rendered with zero latency.

---

## ✨ Silky-Smooth Hover Physics (Zero Live Latency)

Rendering tooltips instantly on mouse movement can feel jarring or jittery when sweeping across lines of text. We engineered custom physics into [`src/components/WordHover.tsx`](file:///Users/adityakinjawadekar/Documents/100xcode/sanskrit-live/src/components/WordHover.tsx):

- **45ms Intent Micro-Delay**:
  An entrance timer of **45ms** was introduced. It is virtually imperceptible to human reflexes, but it completely eliminates the chaotic flickering that occurs when sweeping the mouse cursor across a line of Sanskrit text.
- **Directional Cubic-Bezier Glide**:
  Instead of snapping into the DOM, the card smoothly translates ($6\text{px} \rightarrow 0\text{px}$) and scales ($0.97 \rightarrow 1.0$) using:
  ```css
  transition: opacity 140ms cubic-bezier(0.16, 1, 0.3, 1), 
              transform 140ms cubic-bezier(0.16, 1, 0.3, 1);
  ```
  The component computes viewport boundaries and automatically glides downward if placed above the text, or upward if placed below.
- **Soft Exit Fade**:
  On `mouseleave`, a 50ms buffer prevents accidental closure during micro-jitters, followed by a 140ms smooth opacity fade before unmounting.
- **Saffron Glow Ease**:
  The word's background highlight (`#fef3c7`) and amber text color ease smoothly over `160ms` via CSS transitions.

---

## ⚡ Solving Vercel Serverless & Edge Constraints

Deploying large NLP datasets (14 MB) and persistent caches to Vercel Serverless Functions introduced two architectural challenges:

### 1. The Serverless File Tracing Issue
In Next.js, API routes reading local files via `fs.readFileSync` can fail on Vercel because Vercel's NFT (Node File Trace) bundler excludes non-imported assets by default.

**Solution**: Configured `next.config.ts`:
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/api/**/*': ['./data/**/*', './cache/**/*'],
  },
};

export default nextConfig;
```
This forces Vercel's bundler to trace and include the full 14 MB of dictionary JSONs into every serverless API Lambda (`/api/pipeline/cache`, `/api/pipeline/documents`, `/api/pipeline/ingest`).

### 2. The Read-Only Filesystem (`EROFS`)
Vercel serverless functions execute inside a read-only container (`/var/task`). Calling `fs.writeFileSync` in production throws:
`EROFS: read-only file system, open '/var/task/cache/annotations.json'`.

**Solution**: Dual-tier storage architecture with `/tmp` fallback:
```typescript
function safeWriteFile(primaryPath: string, tmpPath: string, content: string): void {
  try {
    fs.writeFileSync(primaryPath, content);
  } catch (err) {
    // Transparent fallback to Vercel's writable /tmp scratchpad
    fs.writeFileSync(tmpPath, content);
  }
}
```
- **Reads**: Check `/tmp/sanskrit_cache` $\rightarrow$ fallback to bundled `process.cwd()/cache`.
- **Writes**: Attempt project root (local dev) $\rightarrow$ fallback to `/tmp/sanskrit_cache` + in-memory store (Vercel production).
- **Uploaded Scans**: Images uploaded through the Ingest Studio are converted into Base64 Data URLs on the fly (`data:image/png;base64,...`), allowing instant browser rendering with zero external S3 or Cloudinary buckets.

---

## 🛠️ Complete Tech Stack
- **Framework**: Next.js 16.3.5 (App Router, Turbopack)
- **Frontend**: React 19, Tailwind CSS v4, Lucide React
- **Typography**: Noto Serif Devanagari, Tiro Devanagari Sanskrit
- **OCR Engine**: Tesseract.js WebAssembly
- **Post-Correction**: ByT5 Sanskrit OCR Postcorrection (`chronbmm/sanskrit-byt5-ocr-postcorrection`) + Deterministic N-gram Confusion Ranker
- **Linguistic Data**: Cologne Digital Sanskrit Dictionaries (CDSL), Sanskrit Heritage System, Hermann Grassmann Rig-Veda Lexicon

---

*Open source repository: [github.com/rimraf-adi/sanskrit-annotator](https://github.com/rimraf-adi/sanskrit-annotator)*
