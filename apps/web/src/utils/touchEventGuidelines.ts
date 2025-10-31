/**
 * Process: Touch Event Handling Guidelines
 * Purpose: Centralized utilities and guidelines for touch event handling
 * Data Source: Best practices and codebase patterns
 * Update Path: Update guidelines here for team reference
 * Dependencies: None
 */

/**
 * Touch event handler configuration options
 */
export interface TouchHandlerOptions {
  passive?: boolean;
  capture?: boolean;
  once?: boolean;
}

/**
 * Determine if a touch handler needs preventDefault
 */
export function needsPreventDefault(
  handler: (e: TouchEvent) => void,
  _context: string
): boolean {
  // Check function body for preventDefault call (basic heuristic)
  const handlerString = handler.toString();
  return handlerString.includes('preventDefault') || 
         handlerString.includes('preventDefault()');
}

/**
 * Get recommended passive configuration for a touch handler
 */
export function getRecommendedPassiveConfig(
  eventType: 'touchstart' | 'touchmove' | 'touchend' | 'touchcancel',
  needsPreventDefault: boolean,
  _purpose: 'scroll' | 'gesture' | 'click' | 'tracking'
): boolean {
  // touchmove with preventDefault usually needs non-passive
  if (eventType === 'touchmove' && needsPreventDefault) {
    return false; // Non-passive required for preventDefault
  }

  // For other cases, passive is usually better for performance
  if (eventType === 'touchstart' || eventType === 'touchend') {
    if (!needsPreventDefault) {
      return true; // Passive for better scroll performance
    }
    return false; // Non-passive if preventDefault needed
  }

  // Default: passive for better performance
  return !needsPreventDefault;
}

/**
 * Create a properly configured touch event listener
 */
export function createTouchListener(
  element: HTMLElement | Document | Window,
  eventType: 'touchstart' | 'touchmove' | 'touchend' | 'touchcancel',
  handler: (e: TouchEvent) => void,
  options: TouchHandlerOptions = {}
): () => void {
  const needsPrevent = needsPreventDefault(handler, 'touch-listener');
  const recommendedPassive = getRecommendedPassiveConfig(
    eventType,
    needsPrevent,
    'gesture' // Default purpose
  );

  const finalOptions: AddEventListenerOptions = {
    passive: options.passive ?? recommendedPassive,
    capture: options.capture ?? false,
    once: options.once ?? false
  };

  // Warn if configuration might be suboptimal
  if (import.meta.env.DEV) {
    const auditEnabled = typeof window !== 'undefined' && 
      localStorage.getItem('flag:touch-event-audit') === 'true';
    
    if (auditEnabled && !needsPrevent && !finalOptions.passive) {
      console.warn(
        `⚠️ Touch Event Audit: ${eventType} listener may benefit from passive: true`,
        { handler: handler.toString().substring(0, 100) }
      );
    }
  }

  element.addEventListener(eventType, handler as EventListener, finalOptions);

  // Return cleanup function
  return () => {
    element.removeEventListener(eventType, handler as EventListener, finalOptions);
  };
}

/**
 * Touch event handling guidelines
 * 
 * 1. PASSIVE: TRUE (Default Recommendation)
 *    - Use when: NOT calling preventDefault()
 *    - Benefits: Better scroll performance, no browser warnings
 *    - Examples: Click detection, position tracking, analytics
 * 
 * 2. PASSIVE: FALSE (Only when necessary)
 *    - Use when: MUST call preventDefault() to block default behavior
 *    - Benefits: Can prevent default scroll/zoom behavior
 *    - Tradeoff: Worse scroll performance, browser may warn
 *    - Examples: Pull-to-refresh, horizontal swipe gestures
 * 
 * 3. REACT SYNTHETIC EVENTS
 *    - React handles passive optimization automatically
 *    - Can't directly control passive flag
 *    - If need non-passive, use native addEventListener
 * 
 * 4. BEST PRACTICES
 *    - Always explicitly set passive flag (don't rely on defaults)
 *    - Use passive: true by default, only use false when necessary
 *    - Test scroll performance in Chrome DevTools
 *    - Monitor browser console warnings
 */

