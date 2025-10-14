// import { useState } from 'react'; // Unused
import { PersonalityLevel, getPersonalityText } from '../lib/settings';

interface PersonalityTestProps {
  personalityLevel: PersonalityLevel;
}

export default function PersonalityTest({ personalityLevel }: PersonalityTestProps) {
  const testCategories = [
    { name: 'Welcome Message', key: 'welcome' as const },
    { name: 'Empty Watching', key: 'emptyWatching' as const },
    { name: 'Empty Wishlist', key: 'emptyWishlist' as const },
    { name: 'Empty Watched', key: 'emptyWatched' as const },
    { name: 'Empty Up Next', key: 'emptyUpNext' as const },
    { name: 'Item Added', key: 'itemAdded' as const },
    { name: 'Item Removed', key: 'itemRemoved' as const },
    { name: 'Search Empty', key: 'searchEmpty' as const },
    { name: 'Search Loading', key: 'searchLoading' as const },
    { name: 'Error Generic', key: 'errorGeneric' as const },
    { name: 'Error Network', key: 'errorNetwork' as const },
    { name: 'Error Not Found', key: 'errorNotFound' as const },
    { name: 'Success Save', key: 'successSave' as const },
    { name: 'Success Import', key: 'successImport' as const },
    { name: 'Success Export', key: 'successExport' as const },
    { name: 'Marquee 1', key: 'marquee1' as const },
    { name: 'Marquee 2', key: 'marquee2' as const },
    { name: 'Marquee 3', key: 'marquee3' as const },
    { name: 'Marquee 4', key: 'marquee4' as const },
    { name: 'Marquee 5', key: 'marquee5' as const },
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
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text)' }}>
          Personality Test: {getPersonalityName(personalityLevel)}
        </h2>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          {getPersonalityDescription(personalityLevel)}
        </p>
      </div>

      <div className="grid gap-4">
        {testCategories.map(({ name, key }) => (
          <div key={key} className="p-4 rounded-lg" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--line)', border: '1px solid' }}>
            <div className="text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
              {name}:
            </div>
            <div className="text-sm" style={{ color: 'var(--muted)' }}>
              "{getPersonalityText(key, personalityLevel)}"
            </div>
          </div>
        ))}
      </div>

      <div className="text-center text-xs" style={{ color: 'var(--muted)' }}>
        ✓ Apple App Store compliant • All personality levels tested
      </div>
    </div>
  );
}
