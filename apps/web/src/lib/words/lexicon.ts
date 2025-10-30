// Thin client wrapper around the lexicon worker + shared normalization utilities

let worker: Worker | null = null;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('../../workers/lexicon.worker.ts', import.meta.url), { type: 'module' });
  }
  return worker;
}

export function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function isFiveLetters(s: string): boolean {
  return /^[a-z]{5}$/.test(s);
}

export async function isValidLocal(word: string): Promise<boolean> {
  const w = getWorker();
  return new Promise<boolean>((resolve) => {
    const handler = (e: MessageEvent) => {
      resolve(Boolean(e.data?.ok));
      w.removeEventListener('message', handler as any);
    };
    w.addEventListener('message', handler as any);
    w.postMessage({ type: 'check', word });
  });
}


