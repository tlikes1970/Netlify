/**
 * Process: Spoiler Wrapper Component
 * Purpose: Wrap spoiler content with blur/collapse until user clicks to reveal
 * Data Source: containsSpoilers boolean from post/comment data
 * Update Path: N/A - display component
 * Dependencies: None
 */

import { useState } from 'react';

interface SpoilerWrapperProps {
  containsSpoilers: boolean;
  children: React.ReactNode;
  title?: string;
}

export default function SpoilerWrapper({
  containsSpoilers,
  children,
  title,
}: SpoilerWrapperProps) {
  const [revealed, setRevealed] = useState(false);

  if (!containsSpoilers) {
    return <>{children}</>;
  }

  return (
    <div className="spoiler-wrapper">
      {title && (
        <div className="mb-2">
          <span
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            ⚠️ Contains Spoilers
          </span>
        </div>
      )}
      {revealed ? (
        <div>{children}</div>
      ) : (
        <div>
          <div
            className="relative cursor-pointer select-none"
            onClick={() => setRevealed(true)}
            style={{
              filter: 'blur(8px)',
              userSelect: 'none',
              pointerEvents: 'auto',
            }}
          >
            {children}
          </div>
          <button
            onClick={() => setRevealed(true)}
            className="mt-2 px-3 py-1.5 rounded text-sm font-medium transition-colors"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: '#fff',
            }}
          >
            Reveal Spoilers
          </button>
        </div>
      )}
    </div>
  );
}

