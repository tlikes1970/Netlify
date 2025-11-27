/**
 * Process: Personality Examples Display
 * Purpose: Shows example text for the currently selected personality
 * Data Source: personalities.ts via getPersonalityText helper
 * Update Path: Updates automatically when personality prop changes
 * Dependencies: data/personalities.ts
 */

import { getPersonalityText, PERSONALITY_LIST, DEFAULT_PERSONALITY } from '../lib/settings';
import type { PersonalityName, TextKey } from '../data/personalities';

interface PersonalityExamplesProps {
  personality?: PersonalityName;
  // Legacy support - will be ignored if personality is provided
  personalityLevel?: 1 | 2 | 3;
}

export default function PersonalityExamples({ personality, personalityLevel }: PersonalityExamplesProps) {
  // Use new personality name if provided, otherwise try to map from legacy level
  const currentPersonality: PersonalityName = personality || DEFAULT_PERSONALITY;
  
  // Find the personality info
  const personalityInfo = PERSONALITY_LIST.find(p => p.name === currentPersonality);
  
  const examples: Array<{ category: string; key: TextKey }> = [
    { category: 'Welcome', key: 'welcome' },
    { category: 'Empty List', key: 'emptyWatching' },
    { category: 'Item Added', key: 'itemAdded' },
    { category: 'Search Empty', key: 'searchEmpty' },
    { category: 'Error', key: 'errorGeneric' },
    { category: 'Marquee', key: 'marquee1' },
  ];

  return (
    <div className="space-y-3">
      <div className="text-center">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
          {currentPersonality}
        </h3>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          {personalityInfo?.description || 'Unique personality'}
        </p>
      </div>

      <div className="grid gap-2">
        {examples.map(({ category, key }) => (
          <div 
            key={key} 
            className="p-2 rounded-lg" 
            style={{ 
              backgroundColor: 'var(--card)', 
              border: '1px solid var(--border)' 
            }}
          >
            <div className="text-xs font-medium mb-0.5" style={{ color: 'var(--muted)' }}>
              {category}:
            </div>
            <div className="text-sm" style={{ color: 'var(--text)' }}>
              "{getPersonalityText(currentPersonality, key, { username: 'Guest' })}"
            </div>
          </div>
        ))}
      </div>

      <div className="text-center text-xs" style={{ color: 'var(--muted)' }}>
        Text varies randomly from 3 variants per category.
      </div>
    </div>
  );
}
