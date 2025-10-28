/**
 * Process: Mobile Flags Normalization
 * Purpose: Single source of truth for mobile feature flags using kebab-case HTML data attributes
 * Data Source: HTML document.documentElement data attributes
 * Update Path: setFlag() writes to DOM, getFlag() reads from DOM
 * Dependencies: All components that check mobile flags, CSS selectors
 */

// Typed registry of known mobile flags
export type FlagName = "compact-mobile-v1" | "actions-split" | "debug-logging";

/**
 * Set a mobile flag by writing to the HTML data attribute
 * @param name - The flag name in kebab-case
 * @param value - Boolean value to set
 */
export function setFlag(name: FlagName, value: boolean): void {
  const html = document.documentElement;
  if (value) {
    html.setAttribute(`data-${name}`, 'true');
  } else {
    html.removeAttribute(`data-${name}`);
  }
}

/**
 * Get a mobile flag by reading from the HTML data attribute
 * @param name - The flag name in kebab-case
 * @returns Boolean value of the flag
 */
export function getFlag(name: FlagName): boolean {
  return document.documentElement.getAttribute(`data-${name}`) === 'true';
}

/**
 * Initialize mobile flags with default values
 * @param defaults - Object with flag names as keys and default boolean values
 */
export function initFlags(defaults: Partial<Record<FlagName, boolean>>): void {
  for (const [name, value] of Object.entries(defaults)) {
    if (value !== undefined) {
      setFlag(name as FlagName, value);
    }
  }
}

/**
 * Check if compact mobile v1 is enabled
 * @returns Boolean indicating if compact mobile v1 is active
 */
export function isCompactMobileV1(): boolean {
  return getFlag('compact-mobile-v1');
}

/**
 * Check if actions split is enabled
 * @returns Boolean indicating if actions split is active
 */
export function isActionsSplit(): boolean {
  return getFlag('actions-split');
}

/**
 * Check if debug logging is enabled
 * @returns Boolean indicating if debug logging is active
 */
export function isDebugLogging(): boolean {
  return getFlag('debug-logging');
}




