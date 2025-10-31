/**
 * Process: Scroll Event Logger
 * Purpose: Debug logging for scroll events during development
 * Data Source: Browser scroll events, touch events
 * Update Path: Automatically logs when enabled
 * Dependencies: None
 */

type LogLevel = 'none' | 'error' | 'warn' | 'info' | 'debug';

interface ScrollLogEntry {
  timestamp: number;
  type: 'scroll' | 'touchstart' | 'touchmove' | 'touchend' | 'scrollLock' | 'scrollUnlock';
  target?: string;
  data?: Record<string, any>;
}

class ScrollLogger {
  private logs: ScrollLogEntry[] = [];
  private maxLogs = 100;
  private level: LogLevel = 'none';
  private enabled = false;

  constructor() {
    // Enable in development mode by default
    if (typeof window !== 'undefined' && import.meta.env.DEV) {
      this.enabled = true;
      this.level = 'info';
    }
    
    // Check for localStorage override
    if (typeof window !== 'undefined') {
      const enabled = localStorage.getItem('flag:scroll-logging');
      if (enabled === 'true') {
        this.enabled = true;
        this.level = 'debug';
      }
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level;
    this.enabled = level !== 'none';
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['none', 'error', 'warn', 'info', 'debug'];
    return levels.indexOf(level) <= levels.indexOf(this.level);
  }

  private addLog(type: ScrollLogEntry['type'], target?: string, data?: Record<string, any>): void {
    if (!this.shouldLog('debug')) return;

    this.logs.push({
      timestamp: Date.now(),
      type,
      target,
      data,
    });

    // Keep only last N logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  logScroll(target: string, scrollY: number, scrollTop: number): void {
    if (!this.shouldLog('info')) return;
    
    this.addLog('scroll', target, { scrollY, scrollTop });
    
    if (this.level === 'debug') {
      console.debug(`📜 Scroll [${target}]: scrollY=${scrollY}, scrollTop=${scrollTop}`);
    }
  }

  logTouch(type: 'touchstart' | 'touchmove' | 'touchend', target: string, clientX?: number, clientY?: number): void {
    if (!this.shouldLog('debug')) return;
    
    this.addLog(type, target, { clientX, clientY });
    
    if (this.level === 'debug') {
      console.debug(`👆 Touch [${type}] [${target}]: x=${clientX}, y=${clientY}`);
    }
  }

  logScrollLock(action: 'lock' | 'unlock', scrollY: number): void {
    if (!this.shouldLog('info')) return;
    
    this.addLog(action === 'lock' ? 'scrollLock' : 'scrollUnlock', 'body', { scrollY });
    
    console.log(`🔒 Scroll ${action === 'lock' ? 'LOCKED' : 'UNLOCKED'} at scrollY=${scrollY}`);
  }

  logError(message: string, error?: Error): void {
    if (!this.shouldLog('error')) return;
    
    console.error(`❌ Scroll Error: ${message}`, error);
    this.addLog('scroll', 'error', { message, error: error?.message });
  }

  logWarning(message: string, data?: Record<string, any>): void {
    if (!this.shouldLog('warn')) return;
    
    console.warn(`⚠️ Scroll Warning: ${message}`, data);
    this.addLog('scroll', 'warning', { message, ...data });
  }

  getLogs(): ScrollLogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
    console.log('🧹 Scroll logs cleared');
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Singleton instance
export const scrollLogger = new ScrollLogger();

// Expose to window for debugging (dev mode only)
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).scrollLogger = scrollLogger;
  console.log('🔧 Scroll logger available: window.scrollLogger');
  console.log('Usage: window.scrollLogger.setLevel("debug")');
}

