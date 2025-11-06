/**
 * Quick loader to ensure username diagnostics are available
 * This runs immediately and doesn't wait for async imports
 */

// Export empty object to make this a module
export {};

// Immediately expose a placeholder that will be replaced when module loads
if (typeof window !== 'undefined') {
  (window as any).debugUsername = async () => {
    console.warn('⚠️ Username diagnostics module is still loading...');
    console.log('Please wait a moment and try again, or check console for "[UsernameDiagnostics] ✅ Available functions" message');
    
    // Try to import and run
    try {
      const diagnostics = await import('./usernameDiagnostics');
      if (diagnostics && typeof diagnostics.diagnoseUsernamePrompt === 'function') {
        return diagnostics.diagnoseUsernamePrompt();
      }
    } catch (e) {
      console.error('Failed to load diagnostics module:', e);
      return {
        error: 'Diagnostics module failed to load',
        message: e instanceof Error ? e.message : String(e),
      };
    }
  };
  
  console.log('[UsernameDiagnostics] Placeholder loaded - full module loading...');
}

