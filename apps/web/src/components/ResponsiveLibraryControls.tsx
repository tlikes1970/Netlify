import "../styles/mobileLibraryControls.css";
import { useEffect, useState, type ReactNode } from 'react';
import { useIsMobileScreen } from '../hooks/useDeviceDetection';
import { t, useLanguage } from '../lib/language';
import SortDropdown, { type SortMode } from './SortDropdown';
import { MobileControlDialog } from './MobileControlDialog';

export function ResponsiveLibraryControls({ sort, onSort, activeCount, children }: { sort: SortMode; onSort: (value: SortMode) => void; activeCount: number; children: (phone: boolean) => ReactNode }) {
  useLanguage();
  const phone = useIsMobileScreen();
  const [open, setOpen] = useState(false);
  useEffect(() => { if (!phone) setOpen(false); }, [phone]);
  return <div className={phone ? 'library-phone-toolbar grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 w-full' : 'library-filter-toolbar flex items-center gap-3 flex-wrap'}>
    <SortDropdown value={sort} onChange={onSort} compact={phone}/>
    {phone ? <>
      <button type="button" className="min-h-[44px] px-3 border rounded" aria-label={`${t('mobileFilters')}${activeCount > 0 ? ` (${activeCount})` : ''}`} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>{t('mobileFilters')}{activeCount > 0 && <span className="ml-1">({activeCount})</span>}</button>
      {open && <MobileControlDialog title={t('mobileFilters')} onClose={() => setOpen(false)}><div className="library-filter-panel flex flex-col gap-3 min-w-0">{children(true)}</div></MobileControlDialog>}
    </> : children(false)}
  </div>;
}
