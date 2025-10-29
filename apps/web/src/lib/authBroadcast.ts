/**
 * Multi-tab safety: BroadcastChannel for auth state coordination
 * Prevents modal reopening in other tabs when auth is in-flight
 */

let broadcastChannel: BroadcastChannel | null = null;

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') {
    return null;
  }
  
  if (!broadcastChannel) {
    try {
      broadcastChannel = new BroadcastChannel('flicklet-auth');
      broadcastChannel.onmessage = (event) => {
        // Listen for auth state changes from other tabs
        if (event.data.type === 'auth-in-flight') {
          console.debug('[AuthBroadcast] Another tab has auth in-flight:', event.data);
        }
      };
    } catch (e) {
      console.warn('[AuthBroadcast] Failed to create BroadcastChannel', e);
      return null;
    }
  }
  
  return broadcastChannel;
}

export function broadcastAuthInFlight(status: 'redirecting' | 'resolving'): void {
  const channel = getBroadcastChannel();
  if (channel) {
    try {
      channel.postMessage({
        type: 'auth-in-flight',
        status,
        timestamp: Date.now()
      });
    } catch (e) {
      console.warn('[AuthBroadcast] Failed to broadcast', e);
    }
  }
}

export function broadcastAuthComplete(): void {
  const channel = getBroadcastChannel();
  if (channel) {
    try {
      channel.postMessage({
        type: 'auth-complete',
        timestamp: Date.now()
      });
    } catch (e) {
      console.warn('[AuthBroadcast] Failed to broadcast', e);
    }
  }
}

export function isAuthInFlightInOtherTab(): boolean {
  // Check localStorage for recent auth activity (fallback if BroadcastChannel unavailable)
  try {
    const lastBroadcast = localStorage.getItem('flicklet.auth.broadcast');
    if (lastBroadcast) {
      const broadcastTime = parseInt(lastBroadcast);
      const now = Date.now();
      const timeSince = now - broadcastTime;
      
      // If broadcast within last 10 seconds, assume auth is in-flight
      if (timeSince < 10000 && timeSince > 0) {
        return true;
      }
    }
  } catch (e) {
    // ignore
  }
  
  return false;
}

// Store broadcast in localStorage as fallback
export function markAuthInFlight(status: 'redirecting' | 'resolving'): void {
  broadcastAuthInFlight(status);
  try {
    localStorage.setItem('flicklet.auth.broadcast', Date.now().toString());
  } catch (e) {
    // ignore
  }
}

