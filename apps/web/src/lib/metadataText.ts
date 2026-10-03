/** TMDB display text only; compound media identity and proper names remain untouched. */
export function metadataText(...values: unknown[]): string | undefined {
  return values.find((value): value is string => typeof value === 'string' && !!value.trim())?.trim();
}

export function metadataTitle(data: { title?: unknown; name?: unknown; original_title?: unknown; original_name?: unknown; id?: unknown; media_type?: unknown; first_air_date?: unknown }, existing?: string): string {
  const tv = data.media_type === 'tv' || (!data.media_type && !!data.first_air_date);
  return metadataText(...[tv ? data.name : data.title, tv ? data.title : data.name, tv ? data.original_name : data.original_title, tv ? data.original_title : data.original_name, existing]
    .filter(value => value !== String(data.id))) || 'Untitled';
}
