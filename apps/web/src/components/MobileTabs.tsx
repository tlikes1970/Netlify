import { useTranslations } from '../lib/language';
import { useLibrary } from '../lib/storage';
import { useCustomLists } from '../lib/customLists';

type TabId = 'watching'|'want'|'watched'|'mylists'|'discovery';
export type MobileTabsProps = { current: 'home' | TabId; onChange: (next: 'home' | TabId) => void; };

export default function MobileTabs({ current, onChange }: MobileTabsProps) {
  const translations = useTranslations();
  const customLists = useCustomLists();
  
  // Get reactive counts for each list
  const watchingItems = useLibrary('watching');
  const wantItems = useLibrary('wishlist');
  const watchedItems = useLibrary('watched');
  
  const watchingCount = watchingItems.length;
  const wantCount = wantItems.length;
  const watchedCount = watchedItems.length;
  const myListsCount = customLists.length;
  
  const TABS: { id: TabId; label: string; count: number; icon: string }[] = [
    { id: 'watching', label: 'Watching', count: watchingCount, icon: '▶️' },
    { id: 'want',     label: 'Wishlist', count: wantCount, icon: '❤️' },
    { id: 'watched',  label: 'Watched', count: watchedCount, icon: '✅' },
    { id: 'mylists',  label: 'Lists', count: myListsCount, icon: '📋' },
    { id: 'discovery',label: 'Discover', count: 0, icon: '🔍' }
  ];

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-2 py-2 pb-safe"
      style={{ 
        paddingBottom: 'calc(8px + env(safe-area-inset-bottom))',
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)'
      }}
    >
      <div className="flex items-center justify-around">
        {/* Home Tab */}
        <button
          onClick={() => onChange('home')}
          className="flex flex-col items-center justify-center p-2 min-h-[60px] transition-all duration-300 ease-out relative"
          style={{
            color: current === 'home' ? 'var(--accent)' : '#666',
            transform: current === 'home' ? 'scale(1.1)' : 'scale(1)'
          }}
        >
          <span className="text-xl mb-1">🏠</span>
          <span className="text-xs font-medium">{translations.home}</span>
          {current === 'home' && (
            <div 
              className="absolute top-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 rounded-full"
              style={{ backgroundColor: 'var(--accent)' }}
            />
          )}
        </button>

        {/* Main Tabs */}
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="flex flex-col items-center justify-center p-2 min-h-[60px] transition-all duration-300 ease-out relative"
            style={{
              color: current === tab.id ? 'var(--accent)' : '#666',
              transform: current === tab.id ? 'scale(1.1)' : 'scale(1)'
            }}
          >
            <div className="relative">
              <span className="text-xl mb-1">{tab.icon}</span>
              {tab.count > 0 && (
                <span 
                  className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1"
                  style={{ fontSize: '10px' }}
                >
                  {tab.count}
                </span>
              )}
            </div>
            <span className="text-xs font-medium">{tab.label}</span>
            {current === tab.id && (
              <div 
                className="absolute top-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 rounded-full"
                style={{ backgroundColor: 'var(--accent)' }}
              />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
