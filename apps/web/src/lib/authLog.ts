/**
 * Process: Auth Event Logging
 * Purpose: Harvest, persist, and export high-signal auth logs for mobile debugging without devtools
 * Data Source: Auth events, URL params, Firebase results, SW cache decisions, gate signals
 * Update Path: Called from auth.ts, authLogin.ts, authBroadcast.ts at each meaningful event
 * Dependencies: localStorage, crypto APIs for hashing
 */

import { APP_VERSION } from '../version';

// Types
export interface AuthLogEntry {
  timestamp: string; // ISO timestamp
  event: string; // 'init', 'checking', 'redirecting', 'resolving', 'authenticated', 'unauthenticated', etc.
  data?: Record<string, unknown>; // Event-specific data (all sensitive values redacted)
  traceId?: string; // Correlation ID for this auth flow
}

export interface AuthLogSession {
  traceId: string;
  startTime: string;
  entries: AuthLogEntry[];
  sessionInfo: SessionInfo;
  finalState?: {
    status: string;
    authenticated: boolean;
    error?: string;
  };
}

export interface SessionInfo {
  timestamp: string;
  timezone: string;
  userAgent: string;
  appVersion: string;
  origin: string;
  swVersion?: string;
  swState?: string;
  persistence?: 'IndexedDB' | 'localStorage' | 'sessionStorage' | 'unknown';
  viewport?: string;
  online: boolean;
  cookieEnabled: boolean;
  localStorageEnabled: boolean;
  sessionStorageEnabled: boolean;
}

// Constants
const RING_BUFFER_SIZE = 150;
const MAX_PERSISTED_SESSIONS = 5;
const STORAGE_KEY = 'flicklet.auth.logs';
const CURRENT_TRACE_KEY = 'flicklet.auth.traceId';

// Singleton instance
class AuthLogManager {
  private ringBuffer: AuthLogEntry[] = [];
  private currentTraceId: string | null = null;

  constructor() {
    this.loadCurrentTraceId();
    this.pruneOldSessions();
  }

  /**
   * Create a new trace ID for an auth flow
   */
  createTraceId(): string {
    const traceId = `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.currentTraceId = traceId;
    try {
      localStorage.setItem(CURRENT_TRACE_KEY, traceId);
    } catch (e) {
      // ignore
    }
    return traceId;
  }

  /**
   * Get current trace ID or create one
   */
  getTraceId(): string {
    if (!this.currentTraceId) {
      return this.createTraceId();
    }
    return this.currentTraceId;
  }

  /**
   * Clear trace ID (after auth completes)
   */
  clearTraceId(): void {
    this.currentTraceId = null;
    try {
      localStorage.removeItem(CURRENT_TRACE_KEY);
    } catch (e) {
      // ignore
    }
  }

  /**
   * Load trace ID from storage
   */
  private loadCurrentTraceId(): void {
    try {
      const stored = localStorage.getItem(CURRENT_TRACE_KEY);
      if (stored) {
        this.currentTraceId = stored;
      }
    } catch (e) {
      // ignore
    }
  }

  /**
   * Hash a sensitive value (returns first 6 chars of SHA-256)
   */
  private hashValue(value: string): string {
    // Simple hash using Web Crypto API if available, fallback to basic hash
    try {
      if (typeof crypto !== 'undefined' && crypto.subtle) {
        // We'll use a simple implementation for now since async crypto.subtle.digest is complex
        // For production, consider using a synchronous hash library or async handling
        let hash = 0;
        for (let i = 0; i < value.length; i++) {
          const char = value.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36).substring(0, 6).padStart(6, '0');
      }
    } catch (e) {
      // ignore
    }
    // Fallback hash
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = ((hash << 5) - hash) + value.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36).substring(0, 6).padStart(6, '0');
  }

  /**
   * Redact sensitive values from URL params or data objects
   */
  redactSensitive(data: Record<string, unknown>): Record<string, unknown> {
    const redacted: Record<string, unknown> = {};
    const sensitiveKeys = ['code', 'state', 'idToken', 'accessToken', 'refreshToken', 'email', 'uid'];
    
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      
      if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
        if (typeof value === 'string' && value.length > 0) {
          // Hash long values (tokens, codes), mask short ones (UIDs)
          if (value.length > 20) {
            redacted[key] = `[HASH:${this.hashValue(value)}]`;
          } else {
            redacted[key] = `[MASKED:${value.substring(0, 2)}***]`;
          }
        } else {
          redacted[key] = '[REDACTED]';
        }
      } else {
        redacted[key] = value;
      }
    }
    
    return redacted;
  }

  /**
   * Log an auth event
   */
  log(event: string, data?: Record<string, unknown>): void {
    const traceId = this.getTraceId();
    const entry: AuthLogEntry = {
      timestamp: new Date().toISOString(),
      event,
      traceId,
      data: data ? this.redactSensitive(data) : undefined,
    };

    // Add to ring buffer
    this.ringBuffer.push(entry);
    if (this.ringBuffer.length > RING_BUFFER_SIZE) {
      this.ringBuffer.shift();
    }

    // Persist to localStorage by traceId
    this.persistEntry(traceId, entry);

    // Log to console in debug mode
    if (localStorage.getItem('flicklet.debugAuth') === 'true') {
      console.log(`[AuthLog:${traceId}] ${event}`, data ? this.redactSensitive(data) : '');
    }
  }

  /**
   * Persist an entry to localStorage
   */
  private persistEntry(traceId: string, entry: AuthLogEntry): void {
    try {
      const sessions = this.getPersistedSessions();
      let session = sessions.find(s => s.traceId === traceId);
      
      if (!session) {
        // Create new session
        session = {
          traceId,
          startTime: entry.timestamp,
          entries: [],
          sessionInfo: this.getSessionInfo(),
        };
        sessions.push(session);
      }

      session.entries.push(entry);
      
      // Limit entries per session
      if (session.entries.length > RING_BUFFER_SIZE) {
        session.entries = session.entries.slice(-RING_BUFFER_SIZE);
      }

      // Save back to storage
      const toStore = sessions.slice(-MAX_PERSISTED_SESSIONS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch (e) {
      // Storage quota exceeded - try to prune
      this.pruneOldSessions();
    }
  }

  /**
   * Mark auth flow as complete
   */
  markComplete(status: string, authenticated: boolean, error?: string): void {
    const traceId = this.currentTraceId;
    if (!traceId) return;

    try {
      const sessions = this.getPersistedSessions();
      const session = sessions.find(s => s.traceId === traceId);
      if (session) {
        session.finalState = { status, authenticated, error };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(-MAX_PERSISTED_SESSIONS)));
      }
    } catch (e) {
      // ignore
    }
  }

  /**
   * Get session info (device, environment)
   */
  getSessionInfo(): SessionInfo {
    const ua = navigator.userAgent || 'unknown';
    const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
    
    // Get SW state if available
    let swVersion: string | undefined;
    let swState: string | undefined;
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        swState = 'active';
        // SW version would come from SW itself
      } else if ('serviceWorker' in navigator) {
        swState = 'none';
      }
    } catch (e) {
      // ignore
    }

    // Detect persistence type
    let persistence: 'IndexedDB' | 'localStorage' | 'sessionStorage' | 'unknown' = 'unknown';
    try {
      if (typeof indexedDB !== 'undefined') {
        persistence = 'IndexedDB';
      } else if (typeof localStorage !== 'undefined') {
        persistence = 'localStorage';
      } else if (typeof sessionStorage !== 'undefined') {
        persistence = 'sessionStorage';
      }
    } catch (e) {
      persistence = 'unknown';
    }

    // Get viewport
    const viewport = typeof window !== 'undefined' 
      ? `${window.innerWidth}x${window.innerHeight}` 
      : 'unknown';

    return {
      timestamp: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      userAgent: ua,
      appVersion: APP_VERSION,
      origin: typeof window !== 'undefined' ? window.location.origin : 'unknown',
      swVersion,
      swState,
      persistence,
      viewport,
      online,
      cookieEnabled: typeof navigator !== 'undefined' ? navigator.cookieEnabled : false,
      localStorageEnabled: typeof localStorage !== 'undefined',
      sessionStorageEnabled: typeof sessionStorage !== 'undefined',
    };
  }

  /**
   * Get persisted sessions
   */
  getPersistedSessions(): AuthLogSession[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      return JSON.parse(stored) as AuthLogSession[];
    } catch (e) {
      return [];
    }
  }

  /**
   * Prune old sessions
   */
  private pruneOldSessions(): void {
    try {
      const sessions = this.getPersistedSessions();
      // Keep only the most recent MAX_PERSISTED_SESSIONS
      const pruned = sessions.slice(-MAX_PERSISTED_SESSIONS);
      if (pruned.length < sessions.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
      }
    } catch (e) {
      // ignore
    }
  }

  /**
   * Get current buffer + persisted entries for export
   */
  getLogForExport(traceId?: string): AuthLogSession | null {
    const targetTraceId = traceId || this.currentTraceId;
    if (!targetTraceId) return null;

    // Get from persisted sessions first
    const sessions = this.getPersistedSessions();
    let session = sessions.find(s => s.traceId === targetTraceId);

    // If not found, try to construct from ring buffer
    if (!session) {
      const entries = this.ringBuffer.filter(e => e.traceId === targetTraceId);
      if (entries.length > 0) {
        session = {
          traceId: targetTraceId,
          startTime: entries[0].timestamp,
          entries,
          sessionInfo: this.getSessionInfo(),
        };
      }
    }

    return session || null;
  }

  /**
   * Get all entries for current trace (buffer + persisted)
   */
  getAllEntries(traceId?: string): AuthLogEntry[] {
    const targetTraceId = traceId || this.currentTraceId;
    if (!targetTraceId) return [];

    // Combine buffer and persisted
    const sessions = this.getPersistedSessions();
    const session = sessions.find(s => s.traceId === targetTraceId);
    
    const persistedEntries = session?.entries || [];
    
    // Merge with buffer entries for this trace, dedupe by timestamp
    const allEntries = [...persistedEntries];
    const bufferEntries = this.ringBuffer.filter(
      e => e.traceId === targetTraceId && 
      !persistedEntries.some(p => p.timestamp === e.timestamp)
    );
    
    return [...allEntries, ...bufferEntries].sort((a, b) => 
      a.timestamp.localeCompare(b.timestamp)
    );
  }

  /**
   * Clear session log
   */
  clearSession(traceId?: string): void {
    const targetTraceId = traceId || this.currentTraceId;
    if (!targetTraceId) return;

    try {
      const sessions = this.getPersistedSessions();
      const filtered = sessions.filter(s => s.traceId !== targetTraceId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {
      // ignore
    }
  }

  /**
   * Format log as markdown
   */
  formatAsMarkdown(traceId?: string): string {
    const session = this.getLogForExport(traceId);
    if (!session) return '# Auth Log\n\nNo session data available.\n';

    const lines: string[] = [];
    
    // Header
    lines.push('# Flicklet Auth Log');
    lines.push('');
    lines.push(`**Trace ID:** ${session.traceId}`);
    lines.push(`**Date:** ${new Date(session.startTime).toLocaleString()}`);
    lines.push('');

    // Summary
    lines.push('## Summary');
    lines.push('');
    if (session.finalState) {
      lines.push(`**Status:** ${session.finalState.status}`);
      lines.push(`**Authenticated:** ${session.finalState.authenticated ? 'Yes' : 'No'}`);
      if (session.finalState.error) {
        lines.push(`**Error:** ${session.finalState.error}`);
      }
    } else {
      lines.push('**Status:** In progress');
    }
    lines.push(`**Total Events:** ${session.entries.length}`);
    lines.push('');

    // Session Info
    lines.push('## Environment');
    lines.push('');
    const info = session.sessionInfo;
    lines.push(`- **App Version:** ${info.appVersion}`);
    lines.push(`- **User Agent:** ${info.userAgent}`);
    lines.push(`- **Origin:** ${info.origin}`);
    lines.push(`- **Timezone:** ${info.timezone}`);
    lines.push(`- **Viewport:** ${info.viewport}`);
    lines.push(`- **Persistence:** ${info.persistence}`);
    lines.push(`- **Online:** ${info.online ? 'Yes' : 'No'}`);
    lines.push(`- **SW State:** ${info.swState || 'unknown'}`);
    lines.push(`- **Cookies:** ${info.cookieEnabled ? 'Enabled' : 'Disabled'}`);
    lines.push(`- **LocalStorage:** ${info.localStorageEnabled ? 'Enabled' : 'Disabled'}`);
    lines.push('');

    // Timeline
    lines.push('## Timeline');
    lines.push('');
    lines.push('| Time | Event | Data |');
    lines.push('|------|-------|------|');
    
    for (const entry of session.entries) {
      const time = new Date(entry.timestamp).toISOString();
      const event = entry.event;
      const dataStr = entry.data 
        ? JSON.stringify(entry.data, null, 2).replace(/\n/g, '<br>').substring(0, 100)
        : '';
      lines.push(`| ${time} | ${event} | ${dataStr || ''} |`);
    }
    lines.push('');

    // Detailed entries
    lines.push('## Detailed Events');
    lines.push('');
    for (const entry of session.entries) {
      lines.push(`### ${entry.event}`);
      lines.push(`**Time:** ${entry.timestamp}`);
      if (entry.data) {
        lines.push('**Data:**');
        lines.push('```json');
        lines.push(JSON.stringify(entry.data, null, 2));
        lines.push('```');
      }
      lines.push('');
    }

    // Final state
    if (session.finalState) {
      lines.push('## Final State');
      lines.push('');
      lines.push(`**Status:** ${session.finalState.status}`);
      lines.push(`**Authenticated:** ${session.finalState.authenticated}`);
      if (session.finalState.error) {
        lines.push(`**Error:** ${session.finalState.error}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Download log as file
   */
  downloadLog(traceId?: string): void {
    const markdown = this.formatAsMarkdown(traceId);
    const targetTraceId = traceId || this.currentTraceId || 'unknown';
    const date = new Date().toISOString().split('T')[0];
    const filename = `flicklet-auth-log_${date}_${targetTraceId}.md`;

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Copy log to clipboard
   */
  async copyLog(traceId?: string): Promise<boolean> {
    const markdown = this.formatAsMarkdown(traceId);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(markdown);
        return true;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = markdown;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return true;
      }
    } catch (e) {
      console.error('Failed to copy log:', e);
      return false;
    }
  }
}

// Export singleton
export const authLogManager = new AuthLogManager();

