import UnifiedSearch from './UnifiedSearch';
import AvatarMenu from './AvatarMenu';

export default function HeaderV2() {

  return (
    <header className="w-full bg-black/90 backdrop-blur border-b border-white/5 sticky top-0 z-50">
      <div className="max-w-screen-2xl mx-auto px-4 py-3 grid grid-cols-3 items-center gap-4">
        {/* Left: Logo */}
        <div className="flex items-center">
          <div className="text-lg font-bold tracking-wide text-white">
            Flicklet
          </div>
        </div>

        {/* Middle: Persistent Search */}
        <div className="flex-1 flex justify-center">
          <UnifiedSearch />
        </div>

        {/* Right: Avatar Menu */}
        <div className="flex justify-end">
          <AvatarMenu user={null} isAuthenticated={false} />
        </div>
      </div>
    </header>
  );
}
