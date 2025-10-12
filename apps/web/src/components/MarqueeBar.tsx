import { useEffect, useState } from 'react';

const LINES = [
  'Be right back, arguing with the popcorn machine.',
  'Half the runtime is just staring dramatically into the distance.',
  'Plot holes? More like scenic shortcuts.',
  'Subtitles are just achievements for your eyes.'
];

export default function MarqueeBar() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI(v => (v + 1) % LINES.length), 4000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="w-full bg-neutral-950 border-b border-white/5">
      <div className="max-w-screen-2xl mx-auto px-4 py-2">
        <div className="h-5 overflow-hidden">
          <div className="text-xs text-neutral-300 transition-opacity duration-300">{LINES[i]}</div>
        </div>
      </div>
    </div>
  );
}
