import type { MediaItem, CardActionHandlers } from './card.types';
import { useTranslations } from '../../lib/language';
export function MetadataIndicators({item, actions}: {item: MediaItem; actions?: CardActionHandlers}) {
  const t = useTranslations();
  const indicators = [item.userNotes?.trim() ? ['📝', t.noteIndicator || 'Note'] : null, item.tags?.length ? ['🏷️', t.tagsIndicator || 'Tags'] : null].filter(Boolean) as string[][];
  if (!indicators.length) return null;
  return <div className="flex flex-wrap gap-1">{indicators.map(([icon, label]) => actions?.onNotesEdit
    ? <button key={label} type="button" className="min-h-[44px] px-1 text-xs rounded focus-visible:outline focus-visible:outline-2" aria-label={`${label}: ${t.notesAndTags}`} onClick={() => actions.onNotesEdit?.(item)}>{icon} {label}</button>
    : <span key={label} className="text-xs">{icon} {label}</span>)}</div>;
}
