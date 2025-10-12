type Props = {
  query: string;
  genre: number | null; // null = All, 18=Drama, 35=Comedy, 27=Horror
  onQuery: (v: string) => void;
  onGenre: (g: number | null) => void;
  onSearch: () => void;
  onClear: () => void;
};

export default function SearchBar({ query, genre, onQuery, onGenre, onSearch, onClear }: Props) {
  return (
    <div className="sticky top-0 z-40 bg-black/85 backdrop-blur border-b border-white/5">
      <div className="max-w-screen-2xl mx-auto px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={e => onQuery(e.target.value)}
            placeholder="Search movies and TV..."
            className="flex-1 min-w-[240px] md:min-w-[360px] px-4 py-2 rounded-2xl bg-neutral-950 border border-white/10 text-sm text-neutral-100 placeholder:text-neutral-500"
          />
          <select
            value={genre == null ? '' : String(genre)}
            onChange={e => onGenre(e.target.value ? Number(e.target.value) : null)}
            className="px-3 py-2 rounded-2xl bg-neutral-950 border border-white/10 text-sm text-neutral-100"
            title="Genre"
          >
            <option value="">All</option>
            <option value="18">Drama</option>
            <option value="35">Comedy</option>
            <option value="27">Horror</option>
          </select>
          <button className="btn" onClick={onSearch}>Search</button>
          <button className="btn" onClick={onClear}>Clear</button>
        </div>
      </div>
    </div>
  );
}
