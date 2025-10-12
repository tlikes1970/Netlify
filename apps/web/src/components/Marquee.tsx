type Props = {
  title?: string;
  overview?: string;
  backdrop?: string; // full URL
  onWant?: () => void;
};

export default function Marquee({ title, overview, backdrop, onWant }: Props) {
  return (
    <section aria-label="Featured" className="w-full border-b border-white/5">
      <div className="relative aspect-[16/6] md:aspect-[16/5] lg:aspect-[16/4] overflow-hidden">
        {backdrop ? (
          <img src={backdrop} alt={title || ''} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-neutral-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/0" />
        <div className="absolute inset-x-0 bottom-0">
          <div className="max-w-screen-2xl mx-auto px-4 py-4">
            <h1 className="text-xl md:text-2xl font-semibold text-white mb-2 line-clamp-2">{title || 'Featured'}</h1>
            {overview ? <p className="text-sm md:text-base text-neutral-200 line-clamp-3 max-w-3xl">{overview}</p> : null}
            <div className="mt-3">
              <button className="btn" onClick={onWant}>Want to Watch</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
