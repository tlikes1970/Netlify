/**
 * COMMUNITY-ONLY — scheduled for removal with Community feature.
 *
 * Prefix search across Firestore `posts` (title / tagSlugs).
 * Do not use for TMDB, Discovery, or library search.
 *
 * Consumers: SearchBar (orphan UI), future Community post search only.
 */

import { useState, useEffect, useMemo } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { db } from "../lib/firebaseBootstrap";

export interface CommunityPostSearchResult {
  id: string;
  title: string;
  excerpt: string;
  tagSlugs: string[];
  slug: string;
  authorName: string;
  publishedAt: unknown;
}

export interface UseCommunityPostSearchOptions {
  queryText?: string;
  tags?: string[];
  limitResults?: number;
}

/** @deprecated Use `useCommunityPostSearch` — community-only hook */
export type UseSearchOptions = UseCommunityPostSearchOptions;

/** @deprecated Use `CommunityPostSearchResult` */
export type SearchResult = CommunityPostSearchResult;

export function useCommunityPostSearch(
  options: UseCommunityPostSearchOptions = {}
) {
  const { queryText = "", tags = [], limitResults = 20 } = options;
  const [results, setResults] = useState<CommunityPostSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const searchQuery = useMemo(() => {
    if (!queryText.trim() && tags.length === 0) {
      return null;
    }

    const q = queryText.toLowerCase().trim();
    const base = collection(db, "posts");
    const constraints: Array<
      | ReturnType<typeof where>
      | ReturnType<typeof orderBy>
      | ReturnType<typeof limit>
    > = [];

    if (q) {
      constraints.push(orderBy("title"));
      constraints.push(where("title", ">=", q));
      constraints.push(where("title", "<=", q + "\uf8ff"));
    }

    if (tags.length > 0) {
      constraints.push(where("tagSlugs", "array-contains-any", tags));
    }

    constraints.push(limit(limitResults));

    return query(base, ...constraints);
  }, [queryText, tags, limitResults]);

  useEffect(() => {
    if (!searchQuery) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    getDocs(searchQuery)
      .then((snapshot) => {
        const posts: CommunityPostSearchResult[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          const title = data.title || "";

          const searchLower = queryText.toLowerCase().trim();
          const titleLower = title.toLowerCase();
          const matchesTitle =
            !searchLower || titleLower.startsWith(searchLower);

          if (!queryText.trim() || matchesTitle) {
            posts.push({
              id: doc.id,
              title,
              excerpt: data.excerpt || "",
              tagSlugs: data.tagSlugs || [],
              slug: data.slug || doc.id,
              authorName: data.authorName || "Anonymous",
              publishedAt: data.publishedAt,
            });
          }
        });

        setResults(posts);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
        console.error("[useCommunityPostSearch] Search error:", err);
      });
  }, [searchQuery, queryText]);

  return { results, loading, error };
}

/**
 * @deprecated Community-only. Import `useCommunityPostSearch` instead.
 */
export function useSearch(options: UseCommunityPostSearchOptions = {}) {
  return useCommunityPostSearch(options);
}
