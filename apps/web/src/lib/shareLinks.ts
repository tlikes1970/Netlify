/**
 * Process: Share Link Generation
 * Purpose: Centralized share helpers for lists (text snapshots) and shows (deep links)
 * Data Source: List items, show IDs (tmdbId/titleId)
 * Update Path: Modify this file to change share text/URL patterns
 * Dependencies: App.tsx (for show deep link handling)
 */

export type ShareListItem = {
  title: string;
  mediaType?: string;
  voteAverage?: number;
  userRating?: number;
};

/**
 * Get the app origin URL for building share links
 * Uses window.location.origin if available, falls back to production domain
 * @returns The app origin URL (e.g., "https://flicklet.app")
 */
function getAppOrigin(): string {
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }
  // Fallback to production domain (Netlify previews will have real origin)
  return "https://flicklet.netlify.app";
}

/**
 * Detect if the current device is likely mobile
 * Used to determine whether to use navigator.share (mobile) or clipboard (desktop)
 * @returns true if device appears to be mobile
 */
function isLikelyMobile(): boolean {
  if (typeof navigator === "undefined") return false;

  // Prefer userAgentData if available (more reliable)
  interface NavigatorWithUserAgentData {
    userAgentData?: {
      mobile?: boolean;
    };
  }
  const nav = navigator as Navigator & NavigatorWithUserAgentData;
  if (
    nav.userAgentData &&
    typeof nav.userAgentData.mobile === "boolean"
  ) {
    return nav.userAgentData.mobile;
  }

  // Fallback to user agent string - check for mobile patterns
  const ua = navigator.userAgent || navigator.vendor || "";
  return /android|iphone|ipad|ipod/i.test(ua);
}

/** Branded footer appended to pasted list text. */
export function getFlickletShareStamp(): string {
  const origin = getAppOrigin();
  return (
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `📱 Track your shows and movies with Flicklet!\n` +
    `🔗 ${origin}\n`
  );
}

/**
 * Format a custom list as plain text for SMS / messaging apps.
 */
export function formatListShareText(
  listName: string,
  items: ShareListItem[],
  options?: { includeRatings?: boolean }
): string {
  const includeRatings = options?.includeRatings ?? true;
  const title = listName.trim() || "My Flicklet list";

  let text = `📋 ${title}\n`;
  text += `${"─".repeat(30)}\n`;

  if (items.length === 0) {
    text += `(No shows yet)\n\n`;
  } else {
    items.forEach((item) => {
      const icon = item.mediaType === "movie" ? "🎬" : "📺";
      const ratingValue =
        includeRatings && (item.userRating ?? item.voteAverage);
      const rating =
        ratingValue != null ? ` ⭐ ${Number(ratingValue).toFixed(1)}` : "";
      text += `${icon} ${item.title}${rating}\n`;
    });
    text += "\n";
  }

  text += getFlickletShareStamp();
  return text;
}

/**
 * Build a shareable URL for a show/movie
 * @param params - Object with tmdbId and/or titleId
 * @returns Shareable URL with deep-link params
 */
export function buildShowShareUrl(params: {
  tmdbId?: number | string;
  titleId?: string | number;
}): string {
  const origin = getAppOrigin();
  const searchParams = new URLSearchParams();
  searchParams.set("view", "title");

  if (params.tmdbId) {
    searchParams.set("tmdbId", String(params.tmdbId));
  }
  if (params.titleId) {
    searchParams.set("titleId", String(params.titleId));
  }

  return `${origin}/?${searchParams.toString()}`;
}

/**
 * Share payload type for unified sharing
 */
export type SharePayload = {
  title: string;
  text: string; // Human-readable message (without URL)
  url: string; // Canonical share URL
  onSuccess?: () => void;
  onError?: (err: unknown) => void;
};

/**
 * Unified share handler that uses navigator.share on mobile only, falls back to clipboard, then alert
 * This is the single source of truth for all sharing behavior in the app.
 * 
 * Behavior:
 * - Mobile: Uses native share sheet if available, falls back to clipboard, then alert
 * - Desktop: Uses clipboard only (no system share UI), falls back to alert
 * 
 * @param payload - Share payload with title, text, url, and optional callbacks
 */
export async function shareWithFallback({
  title,
  text,
  url,
  onSuccess,
  onError,
}: SharePayload): Promise<void> {
  const canNativeShare =
    typeof navigator !== "undefined" &&
    "share" in navigator &&
    isLikelyMobile(); // Only allow on mobile

  // 1) MOBILE: try native share
  if (canNativeShare) {
    try {
      await navigator.share({ title, text, url });
      onSuccess?.();
      return; // Success, we're done
    } catch (err) {
      // User cancelled or share failed → fall through to clipboard
      if (err instanceof Error && err.name === "AbortError") {
        // User cancelled, don't show error or fallback
        return;
      }
      // Log failure and continue to clipboard fallback
      console.warn("Native share failed, falling back to clipboard:", err);
      onError?.(err);
    }
  }

  // 2) DESKTOP or fallback: copy to clipboard if available
  if (typeof navigator !== "undefined" && "clipboard" in navigator) {
    try {
      // Always include both text and URL in clipboard
      await navigator.clipboard.writeText(`${text}\n${url}`);
      onSuccess?.();
      return;
    } catch (err) {
      // Clipboard blocked / unsupported → fall through to alert
      console.warn("Clipboard write failed, falling back to alert:", err);
      onError?.(err);
    }
  }

  // 3) Last resort: show the URL in an alert
  if (typeof window !== "undefined") {
    alert(`${text}\n${url}`);
  }
  onError?.(new Error("Share and clipboard both failed"));
}

/**
 * Legacy alias for backward compatibility
 * @deprecated Use shareWithFallback instead
 */
export async function handleShare(
  options: { title: string; text: string; url: string },
  onSuccess?: () => void,
  onError?: (error: Error) => void
): Promise<void> {
  return shareWithFallback({
    title: options.title,
    text: options.text,
    url: options.url,
    onSuccess,
    onError: onError as (err: unknown) => void,
  });
}

/**
 * Share plain text (no separate URL field) — used for list snapshots in messages.
 */
export async function shareTextWithFallback(
  payload: {
    title: string;
    text: string;
    onSuccess?: () => void;
    onError?: (err: unknown) => void;
  }
): Promise<void> {
  const { title, text, onSuccess, onError } = payload;
  const canNativeShare =
    typeof navigator !== "undefined" &&
    "share" in navigator &&
    isLikelyMobile();

  if (canNativeShare) {
    try {
      await navigator.share({ title, text });
      onSuccess?.();
      return;
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      console.warn("Native text share failed, falling back to clipboard:", err);
      onError?.(err);
    }
  }

  if (typeof navigator !== "undefined" && "clipboard" in navigator) {
    try {
      await navigator.clipboard.writeText(text);
      onSuccess?.();
      return;
    } catch (err) {
      console.warn("Clipboard write failed, falling back to alert:", err);
      onError?.(err);
    }
  }

  if (typeof window !== "undefined") {
    alert(text);
  }
  onError?.(new Error("Share and clipboard both failed"));
}

/**
 * Share a list as pasteable text (shows + Flicklet stamp at the bottom).
 */
export async function shareListWithFallback(
  list: { name?: string | null },
  items: ShareListItem[],
  callbacks?: { onSuccess?: () => void; onError?: (err: unknown) => void }
): Promise<void> {
  const title = list.name?.trim() || "My Flicklet list";
  const text = formatListShareText(title, items);

  return shareTextWithFallback({
    title,
    text,
    onSuccess: callbacks?.onSuccess,
    onError: callbacks?.onError,
  });
}

/**
 * Share a show/movie with native share sheet (mobile only), clipboard fallback, or alert
 * Uses the unified shareWithFallback helper for consistent behavior.
 * 
 * @param params - Object with tmdbId and/or titleId, and optional title
 * @param callbacks - Optional success and error callbacks
 */
export async function shareShowWithFallback(
  params: {
    tmdbId?: number | string;
    titleId?: string | number;
    title?: string;
  },
  callbacks?: { onSuccess?: () => void; onError?: (err: unknown) => void }
): Promise<void> {
  const url = buildShowShareUrl({
    tmdbId: params.tmdbId,
    titleId: params.titleId,
  });
  const title = params.title || "this show";
  // Text should NOT include URL - it will be added by shareWithFallback
  const text = `Check this out on Flicklet: ${title}`;

  return shareWithFallback({
    title,
    text,
    url,
    onSuccess: callbacks?.onSuccess,
    onError: callbacks?.onError,
  });
}

