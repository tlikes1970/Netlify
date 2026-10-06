import {handleTabKeyboard} from '../lib/a11y/tabKeyboard';
import { t as coreText, useLanguage } from "@/lib/language";
import { useTranslations } from '../lib/language';
import type { AppView } from '@/lib/navigation';

export type TabsProps = {
  current: AppView;
  onChange: (next: AppView) => void;
};

const TOP_TABS: AppView[] = ['home', 'library', 'discovery'];

export default function Tabs({ current, onChange }: TabsProps) {
  useLanguage();
  const translations = useTranslations();

  const labelFor = (id: AppView) => {
    if (id === 'home') return translations.home;
    if (id === 'library') return coreText("coreLibrary");
    return translations.discovery ?? 'Discover';
  };

  return (
    <div className="w-full">
      <div className="w-full px-4 py-4">
        <nav aria-label={coreText("corePrimary")} className="w-full">
          <div
            role="tablist"
            aria-label={coreText("coreNavigation")}
            className="flex gap-4 w-full items-center max-w-3xl"
          >
            {TOP_TABS.map((id) => (
              <button
                key={id}
                type="button"
                role="tab"
              tabIndex={current === id ? 0 : -1}
              onKeyDown={handleTabKeyboard}
                aria-selected={current === id}
                aria-current={current === id ? 'page' : undefined}
                onClick={() => onChange(id)}
                className="px-6 py-3 rounded-xl text-base font-semibold transition-all duration-150 ease-out hover:scale-105 active:scale-95 shadow-sm flex-1 justify-center min-w-[5rem]"
                style={{
                  backgroundColor: current === id ? 'var(--accent)' : 'var(--card)',
                  color: current === id ? 'white' : 'var(--text)',
                  border: current === id ? 'none' : '1px solid var(--line)',
                }}
              >
                {labelFor(id)}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
