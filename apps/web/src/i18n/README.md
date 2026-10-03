# Flicklet language foundation (#28A)

`languageManager` in `lib/language.ts` is the language authority. The existing
`flicklet.language.v2` device-local key supports `en` and `es`; unknown values
fall back to English. It updates document language on boot, change and restore.
Use `useTranslations()` or `useT()` for subscribed React labels, and `useLanguage()`
when a component only formats data. Formatting helpers read the latest language
on every call, but a React consumer still needs one of these subscriptions.

`localeConfig.ts` is the sole mapping: English formatting/metadata is `en-US`;
Spanish formatting/future metadata is generic `es`. Region and timezone are
not part of this mapping. Existing TMDB calls retain their current language and
region until the metadata implementation group. Legacy cloud `settings.lang`
has no production reader: account creation and Start Over retain their existing
compatibility writes, and UI language changes do not synchronize it.

Lookup uses selected language, English fallback, then `[key]`. Missing values
and interpolation parameters produce deduplicated development/test warnings.
Existing property-based dictionary access remains supported with stable frozen
dictionary identities. `t(key, { title: 'Alias' })` and `useT()(key, values)`
interpolate `{name}` placeholders as plain text; they do not interpret HTML.
Absent parameters remain visible as placeholders for diagnosis.

`tPlural({ one: 'oneItemKey', other: 'manyItemsKey' }, count)` uses native
`Intl.PluralRules` with separate ordinary dictionary keys. `other` is required;
missing category variants fall back to it. `{count}` is locale-formatted.
There is no new dictionary schema, dependency or bulk count-string conversion.

`lib/localeFormatters.ts` provides dates, date/time, numbers, one-decimal ratings
and integers. Dates accept a Date or epoch milliseconds. Runtime timezone is the
default; callers can explicitly supply `timeZone`. Date-only parsing/air-date
semantics remain with the episode/reminder pass. Existing surface-specific
formatters, authored UI, Help, legal text, names and brands are unchanged.
