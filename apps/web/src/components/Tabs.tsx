import { useTranslations } from '../lib/language';
import { useLibrary } from '../lib/storage';
import { useReturningShows } from '@/state/selectors/useReturningShows';
import { useCustomLists } from '../lib/customLists';

type TabId = 'watching'|'want'|'watched'|'returning'|'mylists'|'discovery'; // Removed 'not' - now handled by modal
export type TabsProps = { current: 'home' | TabId; onChange: (next: 'home' | TabId) => void; };

export default function Tabs({ current, onChange }: TabsProps) {
  const translations = useTranslations();
  const customLists = useCustomLists();
  
  // Get reactive counts for each list
  const watchingItems = useLibrary('watching');
  const wantItems = useLibrary('wishlist');
  const watchedItems = useLibrary('watched');
  const returningItems = useReturningShows();
  
  const watchingCount = watchingItems.length;
  const wantCount = wantItems.length;
  const watchedCount = watchedItems.length;
  const myListsCount = Array.isArray(customLists) ? customLists.length : 0;
  const returningCount = returningItems.length;
  
  const TABS: { id: TabId; label: string; count: number }[] = [
    { id: 'watching', label: translations.currentlyWatching, count: watchingCount },
    { id: 'want',     label: translations.wantToWatch, count: wantCount },
    { id: 'watched',  label: translations.watched, count: watchedCount },
    { id: 'returning',label: 'Returning', count: returningCount },
    { id: 'mylists',  label: translations.myLists || 'My Lists', count: myListsCount },
    { id: 'discovery',label: translations.discovery, count: 0 }, // Discovery doesn't have a count
  ];
  return (
    <div className="w-full">
      <div className="w-full px-4 py-4">
        <nav aria-label="Primary" className="w-full">
          <div className="flex items-center gap-4 w-full">
            {/* All Tabs - Home + Main Tabs */}
            <div role="tablist" aria-label="Navigation" className="flex gap-4 w-full items-center">
              {/* Home Tab */}
              <button
                aria-current={current === 'home' ? 'page' : undefined}
                onClick={() => onChange('home')}
                className="px-6 py-3 rounded-xl text-base font-semibold transition-all duration-150 ease-out hover:scale-105 active:scale-95 active:shadow-inner hover:shadow-md shadow-sm flex-1 justify-center"
                style={{
                  backgroundColor: current === 'home' ? 'var(--accent)' : 'var(--card)',
                  color: current === 'home' ? 'white' : 'var(--text)',
                  border: current === 'home' ? 'none' : '1px solid var(--line)'
                }}
              >
                {translations.home}
              </button>
              
              {/* Main Tabs */}
              {TABS.map(t => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={current === t.id}
                  onClick={() => onChange(t.id)}
                  className="px-6 py-3 rounded-xl text-base font-semibold transition-all duration-150 ease-out hover:scale-105 active:scale-95 active:shadow-inner hover:shadow-md shadow-sm flex items-center justify-center min-w-0 flex-1"
                  style={{
                    backgroundColor: current === t.id ? 'var(--accent)' : 'var(--card)',
                    color: current === t.id ? 'white' : 'var(--text)',
                    border: current === t.id ? 'none' : '1px solid var(--line)',
                    flex: '1 1 0%'
                  }}
                >
                  <span className="truncate">{t.label}</span>
                  <span 
                    className="ml-2 px-2 py-1 rounded-full text-sm font-bold flex-shrink-0"
                    style={{
                      backgroundColor: t.count > 0 ? (current === t.id ? 'rgba(255,255,255,0.2)' : 'var(--accent)') : 'transparent',
                      color: t.count > 0 ? 'white' : 'transparent',
                      minWidth: '20px',
                      textAlign: 'center'
                    }}
                  >
                    {t.count > 0 ? t.count : ''}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}
