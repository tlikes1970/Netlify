/**
 * Process: Auth Debug Logger
 * Purpose: Structured logging for auth diagnostics, guarded by debug flags
 * Data Source: URL params, environment vars, auth events
 * Update Path: Controlled by ?debug=auth or FLK_AUTH_DEBUG=1
 * Dependencies: None (pure utility)
 */

// In-memory log buffer for /debug/auth page
const authLogBuffer: Array<{ timestamp: string; event: string; payload?: any }> = [];
const MAX_LOG_BUFFER = 100;

/**
 * Check if auth debug mode is enabled
 * Enabled via:
 * - URL param: ?debug=auth
 * - Build-time env: FLK_AUTH_DEBUG=1
 */
export function isAuthDebug(): boolean {
  if (typeof window === 'undefined') {
    return import.meta.env.FLK_AUTH_DEBUG === '1';
  }
  
  // Check URL param
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('debug') === 'auth') {
    return true;
  }
  
  // Check build-time env
  return import.meta.env.FLK_AUTH_DEBUG === '1';
}

/**
 * Get query flag value
 */
export function getQueryFlag(name: string): string | null {
  if (typeof window === 'undefined') return null;
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

/**
 * Sanitize payload to remove sensitive data
 */
function sanitizePayload(payload: any): any {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }
  
  const sanitized: any = Array.isArray(payload) ? [] : {};
  const sensitiveKeys = ['token', 'idToken', 'accessToken', 'refreshToken', 'email', 'password', 'secret', 'key'];
  
  for (const [key, value] of Object.entries(payload)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveKeys.some(sk => lowerKey.includes(sk));
    
    if (isSensitive && typeof value === 'string' && value.length > 6) {
      // Mask: show first 3 and last 3 chars
      sanitized[key] = `${value.substring(0, 3)}...${value.substring(value.length - 3)}`;
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizePayload(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Mask secret values (apiKey, etc.) - show first/last 3 chars
 */
export function maskSecret(value: string | undefined | null): string {
  if (!value || value.length <= 6) return '***';
  return `${value.substring(0, 3)}...${value.substring(value.length - 3)}`;
}

/**
 * Log auth event with timestamp and sanitized payload
 */
export function logAuth(event: string, payload?: any): void {
  if (!isAuthDebug()) {
    return;
  }
  
  const timestamp = new Date().toISOString();
  const sanitized = payload ? sanitizePayload(payload) : undefined;
  
  // Add to buffer
  authLogBuffer.push({ timestamp, event, payload: sanitized });
  if (authLogBuffer.length > MAX_LOG_BUFFER) {
    authLogBuffer.shift();
  }
  
  // Console log with prefix
  console.log(`[AuthDebug] ${timestamp} ${event}`, sanitized || '');
}

/**
 * Get recent auth logs for display
 */
export function getRecentAuthLogs(): Array<{ timestamp: string; event: string; payload?: any }> {
  return [...authLogBuffer];
}

/**
 * Clear auth log buffer
 */
export function clearAuthLogs(): void {
  authLogBuffer.length = 0;
}

/**
 * Get safe origin (current location.origin)
 */
export function safeOrigin(): string {
  if (typeof window === 'undefined') return 'unknown';
  return window.location.origin;
}

/**
 * Check if authMode query param is set
 */
export function getAuthMode(): 'popup' | 'redirect' | null {
  const mode = getQueryFlag('authMode');
  if (mode === 'popup' || mode === 'redirect') {
    return mode;
  }
  return null;
}

