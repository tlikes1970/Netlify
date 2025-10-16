// scripts/build-inputs-from-pack.mjs
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

function parseArgs() {
  const out = {};
  for (const a of process.argv.slice(2)) {
    const m = /^--([^=]+)=(.*)$/.exec(a);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

const __FILE = fileURLToPath(import.meta.url);
const __DIR = path.dirname(__FILE);

// Default ROOT = repo root if script is in /scripts
const DEFAULT_ROOT = path.resolve(__DIR, '..');

const args = parseArgs();
const ROOT = args.root ? path.resolve(args.root) : DEFAULT_ROOT;
const PACK = args.pack ? path.resolve(args.pack) : path.join(ROOT, 'migration-pack');
const OUT  = args.out  ? path.resolve(args.out)  : path.join(ROOT, 'migration', 'inputs');

async function ensureDir(p){ await fs.mkdir(p, { recursive: true }); }
async function readJSON(p){ try { return JSON.parse(await fs.readFile(p, 'utf8')); } catch { return null; } }
async function writeJSON(p, obj){ await fs.writeFile(p, JSON.stringify(obj, null, 2)); }
async function writeText(p, text){ await fs.writeFile(p, text); }
async function exists(p){ try { await fs.access(p); return true; } catch { return false; } }

function pickToken(tokens, names=[]) {
  if (!Array.isArray(tokens)) return null;
  const byName = new Map(tokens.map(t => [String(t.name||'').toLowerCase(), t]));
  for (const n of names) {
    const t = byName.get(n.toLowerCase());
    if (t) return t.value ?? t.val ?? t.token ?? null;
  }
  return null;
}

async function main(){
  console.log('🔧 Building curated inputs from migration-pack…');
  console.log('ROOT:', ROOT);
  console.log('PACK:', PACK);
  console.log('OUT :', OUT);

  if (!(await exists(PACK))) {
    console.error('❌ migration-pack not found at', PACK);
    console.error('   Pass --pack=\"<absolute path>\" or ensure it exists under ROOT.');
    process.exit(2);
  }

  await ensureDir(OUT);

  // 1) DESIGN_TOKENS.json
  const cssTokens = (await readJSON(path.join(PACK, 'styles', 'css-tokens.json'))) || [];
  const design = {
    meta: { source: 'migration-pack', version: 1 },
    color: {
      bg: { base: pickToken(cssTokens, ['bg','background','surface']) || '#0B0B0F' },
      text: { primary: pickToken(cssTokens, ['text','foreground']) || '#FFFFFF', secondary: '#B6B6C2' },
      accent: { primary: pickToken(cssTokens, ['primary','accent']) || '#FF3D71' }
    },
    space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
    radius: { sm: 6, md: 12, lg: 16 },
    sizes: { cardMin: 154, posterAR: '2/3' },
    z: { search: 1000, modal: 1100 }
  };
  await writeJSON(path.join(OUT, 'DESIGN_TOKENS.json'), design);
  console.log('  • DESIGN_TOKENS.json ✔');

  // 2) FEATURE_FLAGS.json
  const storage = (await readJSON(path.join(PACK, 'models', 'storage-keys.json'))) || [];
  const discovered = [];
  const defaults = { community_player:false, community_games_enabled:false, homeRowSpotlight:false };
  for (const k of storage) {
    const key = typeof k === 'string' ? k : (k?.key || k?.name || '');
    if (!key) continue;
    if (/:enabled$/i.test(key) || /(^|:)feature(s)?[:/]/i.test(key)) {
      const norm = String(key).replace(/[^a-z0-9:_-]/gi, '').replace(/[:/]+/g, '_');
      if (!(norm in defaults)) defaults[norm] = false;
      discovered.push(key);
    }
  }
  await writeJSON(path.join(OUT, 'FEATURE_FLAGS.json'), { defaults, discovered });
  console.log('  • FEATURE_FLAGS.json ✔');

  // 3) DATA_MODEL.json
  const dataContracts = (await readJSON(path.join(PACK, 'models', 'data-contracts.json'))) || {};
const dataModel = Object.keys(dataContracts).length ? dataContracts : {
  Show:      { id: 'string', title: 'string', type: "'movie'|'tv'", poster: 'string|null' },
  Card:      { id: 'string', kind: "'show'|'person'", title: 'string', poster: 'string|null',
               actions: ['WantToWatch','Watched','NotInterested','Delete','HolidayAdd'] },
  List:      { id: 'string', name: 'string', kind: "'Holiday'|'Custom'", owner: 'userId' },
  ListEntry: { id: 'string', listId: 'string', targetId: 'string', status: "'planned'|'done'" },
  UserProfile:{ id: 'string', displayName: 'string', flags: 'Record<string,boolean>' }
};

  await writeJSON(path.join(OUT, 'DATA_MODEL.json'), dataModel);
  console.log('  • DATA_MODEL.json ✔');

  // 4) CARDS_V2_SPEC.md
  await writeText(path.join(OUT, 'CARDS_V2_SPEC.md'),
`# Cards v2 – Home Variant
- Poster container keeps aspect-ratio: 2/3 at all breakpoints.
- Actions area: grid 2 cols on home; 1 col on narrow cards.
- Buttons: Want to Watch, Watched, Not Interested, Delete, Holiday + (contextual).
- Keyboard: arrows scroll rail; Enter opens details.
`);
  console.log('  • CARDS_V2_SPEC.md ✔');

  // 5) RAILS.json
  const strings = (await readJSON(path.join(PACK, 'ui', 'strings.json'))) || [];
  const sText = new Set(Array.isArray(strings) ? strings.map(x => String(x).toLowerCase()) : []);
  const possible = [
    { id:'your-shows', title:'Your Shows' },
    { id:'community', title:'Community', flag:'community_player', enabled:false },
    { id:'for-you', title:'For You' },
    { id:'in-theaters', title:'In Theaters' },
    { id:'feedback', title:'Feedback' }
  ];
  const railsFound = possible.filter(r => sText.has(r.title.toLowerCase()));
  const rails = railsFound.length ? railsFound : possible.map(r => ({ ...r, enabled: r.enabled ?? true }));
  await writeJSON(path.join(OUT, 'RAILS.json'), rails);
  console.log('  • RAILS.json ✔');

  // 6) API_CONTRACTS.md
  const endpoints = (await readJSON(path.join(PACK, 'api', 'tmdb-endpoints.json'))) || [];
  await writeText(path.join(OUT, 'API_CONTRACTS.md'),
`# API contracts (initial)
- Netlify Function (planned): /.netlify/functions/tmdb-proxy?path=<tmdb path>&query=<q>&page=<n>&media_type=<movie|tv|multi>&language=en-US

## Endpoints discovered in legacy
${(Array.isArray(endpoints) ? endpoints : []).map(e => '- ' + String(e)).join('\n')}
`);
  console.log('  • API_CONTRACTS.md ✔');

  // 7) ACCEPTANCE_TESTS.md
  await writeText(path.join(OUT, 'ACCEPTANCE_TESTS.md'),
`# Console acceptance tests
- window.debugRails() returns 5 rails with correct ids and horizontal scrolling.
- window.debugCards() shows posterAR ~ 2 / 3 and actions grid present.

# Playwright smoke
- Home renders 5 rails; For You and In Theaters hydrated; sticky search persists after scroll.
`);
  console.log('  • ACCEPTANCE_TESTS.md ✔');

  // 8) ENV_KEYS.json
  await writeJSON(path.join(OUT, 'ENV_KEYS.json'), {
    VITE_TMDB_KEY: '',
    VITE_FIREBASE_API_KEY: '',
    VITE_FIREBASE_AUTH_DOMAIN: '',
    VITE_FIREBASE_PROJECT_ID: '',
    VITE_FIREBASE_APP_ID: ''
  });
  console.log('  • ENV_KEYS.json ✔');

  console.log('\n✅ Curated inputs written to:', OUT);
}

main().catch(err => { console.error('❌ build-inputs-from-pack failed:', err.message); process.exit(1); });






