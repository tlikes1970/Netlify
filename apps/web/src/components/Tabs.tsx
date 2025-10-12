import { useTranslations } from '../lib/language';

type TabId = 'watching'|'want'|'watched'|'mylists'|'discovery';
export type TabsProps = { current: 'home' | TabId; onChange: (next: 'home' | TabId) => void; };

export default function Tabs({ current, onChange }: TabsProps) {
  const translations = useTranslations();
  
  const TABS: { id: TabId; label: string }[] = [
    { id: 'watching', label: translations.currentlyWatching },
    { id: 'want',     label: translations.wantToWatch },
    { id: 'watched',  label: translations.watched },
    { id: 'mylists',  label: translations.myLists || 'My Lists' },
    { id: 'discovery',label: translations.discovery }
  ];
  return (
    <div className="w-full">
      <div className="max-w-screen-2xl mx-auto px-4 py-3">
        <nav aria-label="Primary">
          <div className="flex items-center gap-3">
            <button
              aria-current={current === 'home' ? 'page' : undefined}
              onClick={() => onChange('home')}
              className="px-3 py-1 rounded text-sm transition-colors"
              style={{
                backgroundColor: current === 'home' ? 'var(--card)' : 'var(--btn)',
                color: 'var(--text)'
              }}
            >{translations.home}</button>
            <div role="tablist" aria-label="Lists" className="flex gap-2">
              {TABS.map(t => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={current === t.id}
                  onClick={() => onChange(t.id)}
                  className="px-3 py-1 rounded text-sm transition-colors"
                  style={{
                    backgroundColor: current === t.id ? 'var(--card)' : 'var(--btn)',
                    color: 'var(--text)'
                  }}
                >{t.label}</button>
              ))}
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}
