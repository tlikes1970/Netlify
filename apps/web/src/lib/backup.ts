import { normalizeWatchStatus } from "./watchStatus";
import { RESTORE_JOURNAL_KEY, type RestoreJournal } from "./restoreRecovery";
import type { LibraryEntry } from "./storage";

export const BACKUP_FORMAT = "flicklet-backup";
export const BACKUP_SCHEMA = 1;
type ObjectValue = Record<string, unknown>;
export type Backup = {
  type: typeof BACKUP_FORMAT;
  schemaVersion: number;
  createdAt: string;
  appVersion: string;
  library: LibraryEntry[];
  customLists: ObjectValue[];
  settings: ObjectValue;
  preferredName: string | null;
  local: ObjectValue;
};
const legacySnapshots = new WeakSet<object>();
export const isLegacyBackup = (backup: Backup): boolean =>
  legacySnapshots.has(backup);
const fail = (message: string): never => {
  throw new Error(`Invalid Flicklet backup: ${message}`);
};
export function object(value: unknown, label: string): ObjectValue {
  if (!value || typeof value !== "object" || Array.isArray(value))
    fail(`${label} must be an object.`);
  return value as ObjectValue;
}
function array(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) fail(`${label} must be an array.`);
  return value as unknown[];
}
function text(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length > 100000)
    fail(`${label} must be text.`);
  return value as string;
}
function number(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0)
    fail(`${label} must be a nonnegative number.`);
  return value as number;
}
function boolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") fail(`${label} must be true or false.`);
  return value as boolean;
}
function strings(value: unknown, label: string): string[] {
  return array(value, label).map((v) => text(v, label));
}
function identifier(value: unknown): string {
  const id = text(value, "identifier");
  if (!/^[a-zA-Z0-9_-]{1,150}$/.test(id)) fail("unsafe identifier.");
  return id;
}
function safeTree(value: unknown, depth = 0): void {
  if (depth > 20) fail("data is nested too deeply.");
  if (Array.isArray(value)) {
    if (value.length > 20000) fail("array is too large.");
    value.forEach((v) => safeTree(v, depth + 1));
  } else if (value && typeof value === "object")
    for (const [key, v] of Object.entries(value)) {
      if (["__proto__", "constructor", "prototype"].includes(key))
        fail("unsafe object key.");
      safeTree(v, depth + 1);
    }
  else if (typeof value === "number" && !Number.isFinite(value))
    fail("non-finite number.");
  else if (typeof value === "string" && value.length > 100000)
    fail("text is too long.");
}
export function portableSettings(value: unknown): ObjectValue {
  const source = object(value, "settings");
  const result: ObjectValue = {};
  if ("personality" in source) {
    if (
      ![
        "Valley Girl",
        "Detective Noir",
        "Sports Announcer",
        "Zen",
        "Surfer",
        "Medieval Bard",
        "Grumpy Old Man",
        "Fantasy Wizard",
      ].includes(text(source.personality, "personality"))
    )
      fail("unknown personality.");
    result.personality = source.personality;
  }
  if ("personalityLevel" in source) {
    if (
      ![1, 2, 3].includes(number(source.personalityLevel, "personality level"))
    )
      fail("unknown personality level.");
    result.personalityLevel = source.personalityLevel;
  }
  if ("notifications" in source) {
    const n = object(source.notifications, "notifications");
    const clean: ObjectValue = {};
    for (const key of ["upcomingEpisodes", "weeklyDiscover", "monthlyStats"])
      if (key in n) clean[key] = boolean(n[key], key);
    if (n.alertConfig !== undefined) {
      const c = object(n.alertConfig, "alert configuration");
      if (!["watching", "wishlist"].includes(text(c.targetList, "target list")))
        fail("invalid notification target.");
      clean.alertConfig = {
        leadTimeHours: number(c.leadTimeHours, "lead time"),
        targetList: c.targetList,
      };
    }
    result.notifications = clean;
  }
  if ("layout" in source) {
    const n = object(source.layout, "layout");
    const clean: ObjectValue = {};
    for (const key of ["episodeTracking"])
      if (key in n) clean[key] = boolean(n[key], key);
    for (const key of ["homePageLists", "forYouGenres"])
      if (key in n) clean[key] = strings(n[key], key);
    if ("theme" in n) {
      if (!["light", "dark"].includes(text(n.theme, "theme")))
        fail("invalid theme.");
      clean.theme = n.theme;
    }
    if ("discoveryLimit" in n) {
      if (
        ![25, 50, 75, 100].includes(number(n.discoveryLimit, "discovery limit"))
      )
        fail("invalid discovery limit.");
      clean.discoveryLimit = n.discoveryLimit;
    }
    if ("themePack" in n) clean.themePack = text(n.themePack, "theme pack");
    result.layout = clean;
  }
  return result;
}
function libraryItem(value: unknown): LibraryEntry {
  const s = object(value, "library item");
  const id = String(s.id);
  if (!/^\d+$/.test(id) || Number(id) <= 0 || !Number.isSafeInteger(Number(id)))
    fail("invalid title ID.");
  if (!["movie", "tv"].includes(text(s.mediaType, "media type")))
    fail("unsupported media type.");
  const rawList = text(s.list, "watch status");
  const list = normalizeWatchStatus(rawList) ?? rawList;
  if (!["watching", "wishlist", "watched", "not"].includes(list)) {
    if (!list.startsWith("custom:")) fail("unsupported watch status.");
    identifier(list.slice(7));
  }
  const title = text(s.title, "title");
  if (!title.trim()) fail("title is missing.");
  const clean: ObjectValue = {
    id: s.id,
    mediaType: s.mediaType,
    title,
    list,
    addedAt: number(s.addedAt, "date added"),
  };
  for (const key of [
    "year",
    "releaseDate",
    "posterUrl",
    "synopsis",
    "userNotes",
  ])
    if (s[key] !== undefined && s[key] !== null) clean[key] = text(s[key], key);
  for (const key of ["nextAirDate", "lastAirDate"])
    if (s[key] !== undefined)
      clean[key] = s[key] === null ? null : text(s[key], key);
  if (s.showStatus !== undefined && s.showStatus !== null) {
    if (
      ![
        "Ended",
        "Returning Series",
        "In Production",
        "Canceled",
        "Planned",
      ].includes(text(s.showStatus, "show status"))
    )
      fail("invalid show status.");
    clean.showStatus = s.showStatus;
  }
  for (const key of [
    "voteAverage",
    "voteCount",
    "userRating",
    "runtimeMins",
    "ratingUpdatedAt",
  ])
    if (s[key] !== undefined && s[key] !== null)
      clean[key] = number(s[key], key);
  if (Number(clean.userRating) > 5 || Number(clean.voteAverage) > 10)
    fail("invalid rating.");
  for (const key of [
    "tags",
    "networks",
    "productionCompanies",
    "customListIds",
  ])
    if (s[key] !== undefined && s[key] !== null)
      clean[key] = strings(s[key], key);
  if (s.isFavorite !== undefined)
    clean.isFavorite = boolean(s.isFavorite, "favorite");
  return clean as unknown as LibraryEntry;
}
function customList(value: unknown): ObjectValue {
  const s = object(value, "custom list");
  const result: ObjectValue = {
    id: identifier(s.id),
    name: text(s.name, "list name"),
    createdAt: number(s.createdAt, "list date"),
    itemCount: 0,
  };
  if (!(result.name as string).trim()) fail("empty list name.");
  for (const key of ["description", "color"])
    if (s[key] !== undefined) result[key] = text(s[key], key);
  if (s.isDefault !== undefined)
    result.isDefault = boolean(s.isDefault, "default list");
  return result;
}
export function isPortableLocalKey(key: string): boolean {
  return (
    [
      "flicklet.language.v2",
      "notification-settings",
      "flicklet.series-reminders.v1",
      "flicklet:v2:holidays",
      "flicklet:v2:holidayAssignments",
      "flickword:stats",
      "trivia:stats",
      "forYouRows",
    ].includes(key) ||
    /^episode-progress-\d+$/.test(key) ||
    /^flk\.tab\.[a-zA-Z0-9_:-]+\.(sort|filter\.type|filter\.providers|order\.custom)$/.test(
      key,
    ) ||
    /^(flickword|trivia):completed-games:\d{4}-\d{2}-\d{2}$/.test(key)
  );
}
function validateLocal(key: string, value: unknown): void {
  if (!isPortableLocalKey(key)) fail(`unsupported data category ${key}.`);
  if (key === "flicklet.language.v2") {
    if (!["en", "es"].includes(text(value, "language")))
      fail("unsupported language.");
  } else if (key.startsWith("episode-progress-")) {
    const p = object(value, "episode progress");
    const episodes = object(p.episodes, "episodes");
    for (const [id, watched] of Object.entries(episodes)) {
      if (!/^S\d+E\d+$/.test(id)) fail("invalid episode.");
      boolean(watched, "watched episode");
    }
    if (p.totalEpisodes !== undefined) number(p.totalEpisodes, "episode count");
    if (p.seasons !== undefined)
      array(p.seasons, "seasons").forEach((v) => {
        const s = object(v, "season");
        number(s.seasonNumber, "season number");
        array(s.episodeNumbers, "episode numbers").forEach((n) =>
          number(n, "episode number"),
        );
      });
    if (
      Object.keys(p).some(
        (k) => !["episodes", "totalEpisodes", "seasons"].includes(k),
      )
    )
      fail("unknown progress field.");
  } else if (key.startsWith("flk.tab.")) {
    if (
      key.endsWith(".sort") &&
      ![
        "date-newest",
        "date-oldest",
        "alphabetical-az",
        "alphabetical-za",
        "streaming-service",
        "custom",
      ].includes(text(value, "sort"))
    )
      fail("invalid sort.");
    else if (
      key.endsWith(".filter.type") &&
      !["all", "movie", "tv"].includes(text(value, "type filter"))
    )
      fail("invalid type filter.");
    else if (key.endsWith(".providers") || key.endsWith(".custom"))
      strings(value, "tab values");
  } else if (key === "notification-settings") {
    const n = object(value, "notification settings");
    boolean(n.globalEnabled, "global notifications");
    if (
      !["24-hours-before", "7-days-before"].includes(
        text(n.freeTierTiming, "notification timing"),
      )
    )
      fail("invalid timing.");
    if (
      number(n.proTierTiming, "precise timing") < 1 ||
      Number(n.proTierTiming) > 24
    )
      fail("invalid timing.");
    const m = object(n.methods, "notification methods");
    if (Object.keys(m).some((k) => !["inApp", "push", "email"].includes(k)))
      fail("unknown notification method");
    for (const k of ["inApp", "push", "email"]) boolean(m[k], k);
    for (const v of Object.values(
      object(n.showOverrides, "notification overrides"),
    )) {
      const o = object(v, "override");
      if (
        Object.keys(o).some(
          (k) => !["enabled", "timing", "methods"].includes(k),
        )
      )
        fail("unknown notification override");
      boolean(o.enabled, "override enabled");
      if (o.timing !== undefined) number(o.timing, "override timing");
      if (o.methods !== undefined)
        for (const v of Object.values(object(o.methods, "override methods")))
          boolean(v, "method");
    }
    if (
      Object.keys(n).some(
        (k) =>
          ![
            "globalEnabled",
            "freeTierTiming",
            "proTierTiming",
            "methods",
            "showOverrides",
          ].includes(k),
      )
    )
      fail("unknown notification field.");
  } else if (key === "flicklet.series-reminders.v1") {
    for (const [id, v] of Object.entries(object(value, "reminders"))) {
      if (!/^\d+$/.test(id)) fail("invalid reminder ID.");
      const r = object(v, "reminder");
      number(r.showId, "reminder title ID");
      text(r.title, "reminder title");
      boolean(r.enabled, "reminder enabled");
      number(r.updatedAt, "reminder date");
      if (
        Object.keys(r).some(
          (k) => !["showId", "title", "enabled", "updatedAt"].includes(k),
        )
      )
        fail("unknown reminder field.");
    }
  } else if (key.endsWith(":stats")) {
    const s = object(value, "game statistics");
    for (const [k, v] of Object.entries(s)) {
      if (
        ![
          "games",
          "wins",
          "losses",
          "streak",
          "maxStreak",
          "correct",
          "total",
          "lastUpdated",
          "guessDistribution",
          "averageScore",
          "bestScore",
          "totalScore",
        ].includes(k)
      )
        fail(`unknown statistics field ${k}.`);
      if (k === "guessDistribution") {
        for (const n of Object.values(object(v, k))) number(n, k);
      } else number(v, k);
    }
  } else if (key === "forYouRows") {
    const p = object(value, "genre rows");
    if (Object.keys(p).some((k) => !["version", "rows"].includes(k)))
      fail("unknown genre payload field.");
    if (p.version !== 2) fail("unsupported genre rows.");
    const rows = array(p.rows, "genre rows");
    if (rows.length < 1 || rows.length > 3) fail("invalid genre row count");
    rows.forEach((v) => {
      const r = object(v, "genre row");
      for (const k of ["id", "mainGenre", "subGenre", "title"]) text(r[k], k);
      if (
        Object.keys(r).some(
          (k) => !["id", "mainGenre", "subGenre", "title"].includes(k),
        )
      )
        fail("unknown genre field.");
    });
  } else if (key.includes(":completed-games:")) {
    array(value, "completed games").forEach((v) => {
      const g = object(v, "completed game");
      text(g.date, "game date");
      number(g.gameNumber, "game number");
      number(g.completedAt, "completion time");
      const fields = key.startsWith("flickword:")
        ? [
            "date",
            "gameNumber",
            "target",
            "guesses",
            "won",
            "lastResults",
            "completedAt",
          ]
        : [
            "date",
            "gameNumber",
            "score",
            "total",
            "percentage",
            "questions",
            "completedAt",
          ];
      if (Object.keys(g).some((k) => !fields.includes(k)))
        fail("unknown completed game field.");
      if (key.startsWith("flickword:")) {
        text(g.target, "target");
        strings(g.guesses, "guesses");
        boolean(g.won, "won");
        array(g.lastResults, "results").forEach((r) =>
          strings(r, "result").forEach((s) => {
            if (!["correct", "present", "absent"].includes(s))
              fail("invalid game result");
          }),
        );
      } else {
        for (const k of ["score", "total", "percentage"]) number(g[k], k);
        array(g.questions, "questions").forEach((v) => {
          const q = object(v, "question");
          text(q.question, "question");
          number(q.selectedAnswer, "answer");
          number(q.correctAnswer, "answer");
          boolean(q.isCorrect, "correct");
          if (
            Object.keys(q).some(
              (k) =>
                ![
                  "question",
                  "selectedAnswer",
                  "correctAnswer",
                  "isCorrect",
                ].includes(k),
            )
          )
            fail("unknown question field");
        });
      }
    });
  } else if (key === "flicklet:v2:holidays") {
    array(value, "holidays").forEach((v) => {
      const h = object(v, "holiday");
      identifier(h.id);
      text(h.name, "holiday name");
      if (h.emoji !== undefined) text(h.emoji, "emoji");
      if (Object.keys(h).some((k) => !["id", "name", "emoji"].includes(k)))
        fail("unknown holiday field");
    });
  } else {
    for (const [id, v] of Object.entries(
      object(value, "holiday assignments"),
    )) {
      identifier(id);
      array(v, "holiday titles").forEach((v) => {
        const t = object(v, "holiday title");
        text(t.id, "title ID");
        if (!["movie", "tv"].includes(text(t.kind, "kind")))
          fail("invalid holiday title");
        text(t.title, "title");
        text(t.poster, "poster");
        if (
          Object.keys(t).some(
            (k) => !["id", "kind", "title", "poster"].includes(k),
          )
        )
          fail("unknown holiday title field");
      });
    }
  }
}
function legacyBackup(source: ObjectValue): Backup {
  if (
    source.version !== "2.0" ||
    typeof source.timestamp !== "string" ||
    !Number.isFinite(Date.parse(source.timestamp))
  )
    fail("unrecognized legacy format.");
  const w = object(source.watchlists, "legacy watchlists");
  const library = new Map<string, LibraryEntry>();
  const add = (v: unknown, mediaType: unknown, list: string) => {
    const s = object(v, "legacy title");
    const n = libraryItem({
      ...s,
      id: s.id,
      mediaType,
      title: s.title ?? s.name,
      list,
      addedAt: s.addedAt ?? Date.parse(source.timestamp as string),
      posterUrl: s.posterUrl ?? s.poster_path,
      voteAverage: s.voteAverage ?? s.vote_average,
      userRating: s.userRating ?? s.user_rating,
      userNotes: s.userNotes ?? s.notes,
      tags: s.tags ?? [],
      synopsis: s.synopsis ?? s.overview,
    });
    const key = `${n.mediaType}:${n.id}`;
    const existing = library.get(key);
    if (list.startsWith("custom:")) {
      const id = list.slice(7);
      if (existing) {
        existing.customListIds = [
          ...new Set([...(existing.customListIds ?? []), id]),
        ];
        return;
      }
    } else if (existing) fail("duplicate legacy watch status.");
    library.set(key, n);
  };
  for (const [group, type] of [
    ["movies", "movie"],
    ["tv", "tv"],
  ]) {
    const g = object(w[group], `legacy ${group}`);
    for (const status of ["watching", "wishlist", "watched"])
      array(g[status] ?? (status === "wishlist" ? g.want : undefined), `legacy ${status}`).forEach((v) => add(v, type, status));
    if (g.not !== undefined)
      array(g.not, "legacy not interested").forEach((v) => add(v, type, "not"));
  }
  const customLists = array(w.customLists, "legacy custom lists");
  for (const [id, items] of Object.entries(
    object(w.customItems ?? {}, "legacy custom items"),
  )) {
    identifier(id);
    array(items, "legacy list items").forEach((v) =>
      add(
        v,
        object(v, "legacy custom title").mediaType ?? "movie",
        `custom:${id}`,
      ),
    );
  }
  const s = object(source.settings ?? {}, "legacy settings");
  let preferredName: string | null = null;
  if (typeof s.preferredName === "string") preferredName = s.preferredName;
  else if (s.usernamePrompted === true && typeof s.username === "string")
    preferredName = s.username;
  else if (
    typeof s.displayName === "string" &&
    !/^(guest|user|flicklet user)$/i.test(s.displayName.trim())
  )
    preferredName = s.displayName;
  return {
    type: BACKUP_FORMAT,
    schemaVersion: BACKUP_SCHEMA,
    createdAt: source.timestamp as string,
    appVersion: "legacy 2.0",
    library: [...library.values()],
    customLists: customLists.map((v) => ({
      ...object(v, "legacy list"),
      createdAt:
        object(v, "legacy list").createdAt ??
        Date.parse(source.timestamp as string),
    })),
    settings: portableSettings(s),
    preferredName,
    local: {},
  };
}
/** Validates and constructs a fresh allowlisted snapshot before any write. */
export function validateBackup(value: unknown): Backup {
  safeTree(value);
  let s = object(value, "backup");
  const legacy =
    legacySnapshots.has(s) ||
    (s.type === undefined && s.watchlists !== undefined);
  if (s.type === undefined && s.watchlists !== undefined)
    s = legacyBackup(s) as unknown as ObjectValue;
  if (s.type !== BACKUP_FORMAT) fail("file is not a Flicklet backup.");
  if (s.schemaVersion !== BACKUP_SCHEMA)
    fail("unsupported backup schema version.");
  const createdAt = text(s.createdAt, "creation date");
  if (!Number.isFinite(Date.parse(createdAt))) fail("invalid creation date.");
  const library = array(s.library, "library").map(libraryItem);
  const customLists = array(s.customLists, "custom lists").map(customList);
  const ids = new Set(customLists.map((l) => l.id));
  if (ids.size !== customLists.length) fail("duplicate custom list IDs.");
  const seen = new Set<string>();
  for (const item of library) {
    const key = `${item.mediaType}:${item.id}`;
    if (seen.has(key)) fail("duplicate library title.");
    seen.add(key);
    const memberships = [
      ...(item.customListIds ?? []),
      ...(item.list.startsWith("custom:") ? [item.list.slice(7)] : []),
    ];
    for (const id of new Set(memberships)) {
      if (!ids.has(id)) fail("custom-list membership has no matching list.");
      const list = customLists.find((l) => l.id === id)!;
      list.itemCount = Number(list.itemCount) + 1;
    }
  }
  const local = object(s.local, "additional user data");
  for (const [k, v] of Object.entries(local)) validateLocal(k, v);
  const preferredName =
    s.preferredName === null
      ? null
      : text(s.preferredName, "preferred name").trim();
  if (preferredName !== null && preferredName.length > 100)
    fail("preferred name exceeds 100 characters.");
  if (!legacy) {
    for (const field of [
      "personality",
      "personalityLevel",
      "notifications",
      "layout",
    ])
      if (!(field in object(s.settings, "settings")))
        fail(`missing current preference ${field}.`);
    const n = object(
      object(s.settings, "settings").notifications,
      "notifications",
    );
    for (const k of ["upcomingEpisodes", "weeklyDiscover", "monthlyStats"])
      if (!(k in n)) fail(`missing notification preference ${k}.`);
    const l = object(object(s.settings, "settings").layout, "layout");
    for (const k of [
      "theme",
      "homePageLists",
      "forYouGenres",
      "episodeTracking",
      "discoveryLimit",
    ])
      if (!(k in l)) fail(`missing layout preference ${k}.`);
  }
  const result = structuredClone({
    type: BACKUP_FORMAT,
    schemaVersion: BACKUP_SCHEMA,
    createdAt,
    appVersion: text(s.appVersion, "app version"),
    library,
    customLists,
    settings: portableSettings(s.settings),
    preferredName,
    local,
  }) as Backup;
  if (legacy) legacySnapshots.add(result);
  return result;
}
export function parseBackup(raw: string): Backup {
  if (new Blob([raw]).size > 10 * 1024 * 1024) fail("file exceeds 10 MB.");
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    fail("file is not valid JSON.");
  }
  return validateBackup(value);
}
export function collectLocal(
  storage: Storage,
  uid: string | null,
): ObjectValue {
  const result: ObjectValue = {};
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i)!;
    if (!isPortableLocalKey(key) || key === "forYouRows") continue;
    const raw = storage.getItem(key)!;
    result[key] =
      key === "flicklet.language.v2" ||
      key.endsWith(".sort") ||
      key.endsWith(".filter.type")
        ? raw
        : JSON.parse(raw);
    if (
      key.startsWith("episode-progress-") &&
      !Object.prototype.hasOwnProperty.call(
        object(result[key], "progress"),
        "episodes",
      )
    )
      result[key] = { episodes: result[key] };
  }
  const legacyStats = storage.getItem("flicklet-data");
  if (legacyStats) {
    const stats = object(JSON.parse(legacyStats), "legacy game statistics");
    for (const game of ["flickword", "trivia"])
      if (result[`${game}:stats`] === undefined && stats[game] !== undefined)
        result[`${game}:stats`] = stats[game];
  }
  const rows = storage.getItem(`flicklet:forYouRows:v2:${uid ?? "guest"}`);
  if (rows) result.forYouRows = JSON.parse(rows);
  return result;
}
export function restoreWrites(
  backup: Backup,
  storage: Storage,
  uid: string | null,
): Map<string, string | null> {
  const writes = new Map<string, string | null>();
  const current = object(
    JSON.parse(storage.getItem("flicklet.settings.v2") ?? "{}"),
    "current settings",
  );
  if (!isLegacyBackup(backup)) {
    for (const [group, keys] of [
      [
        "notifications",
        ["upcomingEpisodes", "weeklyDiscover", "monthlyStats", "alertConfig"],
      ],
      [
        "layout",
        [
          "theme",
          "homePageLists",
          "forYouGenres",
          "episodeTracking",
          "discoveryLimit",
          "themePack",
        ],
      ],
    ] as const) {
      const retained = { ...object(current[group] ?? {}, group) };
      for (const key of keys) delete retained[key];
      current[group] = retained;
    }
  }
  const next = {
    ...current,
    ...backup.settings,
    notifications: {
      ...object(current.notifications ?? {}, "current notifications"),
      ...object(backup.settings.notifications ?? {}, "backup notifications"),
    },
    layout: {
      ...object(current.layout ?? {}, "current layout"),
      ...object(backup.settings.layout ?? {}, "backup layout"),
    },
  };
  if (backup.preferredName !== null)
    Object.assign(next, { preferredName: backup.preferredName });
  writes.set("flicklet.settings.v2", JSON.stringify(next));
  writes.set("flicklet:v2:saved", null); // Prevent the old loader from resurrecting an intentionally empty restore.
  writes.set(
    "flicklet.library.v2",
    JSON.stringify(
      Object.fromEntries(
        backup.library.map((i) => [`${i.mediaType}:${i.id}`, i]),
      ),
    ),
  );
  const lists = object(
    JSON.parse(storage.getItem("flicklet.customLists.v2") ?? "{}"),
    "current lists",
  );
  writes.set(
    "flicklet.customLists.v2",
    JSON.stringify({
      ...lists,
      customLists: backup.customLists,
      selectedListId: null,
    }),
  );
  // Old backups did not capture these categories: preserve rather than erase them.
  if (!isLegacyBackup(backup))
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i)!;
      if (isPortableLocalKey(k)) writes.set(k, null);
    }
  if (!isLegacyBackup(backup))
    writes.set(`flicklet:forYouRows:v2:${uid ?? "guest"}`, null);
  for (const [k, v] of Object.entries(backup.local)) {
    const key =
      k === "forYouRows" ? `flicklet:forYouRows:v2:${uid ?? "guest"}` : k;
    writes.set(
      key,
      k === "flicklet.language.v2" ||
        k.endsWith(".sort") ||
        k.endsWith(".filter.type")
        ? String(v)
        : JSON.stringify(v),
    );
  }
  if (!isLegacyBackup(backup)) {
    const raw = storage.getItem("flicklet-data");
    const legacyStats = raw
      ? object(JSON.parse(raw), "legacy game statistics")
      : {};
    writes.set(
      "flicklet-data",
      JSON.stringify({
        ...legacyStats,
        flickword: backup.local["flickword:stats"] ?? {},
        trivia: backup.local["trivia:stats"] ?? {},
      }),
    );
  }
  return writes;
}
/** Stage all local writes without publishing runtime state; rollback on any failure. */
export async function applyRestore(
  writes: Map<string, string | null>,
  storage: Storage,
  commit: () => Promise<void>,
  sameAccount: () => boolean,
  journal?: Pick<RestoreJournal, "uid" | "revision">,
): Promise<void> {
  if (!sameAccount())
    throw new Error("The signed-in account changed. Please try again.");
  const before = new Map(
    [...writes.keys()].map((k) => [k, storage.getItem(k)]),
  );
  const write = (k: string, v: string | null) => {
    if (v === null) storage.removeItem(k);
    else storage.setItem(k, v);
  };
  if (journal)
    storage.setItem(
      RESTORE_JOURNAL_KEY,
      JSON.stringify({ ...journal, before: [...before], after: [...writes] }),
    );
  try {
    for (const [k, v] of writes) write(k, v);
    if (!sameAccount()) throw new Error("The signed-in account changed.");
    await commit();
    if (journal) storage.removeItem(RESTORE_JOURNAL_KEY);
  } catch (error) {
    if (sameAccount()) {
      try {
        for (const k of writes.keys()) storage.removeItem(k);
        for (const [k, v] of before) write(k, v);
        if (journal) storage.removeItem(RESTORE_JOURNAL_KEY);
      } catch {
        throw new Error(
          "Restore failed and local recovery was blocked by device storage. Keep this window open and retry after freeing storage.",
        );
      }
    } else if (journal) storage.removeItem(RESTORE_JOURNAL_KEY);
    throw error;
  }
}
