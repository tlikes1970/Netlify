import React from 'react';
import { PersonalityLevel, getPersonalityText } from '../lib/settings';

interface PersonalityExamplesProps {
  personalityLevel: PersonalityLevel;
}

export default function PersonalityExamples({ personalityLevel }: PersonalityExamplesProps) {
  const examples = [
    { category: 'Welcome Message', key: 'welcome' as const },
    { category: 'Empty List', key: 'emptyWatching' as const },
    { category: 'Item Added', key: 'itemAdded' as const },
    { category: 'Search Empty', key: 'searchEmpty' as const },
    { category: 'Error Message', key: 'errorGeneric' as const },
    { category: 'Marquee Message', key: 'marquee1' as const },
  ];

  const getPersonalityName = (level: PersonalityLevel): string => {
    switch (level) {
      case 1: return 'Regular';
      case 2: return 'Semi-sarcastic';
      case 3: return 'Severely sarcastic';
      default: return 'Regular';
    }
  };

  const getPersonalityDescription = (level: PersonalityLevel): string => {
    switch (level) {
      case 1: return 'Friendly and helpful';
      case 2: return 'A bit cheeky';
      case 3: return 'Maximum sass';
      default: return 'Friendly and helpful';
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
          {getPersonalityName(personalityLevel)} Personality
        </h3>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          {getPersonalityDescription(personalityLevel)}
        </p>
      </div>

      <div className="grid gap-3">
        {examples.map(({ category, key }) => (
          <div key={key} className="p-3 rounded-lg" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--line)', border: '1px solid' }}>
            <div className="text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>
              {category}:
            </div>
            <div className="text-sm" style={{ color: 'var(--text)' }}>
              "{getPersonalityText(key, personalityLevel)}"
            </div>
          </div>
        ))}
      </div>

      <div className="text-center text-xs" style={{ color: 'var(--muted)' }}>
        These messages will appear throughout the app based on your personality setting.
        <br />
        <span className="text-green-400">✓ Apple App Store compliant</span>
      </div>
    </div>
  );
}
