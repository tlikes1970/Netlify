/**
 * Process: Search Bar
 * Purpose: Debounced search input with live results and highlight matching text
 * Data Source: useSearch hook queries Firestore posts collection
 * Update Path: User types → debounced query → results update
 * Dependencies: useSearch hook, react-router for navigation
 */

import { useState, useEffect, useRef } from "react";
import { useSearch } from "../hooks/useSearch";

interface SearchBarProps {
  placeholder?: string;
  debounceMs?: number;
  onResultClick?: (slug: string) => void;
}

export function SearchBar({
  placeholder = "Search posts...",
  debounceMs = 200,
  onResultClick,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const { results, loading } = useSearch({
    queryText: debouncedQuery,
    limitResults: 10,
  });

  // Debounce the search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lock body scroll while dropdown is open
  useEffect(() => {
    if (showResults) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showResults]);

  const highlightText = (text: string, search: string) => {
    if (!search.trim()) return text;

    const parts = text.split(
      new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
    );
    return parts.map((part, i) =>
      part.toLowerCase() === search.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-800">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const handleResultClick = (slug: string) => {
    setShowResults(false);
    setQuery("");
    if (onResultClick) {
      onResultClick(slug);
    } else {
      // Use custom navigation
      const newPath = `/posts/${slug}`;
      window.history.pushState({}, "", newPath);
      window.dispatchEvent(new PopStateEvent("popstate"));
      // Also dispatch custom event for app to listen
      window.dispatchEvent(new CustomEvent("pushstate"));
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowResults(true);
        }}
        onFocus={() => setShowResults(true)}
        placeholder={placeholder}
        className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
        style={{
          backgroundColor: "var(--layer)",
          color: "var(--text)",
          borderColor: "var(--line)",
        }}
      />

      {showResults && debouncedQuery && (
        <div
          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border rounded-lg shadow-lg max-h-96 overflow-y-auto"
          style={{
            backgroundColor: "var(--bg)",
            borderColor: "var(--line)",
          }}
        >
          {loading && (
            <div
              className="p-4 text-center text-sm"
              style={{ color: "var(--muted)" }}
            >
              Searching...
            </div>
          )}

          {!loading && results.length === 0 && (
            <div
              className="p-4 text-center text-sm"
              style={{ color: "var(--muted)" }}
            >
              No results found
            </div>
          )}

          {!loading && results.length > 0 && (
            <ul className="py-1" role="list">
              {results.map((result) => (
                <li
                  key={result.id}
                  onClick={() => handleResultClick(result.slug)}
                  className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  role="listitem"
                  style={{
                    backgroundColor: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--layer)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <div
                    className="font-medium text-sm mb-1"
                    style={{ color: "var(--text)" }}
                  >
                    {highlightText(result.title, debouncedQuery)}
                  </div>
                  <div
                    className="text-xs line-clamp-2"
                    style={{ color: "var(--muted)" }}
                  >
                    {highlightText(result.excerpt, debouncedQuery)}
                  </div>
                  {result.tagSlugs.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {result.tagSlugs.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-xs rounded"
                          style={{
                            backgroundColor: "var(--accent-primary)",
                            color: "var(--text)",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
