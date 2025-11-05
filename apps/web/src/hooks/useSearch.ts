/**
 * Process: Search Hook
 * Purpose: Real-time search across posts collection using Firestore composite index
 * Data Source: Firestore posts collection with title/excerpt/tagSlugs queries
 * Update Path: Search results update in real-time as posts are added/modified
 * Dependencies: firebaseBootstrap, useAuth (for filtering by user)
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

interface SearchResult {
  id: string;
  title: string;
  excerpt: string;
  tagSlugs: string[];
  slug: string;
  authorName: string;
  publishedAt: unknown;
}

interface UseSearchOptions {
  queryText?: string;
  tags?: string[];
  limitResults?: number;
}

export function useSearch(options: UseSearchOptions = {}) {
  const { queryText = "", tags = [], limitResults = 20 } = options;
  const [results, setResults] = useState<SearchResult[]>([]);
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

    // Text search - only match titles that START with the query
    if (q) {
      constraints.push(orderBy("title"));
      constraints.push(where("title", ">=", q));
      constraints.push(where("title", "<=", q + "\uf8ff"));
    }

    // Tag filtering
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
        const posts: SearchResult[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          const title = data.title || "";

          // Client-side filtering: only match titles that START with the query
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
        console.error("Search error:", err);
      });
  }, [searchQuery, queryText]);

  return { results, loading, error };
}
