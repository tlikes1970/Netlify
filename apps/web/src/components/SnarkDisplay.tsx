// import { useEffect, useState } from 'react'; // Unused
import { useUsername } from '../hooks/useUsername';
import { useSettings, getPersonalityText } from '../lib/settings';

export default function SnarkDisplay() {
  const { username } = useUsername();
  const settings = useSettings();

  if (!username) {
    return null;
  }

  const snarkText = getPersonalityText('welcome', settings.personalityLevel, { username });

  return (
    <div className="text-sm" style={{ color: 'var(--muted)' }}>
      {snarkText}
    </div>
  );
}
