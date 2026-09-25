/**
 * Build flickletPersonalityPhase2.ts from approved CSV (one-time / when CSV updates).
 * Run: node scripts/build-flicklet-personality-phase2.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const csvPath = path.join(root, 'docs', 'flicket_personality_lines_full 2.csv');
const outPath = path.join(root, 'src', 'data', 'flickletPersonalityPhase2.ts');

function parseCsv(text) {
  const rows = [];
  let i = 0;
  const len = text.length;

  function readField() {
    if (text[i] === '"') {
      i++;
      let field = '';
      while (i < len) {
        if (text[i] === '"') {
          if (text[i + 1] === '"') {
            field += '"';
            i += 2;
          } else {
            i++;
            break;
          }
        } else {
          field += text[i++];
        }
      }
      if (text[i] === ',') i++;
      return field;
    }
    let field = '';
    while (i < len && text[i] !== ',' && text[i] !== '\n' && text[i] !== '\r') {
      field += text[i++];
    }
    if (text[i] === ',') i++;
    return field;
  }

  // header
  readField();
  readField();
  readField();
  readField();
  if (text[i] === '\r') i++;
  if (text[i] === '\n') i++;

  while (i < len) {
    if (text[i] === '\r' || text[i] === '\n') {
      i++;
      continue;
    }
    const context = readField();
    const tier = readField();
    const line = readField();
    const notes = readField();
    if (context) rows.push({ context, tier, line, notes });
    if (text[i] === '\r') i++;
    if (text[i] === '\n') i++;
  }
  return rows;
}

function slug(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

function escapeTs(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

const raw = fs.readFileSync(csvPath, 'utf8');
const rows = parseCsv(raw);

const contexts = [...new Set(rows.map((r) => r.context))].sort();
const tiers = ['Minimal', 'Standard', 'Maximum'];

const pools = {};
const countsByContext = {};
const countsByTier = { Minimal: 0, Standard: 0, Maximum: 0 };

for (const ctx of contexts) {
  pools[ctx] = { Minimal: [], Standard: [], Maximum: [] };
  countsByContext[ctx] = { Minimal: 0, Standard: 0, Maximum: 0 };
}

const contextIndexes = {};

for (const row of rows) {
  if (!tiers.includes(row.tier)) continue;
  const key = `${row.context}::${row.tier}`;
  contextIndexes[key] = (contextIndexes[key] ?? 0) + 1;
  const idx = contextIndexes[key];
  const tierCode = { Minimal: 'min', Standard: 'std', Maximum: 'max' }[row.tier];
  const id = `p2-${slug(row.context)}-${tierCode}-${String(idx).padStart(2, '0')}`;
  pools[row.context][row.tier].push({ id, text: row.line });
  countsByContext[row.context][row.tier]++;
  countsByTier[row.tier]++;
}

const contextUnion = contexts
  .map((c) => `  | '${c.replace(/'/g, "\\'")}'`)
  .join('\n');

let poolsTs = 'const POOLS: Record<PersonalityContext, Record<PersonalityTier, FlickletLine[]>> = {\n';
for (const ctx of contexts) {
  poolsTs += `  '${escapeTs(ctx)}': {\n`;
  for (const tier of tiers) {
    poolsTs += `    ${tier}: [\n`;
    for (const line of pools[ctx][tier]) {
      poolsTs += `      { id: '${line.id}', text: '${escapeTs(line.text)}' },\n`;
    }
    poolsTs += `    ],\n`;
  }
  poolsTs += `  },\n`;
}
poolsTs += '};\n';

const file = `/**
 * Flicklet Personality Phase 2 — generated from approved CSV.
 * Source: docs/flicket_personality_lines_full 2.csv
 * Regenerate: node scripts/build-flicklet-personality-phase2.mjs
 * DO NOT hand-edit line text — update CSV and rebuild.
 */

export type PersonalityTier = 'Minimal' | 'Standard' | 'Maximum';

export type PersonalityContext =
${contextUnion};

export type FlickletLine = {
  id: string;
  text: string;
};

${poolsTs}

export const PERSONALITY_PHASE2_STATS = {
  totalLines: ${rows.length},
  contexts: ${contexts.length},
  byTier: ${JSON.stringify(countsByTier)},
  byContext: ${JSON.stringify(countsByContext, null, 2).replace(/\n/g, '\n  ')},
} as const;

export function personalityTierFromLevel(level: 1 | 2 | 3): PersonalityTier {
  if (level === 1) return 'Minimal';
  if (level === 3) return 'Maximum';
  return 'Standard';
}

/** Strict tier isolation — no cross-tier merging. */
export function getLinesForContext(
  context: PersonalityContext,
  tier: PersonalityTier
): FlickletLine[] {
  return POOLS[context]?.[tier] ?? [];
}

export function getAllContexts(): PersonalityContext[] {
  return Object.keys(POOLS) as PersonalityContext[];
}
`;

fs.writeFileSync(outPath, file, 'utf8');
console.log(`Wrote ${outPath}`);
console.log(`Lines: ${rows.length}, Contexts: ${contexts.length}`);
console.log('By tier:', countsByTier);
