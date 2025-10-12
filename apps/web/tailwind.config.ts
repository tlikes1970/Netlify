import type { Config } from 'tailwindcss';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tokensPath = path.resolve(__dirname, '../../migration/inputs/DESIGN_TOKENS.json');

let TOKENS: any = {};
try { TOKENS = JSON.parse(fs.readFileSync(tokensPath, 'utf8')); } catch { TOKENS = {}; }

const px = (n: unknown) => (typeof n === 'number' ? `${n}px` : undefined);

export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  safelist: [
    'min-h-screen','bg-black','text-white','px-4','py-3',
    'flex','gap-3','overflow-x-auto','snap-x','snap-mandatory','pb-2',
    'w-[154px]','h-[231px]','rounded-2xl','animate-pulse',
    'text-base','font-semibold','text-neutral-200'
  ],
  theme: {
    extend: {
      colors: {
        bg: { base: TOKENS?.color?.bg?.base ?? '#0B0B0F' },
        text: {
          primary: TOKENS?.color?.text?.primary ?? '#FFFFFF',
          secondary: TOKENS?.color?.text?.secondary ?? '#B6B6C2'
        },
        accent: { primary: TOKENS?.color?.accent?.primary ?? '#FF3D71' },
        // Search card colors from mockup
        card: 'var(--card)',
        muted: 'var(--muted)',
        text: 'var(--text)',
        line: 'var(--line)',
        accent: 'var(--accent)',
        btn: 'var(--btn)',
        btn2: 'var(--btn2)'
      },
      spacing: {
        xs: px(TOKENS?.space?.xs) ?? '4px',
        sm: px(TOKENS?.space?.sm) ?? '8px',
        md: px(TOKENS?.space?.md) ?? '12px',
        lg: px(TOKENS?.space?.lg) ?? '16px',
        xl: px(TOKENS?.space?.xl) ?? '24px',
        xxl: px(TOKENS?.space?.xxl) ?? '32px'
      },
      borderRadius: {
        sm: px(TOKENS?.radius?.sm) ?? '6px',
        md: px(TOKENS?.radius?.md) ?? '12px',
        lg: px(TOKENS?.radius?.lg) ?? '16px'
      }
    }
  },
  plugins: []
} satisfies Config;
