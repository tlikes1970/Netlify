import { persistLocalContent } from "./restoreBarrier";
const HOLIDAYS_KEY = 'flicklet:v2:holidays';
const ASSIGN_KEY  = 'flicklet:v2:holidayAssignments'; // { [holidayId]: Array<{id,kind,title,poster}> }

export type Holiday = { id: string; name: string; emoji?: string };

const DEFAULTS: Holiday[] = [
  { id: 'halloween',   name: 'Halloween',   emoji: '🎃' },
  { id: 'christmas',   name: 'Christmas',   emoji: '🎄' },
  { id: 'thanksgiving',name: 'Thanksgiving',emoji: '🦃' },
  { id: 'new-year',    name: 'New Year',    emoji: '🎆' },
  { id: 'summer',      name: 'Summer Break',emoji: '☀️' }
];

function read<T>(k: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(k) || '') as T; } catch { return fallback; }
}
function write<T>(k: string, v: T) {
  persistLocalContent(k, JSON.stringify(v));
}

export function getHolidays(): Holiday[] {
  const custom = read<Holiday[]>(HOLIDAYS_KEY, []);
  return custom.length ? custom : DEFAULTS;
}

type AssignItem = { id: string; kind: 'movie'|'tv'; title: string; poster: string };
export function assignToHoliday(holidayId: string, item: AssignItem) {
  const map = read<Record<string, AssignItem[]>>(ASSIGN_KEY, {});
  const list = map[holidayId] || [];
  if (!list.some(x => x.id === item.id && x.kind === item.kind)) list.unshift(item);
  map[holidayId] = list;
  write(ASSIGN_KEY, map);
  window.dispatchEvent(new CustomEvent('holidays:change', { detail: { holidayId, count: list.length } }));
  return { holidayId, count: list.length };
}

export function getAssignments() {
  return read<Record<string, AssignItem[]>>(ASSIGN_KEY, {});
}

export function unassignFromHoliday(holidayId: string, itemId: string) {
  const map = read<Record<string, AssignItem[]>>(ASSIGN_KEY, {});
  const list = (map[holidayId] || []).filter(x => x.id !== itemId);
  map[holidayId] = list;
  write(ASSIGN_KEY, map);
  window.dispatchEvent(new CustomEvent('holidays:change', { detail: { holidayId, count: list.length } }));
  return { holidayId, count: list.length };
}
