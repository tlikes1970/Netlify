export default function CommunityPanel() {
  return (
    <div data-rail="community" className="grid md:grid-cols-3 gap-4 items-stretch">
      {/* Player on the left (spans 2) */}
      <div className="md:col-span-2">
        <div className="rounded-2xl overflow-hidden border border-white/5 bg-neutral-900">
          <div className="aspect-video w-full flex items-center justify-center text-neutral-400">
            Player
          </div>
        </div>
      </div>

      {/* Right column: two equal halves that fill full height */}
      <div className="grid grid-rows-[1fr_1fr] gap-4 h-full">
        <div className="rounded-2xl bg-neutral-900 border border-white/5 p-4 flex items-center justify-center">
          <div className="w-full">
            <h3 className="text-sm font-semibold text-neutral-200 mb-2">Flickword</h3>
            <p className="text-xs text-neutral-400">Daily movie word game.</p>
          </div>
        </div>
        <div className="rounded-2xl bg-neutral-900 border border-white/5 p-4 flex items-center justify-center">
          <div className="w-full">
            <h3 className="text-sm font-semibold text-neutral-200 mb-2">Trivia</h3>
            <p className="text-xs text-neutral-400">Quick 5-question quiz.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
