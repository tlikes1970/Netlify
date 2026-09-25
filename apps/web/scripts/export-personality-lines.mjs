/**
 * One-off export for Personality Phase 2 review docs.
 * Run: node scripts/export-personality-lines.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const docsDir = path.join(root, 'docs');

function csvEscape(s) {
  const t = String(s ?? '').replace(/"/g, '""');
  return `"${t}"`;
}

function writeCsv(filename, headers, rows) {
  const lines = [headers.map(csvEscape).join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(','));
  }
  fs.writeFileSync(path.join(docsDir, filename), lines.join('\n') + '\n', 'utf8');
}

// --- Phase 1 rows from flickletContent structure ---
const phase1 = [];

function addRow(row) {
  phase1.push(row);
}

// Home Header
const headerSignals = {
  'emptyWatching': { key: 'home.header.emptyWatching', ctx: 'Signal: Empty Watching' },
  'hugeWantTinyWatching': { key: 'home.header.hugeWantTinyWatching', ctx: 'Signal: Huge Want / Tiny Watching' },
  'heavyWatched': { key: 'home.header.heavyWatched', ctx: 'Signal: Heavy Watched' },
  'smallLibrary': { key: 'home.header.smallLibrary', ctx: 'Signal: Small Library' },
  'singleShowFocus': { key: 'home.header.singleShowFocus', ctx: 'Signal: Single Show Focus' },
};

const h = {
  emptyWatching: [
    ['h-ew-1', 'Nothing in progress. Currently Watching is empty.', 'Y', 'Y', 'Y', 'Min L1 uses first 2 of 3'],
    ['h-ew-2', 'No active show on the clock — Flicklet has nothing in progress.', 'Y', 'Y', 'Y', 'Min L1 uses first 2 of 3'],
    ['h-ew-3', 'Currently Watching is blank. Pick something when you are ready.', '', 'Y', 'Y', 'Std/Max only'],
  ],
  hugeWantTinyWatching: [
    ['h-wt-1', 'You are collecting shows faster than you are watching them.', 'Y', 'Y', 'Y', 'Min L1: only this line'],
    ['h-wt-2', '{wantCount} saved for later. Only {watchingCount} in progress.', '', 'Y', 'Y', ''],
    ['h-wt-3', 'Your Want list is doing the heavy lifting. Watching is barely moving.', '', 'Y', 'Y', 'Repeated Want/Watching stem'],
    ['h-wt-4', 'Lots queued, little started — {wantCount} waiting, {watchingCount} active.', '', 'Y', 'Y', ''],
  ],
  heavyWatched: [
    ['h-hw-1', 'You have marked {watchedCount} titles finished. Flicklet sees a completion habit.', 'Y', 'Y', 'Y', 'Min L1: only this line'],
    ['h-hw-2', '{watchedCount} in Watched. You close things out more than most.', '', 'Y', 'Y', ''],
    ['h-hw-3', 'A large finished pile — {watchedCount} logged complete.', '', 'Y', 'Y', ''],
  ],
  smallLibrary: [
    ['h-sl-1', 'Small library so far. Flicklet is still learning your taste.', 'Y', 'Y', 'Y', 'Min L1: first 2 of 3'],
    ['h-sl-2', 'Only {totalCount} titles tracked. Early days.', 'Y', 'Y', 'Y', 'Min L1: first 2 of 3'],
    ['h-sl-3', 'Not much on file yet — room to grow.', '', 'Y', 'Y', 'Std/Max only'],
  ],
  singleShowFocus: [
    ['h-sf-1', 'One show in progress. Focused energy.', 'Y', 'Y', 'Y', ''],
    ['h-sf-2', 'A single active title. No multitasking on the dashboard.', 'Y', 'Y', 'Y', ''],
  ],
  genericMinimal: [
    ['h-gm-1', 'Back again. Your lists are here.', 'Y', '', '', 'Minimal generic only; Snark fallback'],
    ['h-gm-2', 'Flicklet is tracking {totalCount} titles for you.', 'Y', '', '', 'Minimal generic only'],
  ],
  genericStandard: [
    ['h-gs-1', 'Your lists tell different stories. Want is loud; Watching is quiet.', '', 'Y', 'Y', 'Max L3 merges std+max pools'],
    ['h-gs-2', 'Flicklet is holding {totalCount} titles. Some are moving, some are waiting.', '', 'Y', 'Y', ''],
    ['h-gs-3', 'Back. Your backlog and your active queue are not the same size.', '', 'Y', 'Y', 'Backlog stem'],
    ['h-gs-4', 'Dashboard check-in: {watchingCount} active, {wantCount} saved.', '', 'Y', 'Y', 'Functional tone'],
    ['h-gs-5', 'You add faster than you close things out. The numbers say so.', '', 'Y', 'Y', 'Candidate: new Standard voice'],
    ['h-gs-6', 'Still here. Still deciding on half your queue.', '', 'Y', 'Y', ''],
  ],
  genericMaximum: [
    ['h-gx-1', 'Your Want list has more ambition than your Watching list.', '', '', 'Y', 'Max-only tier; also in L3 merged pool'],
    ['h-gx-2', 'Flicklet is watching your lists change more than you watch TV.', '', '', 'Y', 'Meta observer stem'],
    ['h-gx-3', 'Parallel shows, parallel promises. {watchingCount} open threads.', '', '', 'Y', ''],
    ['h-gx-4', 'The backlog is real. So is the finished pile.', '', '', 'Y', 'Backlog stem'],
  ],
};

for (const [signal, meta] of Object.entries(headerSignals)) {
  for (const [id, text, min, std, max, notes] of h[signal]) {
    addRow({
      Surface: 'Home Header',
      Context: meta.ctx,
      Key: meta.key,
      'Line ID': id,
      Minimal: min,
      Standard: std,
      Maximum: max,
      'Current Text': text,
      Notes: notes,
    });
  }
}
for (const [id, text, min, std, max, notes] of h.genericMinimal) {
  addRow({ Surface: 'Home Header', Context: 'Signal: Generic fallback', Key: 'home.header.generic', 'Line ID': id, Minimal: min, Standard: std, Maximum: max, 'Current Text': text, Notes: notes });
}
for (const [id, text, min, std, max, notes] of h.genericStandard) {
  addRow({ Surface: 'Home Header', Context: 'Signal: Generic fallback', Key: 'home.header.generic', 'Line ID': id, Minimal: min, Standard: std, Maximum: max, 'Current Text': text, Notes: notes });
}
for (const [id, text, min, std, max, notes] of h.genericMaximum) {
  addRow({ Surface: 'Home Header', Context: 'Signal: Generic fallback', Key: 'home.header.generic', 'Line ID': id, Minimal: min, Standard: std, Maximum: max, 'Current Text': text, Notes: notes });
}

const marqueeStd = [
  ['m-s-1', 'Observation: your Want list grows when you browse.'],
  ['m-s-2', 'Flicklet tracks habits, not hype.'],
  ['m-s-3', 'One more episode is a lifestyle.'],
  ['m-s-4', 'Finished counts only when you mark it.'],
  ['m-s-5', 'Currently Watching is the honest column.'],
  ['m-s-6', 'Saved for later is a strategy. Sometimes.'],
  ['m-s-7', 'Your lists remember what you forgot.'],
  ['m-s-8', 'Returning shows only matter if you track them.'],
];
const marqueeMax = [
  ['m-x-1', 'The queue is a mood board with consequences.'],
  ['m-x-2', 'Flicklet noticed: lots saved, few started.'],
  ['m-x-3', 'Completion is manual. Brutal but fair.'],
  ['m-x-4', 'Your Watching column tells the truth.'],
  ['m-x-5', 'Browsing is not watching. Flicklet can tell.'],
];
for (const [id, text] of marqueeStd) {
  addRow({ Surface: 'Home Marquee', Context: 'Rotating ticker', Key: 'home.marquee', 'Line ID': id, Minimal: '', Standard: 'Y', Maximum: 'Y', 'Current Text': text, Notes: 'Minimal suppresses marquee (empty pool). L3 merges max+std.' });
}
for (const [id, text] of marqueeMax) {
  addRow({ Surface: 'Home Marquee', Context: 'Rotating ticker', Key: 'home.marquee', 'Line ID': id, Minimal: '', Standard: '', Maximum: 'Y', 'Current Text': text, Notes: 'Max-only tier; included in L3 merged pool' });
}

const emptyDefs = [
  ['Empty States', 'Empty Watching', 'empty.watching', 'watching'],
  ['Empty States', 'Empty Want', 'empty.want', 'want'],
  ['Empty States', 'Empty Watched', 'empty.watched', 'watched'],
  ['Empty States', 'Empty Up Next / Returning', 'empty.upnext', 'upnext'],
  ['Empty States', 'Empty Custom List', 'empty.customList', 'customList'],
];

const emptyData = {
  watching: {
    minimal: [['e-w-m1', 'No shows in Currently Watching yet.'], ['e-w-m2', 'Nothing in progress.']],
    standard: [['e-w-s1', 'Currently Watching is empty. Nothing marked in progress.'], ['e-w-s2', 'No active show right now — this column is unused.'], ['e-w-s3', 'Flicklet has nothing in progress to track.']],
    maximum: [['e-w-x1', 'Currently Watching is empty. The honest column is blank.'], ['e-w-x2', 'Zero in progress. Start one show and this screen gets real.']],
  },
  want: {
    minimal: [['e-n-m1', 'Want To Watch is empty.']],
    standard: [['e-n-s1', 'Want To Watch is empty. Nothing saved for later yet.'], ['e-n-s2', 'Zero queued. You have not flagged anything to chase.'], ['e-n-s3', 'An empty Want list is rare. Most people hoard possibilities here.']],
    maximum: [['e-n-x1', 'Want To Watch is empty. No future picks on file.']],
  },
  watched: {
    minimal: [['e-d-m1', 'Nothing marked watched yet.']],
    standard: [['e-d-s1', 'Nothing marked watched. Flicklet cannot see what you have finished.'], ['e-d-s2', 'Watched is blank — completion history starts when you say so.'], ['e-d-s3', 'No finished titles logged in-app yet.']],
    maximum: [['e-d-x1', 'Watched is empty. Either you are new here or you never mark things done.']],
  },
  upnext: {
    minimal: [['e-u-m1', 'No upcoming shows on the radar.']],
    standard: [['e-u-s1', 'No returning shows Flicklet can see on your calendar.'], ['e-u-s2', 'Up Next is clear from here.'], ['e-u-s3', 'Add series you follow — they will show up when dates exist.']],
    maximum: [['e-u-x1', 'Nothing scheduled in Returning. The radar is quiet.']],
  },
  customList: {
    minimal: [['e-c-m1', 'This list has no shows yet.']],
    standard: [['e-c-s1', '{listName} exists but has no shows in it yet.'], ['e-c-s2', 'Empty custom list. Add a title or this stays a name only.']],
    maximum: [['e-c-x1', '{listName} is waiting for its first show.']],
  },
};

const emptyNotes = {
  'e-w-m1': 'Column-name literal; bland',
  'e-w-m2': 'Good Minimal tone target',
  'e-w-s1': 'Repeated stem: Currently Watching is empty',
  'e-w-x1': 'Repeated stem; honest column',
  'e-n-m1': 'Single Minimal line — small pool',
  'e-n-s1': 'Repeated stem: Want To Watch is empty',
  'e-n-x1': 'Repeated stem',
  'e-d-m1': 'Single Minimal line — small pool',
  'e-d-x1': 'Edge of judgment tone — review for Maximum rules',
  'e-u-m1': 'Single Minimal line — small pool',
  'e-u-s3': 'Instructional — closer to functional',
  'e-c-m1': 'Single Minimal line — small pool',
};

for (const [surface, ctx, key, poolKey] of emptyDefs) {
  const pools = emptyData[poolKey];
  for (const [id, text] of pools.minimal) {
    addRow({ Surface: surface, Context: ctx, Key: key, 'Line ID': id, Minimal: 'Y', Standard: '', Maximum: '', 'Current Text': text, Notes: emptyNotes[id] || 'L3 merges max+std for Std/Max tiers' });
  }
  for (const [id, text] of pools.standard) {
    addRow({ Surface: surface, Context: ctx, Key: key, 'Line ID': id, Minimal: '', Standard: 'Y', Maximum: 'Y', 'Current Text': text, Notes: emptyNotes[id] || 'L3 merges max+std' });
  }
  for (const [id, text] of pools.maximum) {
    addRow({ Surface: surface, Context: ctx, Key: key, 'Line ID': id, Minimal: '', Standard: '', Maximum: 'Y', 'Current Text': text, Notes: emptyNotes[id] || 'Max-only tier; L3 merged pool' });
  }
}

const discoverMin = [['d-m-1', 'Picked from your For You genres.'], ['d-m-2', 'Based on your genre settings.']];
const discoverStd = [
  ['d-s-1', 'You keep circling {rowTitle}. Flicklet noticed.'],
  ['d-s-2', 'Your settings made this row happen.'],
  ['d-s-3', 'Not on your lists yet — surfaced for browsing.'],
  ['d-s-4', 'Genre lean: {rowTitle}. Your history shaped the filter.'],
  ['d-s-5', 'Hand-picked by your For You choices, not by guilt.'],
  ['d-s-6', 'You watch {genre} sometimes. This row is obvious.'],
];
const discoverMax = [
  ['d-x-1', 'Another {rowTitle} batch — Flicklet is not subtle.'],
  ['d-x-2', 'If you add from here, Watching might finally look busy.'],
  ['d-x-3', 'Recommendations you have not committed to yet.'],
];
const discoverNotes = {
  'd-m-1': 'Functional — good Minimal',
  'd-m-2': 'Functional — good Minimal',
  'd-s-5': 'Candidate: new Standard (dry wit)',
  'd-x-2': 'Backlog/Watching stem',
};

for (const [id, text] of discoverMin) {
  addRow({ Surface: 'For You Intro', Context: 'Row intro under genre rail', Key: 'discover.rowIntro', 'Line ID': id, Minimal: 'Y', Standard: '', Maximum: '', 'Current Text': text, Notes: discoverNotes[id] || '' });
}
for (const [id, text] of discoverStd) {
  addRow({ Surface: 'For You Intro', Context: 'Row intro under genre rail', Key: 'discover.rowIntro', 'Line ID': id, Minimal: '', Standard: 'Y', Maximum: 'Y', 'Current Text': text, Notes: discoverNotes[id] || 'L3 merges max+std' });
}
for (const [id, text] of discoverMax) {
  addRow({ Surface: 'For You Intro', Context: 'Row intro under genre rail', Key: 'discover.rowIntro', 'Line ID': id, Minimal: '', Standard: '', Maximum: 'Y', 'Current Text': text, Notes: discoverNotes[id] || '' });
}

writeCsv('personality-line-review.csv', ['Surface', 'Context', 'Key', 'Line ID', 'Minimal', 'Standard', 'Maximum', 'Current Text', 'Notes'], phase1);

// Legacy parse
const persPath = path.join(root, 'src/data/personalities.ts');
const pers = fs.readFileSync(persPath, 'utf8');
const textKeys = [
  'welcome', 'empty', 'add', 'sarcasm', 'emptyWatching', 'emptyWishlist', 'emptyWatched', 'emptyUpNext',
  'itemAdded', 'itemRemoved', 'searchEmpty', 'searchLoading', 'errorGeneric', 'errorNetwork', 'errorNotFound',
  'successSave', 'successImport', 'successExport', 'marquee1', 'marquee2', 'marquee3', 'marquee4', 'marquee5',
];
const personalities = [
  'Valley Girl', 'Detective Noir', 'Sports Announcer', 'Zen', 'Surfer',
  'Medieval Bard', 'Grumpy Old Man', 'Fantasy Wizard',
];
const wired = new Set(['itemAdded', 'itemRemoved', 'searchLoading', 'errorGeneric']);

function extractStringArrays(block, key) {
  const re = new RegExp(`${key}:\\s*\\[([\\s\\S]*?)\\]\\s*,`, 'm');
  const match = re.exec(block);
  if (!match) return [];
  const arr = match[1];
  const out = [];
  const strRe = /"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'/g;
  let sm;
  while ((sm = strRe.exec(arr)) !== null) {
    out.push((sm[1] || sm[2] || '').replace(/\\"/g, '"'));
  }
  return out;
}

const legacy = [];
for (const p of personalities) {
  const start = pers.indexOf(`'${p}': {`);
  const next = pers.indexOf('\n  // ---', start + 1);
  const block = pers.slice(start, next > start ? next : start + 8000);
  for (const key of textKeys) {
    const variants = extractStringArrays(block, key);
    variants.forEach((text, i) => {
      legacy.push({
        System: 'Legacy character pack',
        Personality: p,
        TextKey: key,
        Variant: i + 1,
        'Wired in app': wired.has(key) ? 'YES' : 'NO',
        Text: text,
      });
    });
  }
}

writeCsv('personality-line-review-legacy.csv', ['System', 'Personality', 'TextKey', 'Variant', 'Wired in app', 'Text'], legacy);

// Markdown table for Phase 1
function mdEscape(s) {
  return String(s ?? '').replace(/\|/g, '\\|');
}
let mdTable = '| Surface | Context | Key | Line ID | Minimal | Standard | Maximum | Current Text | Notes |\n';
mdTable += '|---------|---------|-----|---------|:-------:|:--------:|:-------:|--------------|-------|\n';
for (const row of phase1) {
  mdTable += `| ${mdEscape(row.Surface)} | ${mdEscape(row.Context)} | ${mdEscape(row.Key)} | ${mdEscape(row['Line ID'])} | ${mdEscape(row.Minimal || '—')} | ${mdEscape(row.Standard || '—')} | ${mdEscape(row.Maximum || '—')} | ${mdEscape(row['Current Text'])} | ${mdEscape(row.Notes)} |\n`;
}

const legacyWired = legacy.filter((r) => r['Wired in app'] === 'YES');
const legacySummary = textKeys.map((key) => ({
  TextKey: key,
  Variants: 3,
  Characters: 8,
  TotalLines: 24,
  Wired: wired.has(key) ? 'YES' : 'NO',
}));

console.log(`Phase 1 lines: ${phase1.length}`);
console.log(`Legacy lines: ${legacy.length}`);
console.log(`Wired legacy lines: ${legacyWired.length}`);

export { phase1, legacy, legacySummary, mdTable };

// Write review markdown
const countsBySurface = {};
const countsByTier = { Minimal: 0, Standard: 0, Maximum: 0 };
for (const row of phase1) {
  countsBySurface[row.Surface] = (countsBySurface[row.Surface] || 0) + 1;
  if (row.Minimal === 'Y') countsByTier.Minimal++;
  if (row.Standard === 'Y') countsByTier.Standard++;
  if (row.Maximum === 'Y') countsByTier.Maximum++;
}

let legacyKeyTable = '| TextKey | Lines (8×3) | Wired in app | Phase 2 note |\n|---------|-------------|--------------|-------------|\n';
for (const key of textKeys) {
  legacyKeyTable += `| \`${key}\` | 24 | ${wired.has(key) ? '**YES**' : 'NO'} | ${wired.has(key) ? 'Migrate or replace in implementation' : 'Dormant — deprecate with character packs'} |\n`;
}

const review = `# Flicklet Personality Line Review (Phase 2)

**Status:** Export for content approval — no rewrite applied yet.  
**Voice contract:** [PERSONALITY_VOICE_CONTRACT.md](./PERSONALITY_VOICE_CONTRACT.md)  
**Editable export:** [personality-line-review.csv](./personality-line-review.csv) (Phase 1 — use Line ID column when returning edits)  
**Legacy export:** [personality-line-review-legacy.csv](./personality-line-review-legacy.csv) (552 lines — separate system)

---

## How to review

1. Read the [voice contract](./PERSONALITY_VOICE_CONTRACT.md).
2. Edit lines in \`personality-line-review.csv\` **or** annotate this doc — keep **Line ID** unchanged unless retiring a line.
3. Add proposed rewrites in a new column (\`Proposed Text\`) in CSV, or send a marked-up CSV back.
4. Do **not** edit \`flickletContent.ts\` until implementation phase.

### Column legend

| Column | Meaning |
|--------|---------|
| **Minimal / Standard / Maximum** | \`Y\` = line is in that tier's pool at runtime (see merge rules below) |
| **—** | Not in that tier's source pool |
| **Line ID** | Stable key for mapping edits (\`h-gs-1\`, \`e-w-m2\`, …) |

### Runtime pool rules (current)

- **Level 1 Minimal:** minimal-tier lines only; header uses signal subsets; marquee off.
- **Level 2 Standard:** standard-tier + signal header pools.
- **Level 3 Maximum:** maximum + standard merged for empty, For You, marquee, generic header.

---

## Summary statistics (Phase 1)

| Metric | Count |
|--------|------:|
| **Total unique lines** | ${phase1.length} |
| Lines tagged Minimal (\`Y\`) | ${countsByTier.Minimal} |
| Lines tagged Standard (\`Y\`) | ${countsByTier.Standard} |
| Lines tagged Maximum (\`Y\`) | ${countsByTier.Maximum} |

### Lines per surface

| Surface | Line count |
|---------|----------:|
${Object.entries(countsBySurface).map(([k,v]) => `| ${k} | ${v} |`).join('\n')}

### Effective pool size at each level (approximate)

| Level | Reachable lines (typical) |
|-------|---------------------------|
| Minimal (1) | ~18–22 (varies by header signal) |
| Standard (2) | ~55–60 |
| Maximum (3) | All ${phase1.length} (merged pools) |

---

## Phase 1 full line inventory

${mdTable}

---

## Repetition & quality flags (current copy — no rewrites)

### Repeated stems

| Stem | Line IDs | Risk |
|------|----------|------|
| "Want To Watch is empty" | e-n-m1, e-n-s1, e-n-x1 | Same column-name opener across tiers |
| "Currently Watching is empty" | e-w-s1, e-w-x1, h-ew-1 (partial) | Low variety in Empty Watching |
| "honest column" | m-s-5, e-w-x1 | Marquee + empty overlap |
| Want vs Watching backlog | h-wt-*, h-gs-*, m-s-*, m-x-*, d-x-2 | Thematic saturation |
| "Flicklet noticed" / "Flicklet has" | d-s-1, m-x-2, many header lines | Observer voice overused |

### Weak or overly bland (candidates for rewrite)

| Line ID | Issue |
|---------|-------|
| e-w-m1, e-n-m1, e-d-m1, e-u-m1, e-c-m1 | Column-label restatement; minimal variety (1 line each except watching) |
| h-gs-4 | Dashboard report tone — functional, not clever |
| e-u-s3 | Instructional — belongs in functional UI |
| d-m-1, d-m-2 | Fine for Minimal; zero Standard personality |

### Lines that sound like old Maximum → candidate **new Standard**

| Line ID | Current text (abbrev) |
|---------|----------------------|
| h-gs-5 | You add faster than you close things out… |
| d-s-5 | Hand-picked by your For You choices, not by guilt. |
| m-s-3 | One more episode is a lifestyle. |
| m-x-1 | The queue is a mood board with consequences. |
| h-gx-1 | Your Want list has more ambition than your Watching list. |

### Current Maximum tier — gap vs Phase 2 bar

Most \`maximum\`-only lines (${phase1.filter(r=>r.Maximum==='Y'&&r.Standard!=='Y').length} exclusive IDs) read closer to **dry Standard** than **screenshot Maximum**. Phase 2 rewrite should add profanity-allowed punch per voice contract.

### Small pools (need more lines in rewrite)

| Context | Minimal lines | Max-exclusive lines |
|---------|--------------:|--------------------:|
| Empty Want | 1 | 1 |
| Empty Watched | 1 | 1 |
| Empty Up Next | 1 | 1 |
| Empty Custom List | 1 | 1 |

---

## Cross-wiring note (Home Header ↔ Empty Watching)

\`resolveFlickletLine('empty.watching')\` may return **header signal** lines (e.g. \`h-wt-*\` when Want ≫ Watching) instead of \`empty.watching\` pool. Approve header signal lines for both SnarkDisplay and empty Watching contexts, or split keys in implementation.

---

## Legacy character packs (separate — not Phase 2 main table)

**File:** \`apps/web/src/data/personalities.ts\`  
**System:** \`getPersonalityText(personality, textKey)\` — 8 characters × 21 keys × 3 variants = **552 lines**  
**Setting:** \`settings.personality\` (character name) — **not** \`personalityLevel\`

${legacyKeyTable}

### Legacy lines still active in app (${legacyWired.length} lines)

| TextKey | Used in |
|---------|---------|
| \`itemAdded\` | Toast — \`state/actions.ts\` |
| \`itemRemoved\` | Toast — \`state/actions.ts\` |
| \`searchLoading\` | Search loading — \`SearchResults.tsx\` |
| \`errorGeneric\` | Error boundary — \`PersonalityErrorBoundary.tsx\` |

Full text for all 8 characters × 4 keys: see [personality-line-review-legacy.csv](./personality-line-review-legacy.csv) (filter \`Wired in app = YES\`).

**Phase 2 recommendation:** Migrate these four surfaces to Flicklet voice tiers or retire character packs from Settings UI.

### Dormant legacy (in file, not wired)

\`welcome\`, \`empty\`, \`add\`, \`sarcasm\`, \`emptyWatching\`, \`emptyWishlist\`, \`emptyWatched\`, \`emptyUpNext\`, \`searchEmpty\`, \`errorNetwork\`, \`errorNotFound\`, \`successSave\`, \`successImport\`, \`successExport\`, \`marquee1\`–\`marquee5\` — shown only in \`PersonalityExamples\` preview.

---

## Dead content (not in export — do not approve)

| File | Lines | Notes |
|------|------:|-------|
| \`config/homeMarqueeMessages.ts\` | 50 | Unused; App uses \`getFlickletMarqueeMessages()\` |
| Hardcoded fallbacks | few | SnarkDisplay, ListPage Returning, Not Interested |

---

## Recommended next step

1. Review [voice contract](./PERSONALITY_VOICE_CONTRACT.md).
2. Mark up [personality-line-review.csv](./personality-line-review.csv) with \`Proposed Text\` column (or send edited CSV).
3. Prioritize **Standard rewrite** (should feel like bold old Maximum) and **Maximum expansion** (new exclusive lines per surface).
4. Decide fate of **96 wired legacy lines** (migrate vs keep).
5. Hand approved CSV back for implementation — **Line ID** mapping required.

---

*Generated from \`flickletContent.ts\` — no runtime behavior changed.*
`;

fs.writeFileSync(path.join(docsDir, 'PERSONALITY_LINE_REVIEW.md'), review, 'utf8');
console.log('Wrote PERSONALITY_LINE_REVIEW.md');
