/**
 * Logger utility for conditional console output
 * Only logs in development mode
 */

const isDevelopment = import.meta.env.DEV;

function shouldLog(): boolean {
  return isDevelopment;
}

export const logger = {
  log: (...args: any[]) => {
    if (shouldLog()) {
      console.log(...args);
    }
  },
  
  error: (...args: any[]) => {
    // Always log errors, even in production
    console.error(...args);
  },
  
  warn: (...args: any[]) => {
    if (shouldLog()) {
      console.warn(...args);
    }
  },
  
  info: (...args: any[]) => {
    if (shouldLog()) {
      console.info(...args);
    }
  },
  
  debug: (...args: any[]) => {
    if (shouldLog()) {
      console.debug(...args);
    }
  }
};

