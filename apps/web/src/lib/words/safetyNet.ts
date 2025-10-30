// Safety net acceptance for common English morphology and US/UK variants

const SUFFIXES = ['s', 'es', 'ed', 'ing', 'er', 'est'] as const;

const US_UK_MAP: Record<string, string> = {
  color: 'colour',
  flavour: 'flavor',
  flavor: 'flavour',
  armour: 'armor',
  armor: 'armour',
  theatre: 'theater',
  theater: 'theatre',
  grey: 'gray',
  gray: 'grey',
  mould: 'mold',
  mold: 'mould',
};

export async function safetyNetAccept(
  word: string,
  has: (w: string) => Promise<boolean>
): Promise<boolean> {
  // Morphology: try stripping common suffixes
  for (const suf of SUFFIXES) {
    if (word.endsWith(suf) && word.length > suf.length) {
      const base = word.slice(0, -suf.length);
      if (base.length === 5 && (await has(base))) return true;
    }
  }

  // US/UK swaps (only when length remains 5)
  const alt = US_UK_MAP[word];
  if (alt && alt.length === 5 && (await has(alt))) return true;

  return false;
}


