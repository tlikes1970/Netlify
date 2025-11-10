/**
 * Process: Scroll Lock Utility
 * Purpose: Lock/unlock body scroll while preserving scroll position
 * Data Source: window.scrollY, document.body.style
 * Update Path: lockScroll() and unlockScroll() functions
 * Dependencies: scrollLogger (optional), scrollFeatureFlags (optional), iosDetection
 */

import { shouldUseIOSScrollFix, hasVisualViewport } from './iosDetection';

// Scroll lock utility that preserves scroll position
let scrollLockData: { scrollY: number; bodyStyle: string } | null = null;
let lockCount = 0; // Track lock depth for re-entrancy protection

// iOS-specific state
let iosViewportResizeHandler: (() => void) | null = null;
let iosMomentumScrollCleanup: (() => void) | null = null;
let iosOrientationHandler: (() => void) | null = null;

/**
 * Check if scroll lock safety improvements are enabled
 */
function isSafetyEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem('flag:scroll-lock-safety') === 'true';
  } catch {
    return false;
  }
}

/**
 * Safe scroll logger (optional - only if scrollLogger is available)
 */
function logScrollLock(action: 'lock' | 'unlock', scrollY: number, message?: string): void {
  if (typeof window !== 'undefined' && (window as any).scrollLogger) {
    try {
      (window as any).scrollLogger.logScrollLock(action, scrollY);
      if (message) {
        (window as any).scrollLogger.logWarning(message);
      }
    } catch {
      // Ignore logger errors
    }
  }
}

/**
 * Validate scroll position before restoring
 * Returns true if position is valid, false if it should be clamped
 */
function validateScrollPosition(scrollY: number): { valid: boolean; clamped: number } {
  const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const clamped = Math.max(0, Math.min(scrollY, maxScroll));
  return {
    valid: scrollY === clamped,
    clamped
  };
}

/**
 * iOS-specific scroll lock implementation
 * Handles iOS Safari quirks: viewport resize, momentum scroll, safe areas
 */
function lockScrollIOS(scrollY: number): void {
  const bodyStyle = document.body.style.cssText;
  
  // iOS Safari: Use visualViewport for accurate scroll position
  let actualScrollY = scrollY;
  if (hasVisualViewport() && window.visualViewport) {
    // Account for visual viewport offset on iOS
    actualScrollY = scrollY + (window.visualViewport.offsetTop || 0);
  }
  
  // Apply scroll lock with iOS-specific considerations
  document.body.style.cssText = `
    position: fixed;
    top: -${actualScrollY}px;
    left: 0;
    right: 0;
    overflow: hidden;
    width: 100%;
  `;
  
  // Store original scroll position (not adjusted)
  scrollLockData = { scrollY, bodyStyle };
  
  // Handle iOS viewport resize events (keyboard, toolbar)
  if (hasVisualViewport() && window.visualViewport) {
    iosViewportResizeHandler = () => {
      // Maintain scroll lock during viewport changes
      if (scrollLockData) {
        const currentScrollY = scrollLockData.scrollY;
        const viewportOffset = window.visualViewport?.offsetTop || 0;
        document.body.style.top = `-${currentScrollY + viewportOffset}px`;
      }
    };
    
    window.visualViewport.addEventListener('resize', iosViewportResizeHandler);
    window.visualViewport.addEventListener('scroll', iosViewportResizeHandler);
  }
  
  // Handle iOS orientation changes
  iosOrientationHandler = () => {
    // On orientation change, maintain scroll lock
    if (scrollLockData) {
      // Wait for orientation to settle
      setTimeout(() => {
        if (scrollLockData) {
          const currentScrollY = scrollLockData.scrollY;
          const viewportOffset = hasVisualViewport() && window.visualViewport 
            ? (window.visualViewport.offsetTop || 0) 
            : 0;
          
          // Re-apply lock with new orientation
          document.body.style.top = `-${currentScrollY + viewportOffset}px`;
        }
      }, 100);
    }
  };
  
  window.addEventListener('orientationchange', iosOrientationHandler);
  
  // Handle iOS momentum scroll interference
  // Prevent momentum scroll from continuing after lock
  iosMomentumScrollCleanup = () => {
    // Stop any ongoing momentum scroll
    if (scrollLockData) {
      const currentScrollY = scrollLockData.scrollY;
      window.scrollTo(0, currentScrollY);
    }
  };
  
  // Immediate stop of momentum
  iosMomentumScrollCleanup();
  
  // Also stop on next frame to catch delayed momentum
  requestAnimationFrame(() => {
    iosMomentumScrollCleanup?.();
  });
}

/**
 * Lock body scroll and preserve current scroll position
 * Includes safety improvements and iOS-specific fixes when enabled
 */
export function lockScroll(): void {
  const safetyEnabled = isSafetyEnabled();
  const useIOSFix = shouldUseIOSScrollFix();
  
  // Re-entrancy protection: track lock depth
  if (safetyEnabled) {
    lockCount++;
    if (lockCount > 1) {
      // Already locked - just increment counter
      logScrollLock('lock', window.scrollY, `Scroll already locked (depth: ${lockCount})`);
      return;
    }
  } else {
    // Original behavior: early return if already locked
    if (scrollLockData) return;
  }
  
  try {
    const scrollY = window.scrollY;
    const bodyStyle = document.body.style.cssText;
    
    // Safety: Validate scroll position before locking
    if (safetyEnabled) {
      const validation = validateScrollPosition(scrollY);
      if (!validation.valid) {
        logScrollLock('lock', scrollY, `Scroll position clamped from ${scrollY} to ${validation.clamped}`);
      }
    }
    
    // iOS-specific lock implementation
    if (useIOSFix) {
      lockScrollIOS(scrollY);
      if (safetyEnabled) {
        logScrollLock('lock', scrollY, 'iOS-specific lock applied');
      }
    } else {
      // Standard lock implementation
      document.body.style.cssText = `
        position: fixed;
        top: -${scrollY}px;
        left: 0;
        right: 0;
        overflow: hidden;
      `;
      
      scrollLockData = { scrollY, bodyStyle };
    }
    
    // Log lock action
    if (safetyEnabled) {
      logScrollLock('lock', scrollY);
    }
  } catch (error) {
    // Error boundary: log error but don't throw
    console.error('Failed to lock scroll:', error);
    if (safetyEnabled) {
      try {
        if ((window as any).scrollLogger) {
          (window as any).scrollLogger.logError('Failed to lock scroll', error as Error);
        }
      } catch {
        // Ignore logger errors
      }
    }
    // Reset state on error
    if (safetyEnabled) {
      lockCount = 0;
      scrollLockData = null;
    }
    // Cleanup iOS handlers
    cleanupIOSHandlers();
  }
}

/**
 * Cleanup iOS-specific handlers
 */
function cleanupIOSHandlers(): void {
  // Remove viewport resize handler
  if (iosViewportResizeHandler && hasVisualViewport() && window.visualViewport) {
    window.visualViewport.removeEventListener('resize', iosViewportResizeHandler);
    window.visualViewport.removeEventListener('scroll', iosViewportResizeHandler);
    iosViewportResizeHandler = null;
  }
  
  // Remove orientation change handler
  if (iosOrientationHandler) {
    window.removeEventListener('orientationchange', iosOrientationHandler);
    iosOrientationHandler = null;
  }
  
  // Clear momentum scroll cleanup
  iosMomentumScrollCleanup = null;
}

/**
 * iOS-specific scroll unlock implementation
 * Handles iOS Safari quirks during unlock
 */
function unlockScrollIOS(scrollY: number, bodyStyle: string): void {
  // Cleanup iOS handlers first
  cleanupIOSHandlers();
  
  // Restore body styles
  document.body.style.cssText = bodyStyle;
  
  // For iOS: Wait for viewport to stabilize before restoring scroll
  if (hasVisualViewport() && window.visualViewport) {
    // Wait for viewport to settle (handles keyboard dismissal, toolbar animations)
    const restoreScroll = () => {
      // Account for any viewport offset
      const viewportOffset = window.visualViewport?.offsetTop || 0;
      const adjustedScrollY = Math.max(0, scrollY - viewportOffset);
      
      window.scrollTo(0, adjustedScrollY);
      
      // Verify restoration after a frame
      requestAnimationFrame(() => {
        const actualScrollY = window.scrollY;
        const tolerance = 5; // iOS may have slightly more variance
        if (Math.abs(actualScrollY - adjustedScrollY) > tolerance) {
          // Try again after another frame (iOS sometimes needs multiple attempts)
          requestAnimationFrame(() => {
            window.scrollTo(0, adjustedScrollY);
          });
        }
      });
    };
    
    // If viewport is changing, wait for it to settle
    if (window.visualViewport.offsetTop !== 0) {
      // Wait for viewport to stabilize (keyboard dismissing, etc.)
      setTimeout(restoreScroll, 100);
    } else {
      restoreScroll();
    }
  } else {
    // Fallback: standard restore
    window.scrollTo(0, scrollY);
  }
}

/**
 * Unlock body scroll and restore scroll position
 * Includes safety improvements and iOS-specific fixes when enabled
 */
export function unlockScroll(): void {
  const safetyEnabled = isSafetyEnabled();
  const useIOSFix = shouldUseIOSScrollFix();
  
  // Safety check: prevent unlock when not locked
  if (safetyEnabled) {
    if (!scrollLockData && lockCount === 0) {
      // Suppress warnings - this is a harmless condition that can occur during normal operation
      // (e.g., when a modal closes but scroll was never locked, or during cleanup)
      // Only log if scrollLogger is explicitly set to 'debug' level for detailed debugging
      if (typeof window !== 'undefined' && (window as any).scrollLogger) {
        try {
          const logger = (window as any).scrollLogger;
          // Access private level via exposed method if available, otherwise check shouldLog
          const shouldLogWarn = logger.shouldLog ? logger.shouldLog('warn') : false;
          // Only log if explicitly in debug mode (not default dev 'info' level)
          if (shouldLogWarn && logger.level === 'debug') {
            logScrollLock('unlock', window.scrollY, 'Attempted to unlock scroll when not locked');
          }
        } catch {
          // Ignore logger errors - silently return
        }
      }
      return;
    }
    
    // Decrement lock count
    lockCount = Math.max(0, lockCount - 1);
    
    // Don't actually unlock until count reaches zero
    if (lockCount > 0) {
      logScrollLock('unlock', window.scrollY, `Scroll unlock deferred (depth: ${lockCount})`);
      return;
    }
  } else {
    // Original behavior: early return if not locked
    if (!scrollLockData) return;
  }
  
  try {
    if (!scrollLockData) {
      if (safetyEnabled) {
        logScrollLock('unlock', window.scrollY, 'No scroll lock data available');
      }
      return;
    }
    
    const { scrollY, bodyStyle } = scrollLockData;
    
    // Safety: Validate scroll position before restoring
    if (safetyEnabled) {
      const validation = validateScrollPosition(scrollY);
      const restoredScrollY = validation.valid ? scrollY : validation.clamped;
      
      if (!validation.valid) {
        logScrollLock('unlock', scrollY, `Scroll position clamped from ${scrollY} to ${restoredScrollY} before restore`);
      }
      
      // iOS-specific unlock
      if (useIOSFix) {
        unlockScrollIOS(restoredScrollY, bodyStyle);
        if (safetyEnabled) {
          logScrollLock('unlock', scrollY, 'iOS-specific unlock applied');
        }
      } else {
        // Standard unlock
        document.body.style.cssText = bodyStyle;
        window.scrollTo(0, restoredScrollY);
        
        // Verify scroll position was restored correctly
        requestAnimationFrame(() => {
          const actualScrollY = window.scrollY;
          const tolerance = 2; // Allow 2px tolerance for rounding
          if (Math.abs(actualScrollY - restoredScrollY) > tolerance) {
            logScrollLock('unlock', actualScrollY, `Scroll position mismatch: expected ${restoredScrollY}, got ${actualScrollY}`);
            // Attempt correction
            window.scrollTo(0, restoredScrollY);
          }
        });
      }
    } else {
      // Original behavior: simple restore
      if (useIOSFix) {
        unlockScrollIOS(scrollY, bodyStyle);
      } else {
        document.body.style.cssText = bodyStyle;
        window.scrollTo(0, scrollY);
      }
    }
    
    // Log unlock action
    if (safetyEnabled) {
      logScrollLock('unlock', scrollY);
    }
    
    // Cleanup iOS handlers
    cleanupIOSHandlers();
    
    scrollLockData = null;
    
    if (safetyEnabled) {
      lockCount = 0; // Reset counter after successful unlock
    }
  } catch (error) {
    // Error boundary: log error but don't throw
    console.error('Failed to unlock scroll:', error);
    if (safetyEnabled) {
      try {
        if ((window as any).scrollLogger) {
          (window as any).scrollLogger.logError('Failed to unlock scroll', error as Error);
        }
      } catch {
        // Ignore logger errors
      }
      // Reset state on error
      lockCount = 0;
    }
    // Cleanup iOS handlers on error
    cleanupIOSHandlers();
    scrollLockData = null;
  }
}

/**
 * Force unlock scroll (emergency unlock)
 * Should only be used in error recovery scenarios
 */
export function forceUnlockScroll(): void {
  const safetyEnabled = isSafetyEnabled();
  
  if (safetyEnabled) {
    logScrollLock('unlock', window.scrollY, 'Force unlock called - clearing all scroll lock state');
  }
  
  // Cleanup iOS handlers
  cleanupIOSHandlers();
  
  try {
    if (scrollLockData) {
      const { bodyStyle } = scrollLockData;
      document.body.style.cssText = bodyStyle;
    } else {
      // No saved style - try to reset to default
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      document.body.style.width = '';
    }
  } catch (error) {
    console.error('Failed to force unlock scroll:', error);
  }
  
  scrollLockData = null;
  if (safetyEnabled) {
    lockCount = 0;
  }
}

/**
 * Get current scroll lock state (for debugging)
 */
export function getScrollLockState(): { isLocked: boolean; scrollY: number | null; lockCount: number } {
  return {
    isLocked: scrollLockData !== null,
    scrollY: scrollLockData?.scrollY ?? null,
    lockCount: isSafetyEnabled() ? lockCount : (scrollLockData ? 1 : 0)
  };
}
