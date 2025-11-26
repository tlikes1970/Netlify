/**
 * Process: Centralized Error Messages
 * Purpose: Unified error messaging for consistent, friendly user-facing errors
 * Data Source: Static message constants
 * Update Path: Modify ERROR_MESSAGES to change error copy app-wide
 * Dependencies: Used by error boundaries, games, community panel, feedback panel
 */

/**
 * Central error message constants
 * 
 * Design principles:
 * - Acknowledge the problem briefly
 * - Explain what to do next
 * - Provide action when possible
 * - Never expose raw error codes or technical details to users
 * - Errors do NOT use personality system (clarity over jokes)
 */
export const ERROR_MESSAGES = {
  // Network errors
  network: "Couldn't connect. Check your internet and try again.",
  timeout: "That took too long. Try again in a moment.",
  offline: "You're offline. Check your connection.",
  
  // Data operations
  saveFailed: "Changes couldn't be saved. Try again in a moment.",
  loadFailed: "Couldn't load that. Pull down to refresh.",
  notFound: "We couldn't find that. It may have been removed.",
  
  // Authentication
  authFailed: "Couldn't sign you in. Try again.",
  sessionExpired: "Your session expired. Please sign in again.",
  
  // Validation
  validation: {
    required: "This field is required.",
    invalidEmail: "Please enter a valid email.",
    tooShort: "That's too short.",
    tooLong: "That's too long.",
  },
  
  // Games
  game: {
    loadFailed: "Couldn't load the game. Try refreshing.",
    wordInvalid: "That word didn't work. Try another.",
    submitFailed: "Couldn't submit that. Try again.",
  },
  
  // Community
  community: {
    loadPosts: "Couldn't load posts. Pull down to refresh.",
    submitPost: "Post couldn't be sent. Try again.",
    submitComment: "Comment couldn't be sent. Try again.",
  },
  
  // Generic fallback
  generic: "Something went wrong. Let's try that again.",
} as const;

/**
 * Error message types for type-safe access
 */
export type ErrorMessageCategory = keyof typeof ERROR_MESSAGES;
export type ValidationErrorKey = keyof typeof ERROR_MESSAGES.validation;
export type GameErrorKey = keyof typeof ERROR_MESSAGES.game;
export type CommunityErrorKey = keyof typeof ERROR_MESSAGES.community;

/**
 * Get a user-friendly error message by category
 * 
 * @param category - The error category (e.g., 'network', 'saveFailed', 'generic')
 * @returns User-friendly error message string
 * 
 * @example
 * getErrorMessage('network') // "Couldn't connect. Check your internet and try again."
 * getErrorMessage('validation', 'required') // "This field is required."
 */
export function getErrorMessage(
  category: ErrorMessageCategory,
  subKey?: string
): string {
  const message = ERROR_MESSAGES[category];
  
  if (typeof message === 'string') {
    return message;
  }
  
  if (typeof message === 'object' && subKey && subKey in message) {
    return (message as Record<string, string>)[subKey];
  }
  
  return ERROR_MESSAGES.generic;
}

/**
 * Log error details to console in development mode only
 * Never exposes technical details to users
 * 
 * @param context - Where the error occurred (e.g., 'FlickWordGame', 'CommunityPanel')
 * @param error - The original error object
 * @param additionalInfo - Optional additional context
 */
export function logErrorDetails(
  context: string,
  error: unknown,
  additionalInfo?: Record<string, unknown>
): void {
  if (import.meta.env.DEV) {
    console.error(`[${context}] Error:`, error);
    if (additionalInfo) {
      console.error(`[${context}] Additional info:`, additionalInfo);
    }
  }
}

/**
 * Get error message from an unknown error, with fallback
 * Use this when catching errors to get a safe user-facing message
 * 
 * @param error - The caught error (unknown type)
 * @param fallbackCategory - Category to use for user message (default: 'generic')
 * @returns User-friendly error message
 */
export function getSafeErrorMessage(
  error: unknown,
  fallbackCategory: ErrorMessageCategory = 'generic'
): string {
  // Log the actual error in dev mode
  if (import.meta.env.DEV && error) {
    console.error('[Error caught]:', error);
  }
  
  // Always return a user-friendly message
  return getErrorMessage(fallbackCategory);
}

