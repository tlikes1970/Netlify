/**
 * Process: Search Aliases
 * Purpose: Map common abbreviations and shorthand to full titles
 * Data Source: Common user queries and franchise conventions
 * Update Path: Add more aliases as needed, extend to support locale-specific mappings
 * Dependencies: normalize.ts for matching
 */

export const ALIASES: Record<string, string> = {
  'lotr': 'the lord of the rings',
  't2': 'terminator 2: judgment day',
  't3': 'terminator 3: rise of the machines',
  'got': 'game of thrones',
  'br': 'blade runner',
  'dbz': 'dragon ball z',
  'db': 'dragon ball',
  'sw': 'star wars',
  'st': 'star trek',
  'hp': 'harry potter',
  'hp1': 'harry potter and the philosophers stone',
  'hp2': 'harry potter and the chamber of secrets',
  'matrix': 'the matrix',
  'matrix2': 'the matrix reloaded',
  'matrix3': 'the matrix revolutions',
  'john wick': 'john wick',
  'jw': 'john wick',
  'it': 'it',
  'john carter': 'john carter',
  'gladiator': 'gladiator',
  'gladiatpr': 'gladiator', // common typo
  'memento': 'memento',
  'amelie': 'amelie',
  'parasite': 'parasite',
  'arrival': 'arrival',
  'ex machina': 'ex machina',
  'ex mach': 'ex machina',
};

/**
 * Resolve an alias to the full query
 */
export function resolveAlias(query: string): string {
  const lowerQuery = query.toLowerCase().trim();
  return ALIASES[lowerQuery] || query;
}

