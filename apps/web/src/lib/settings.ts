import React from 'react';

// Settings data model based on design document
export type PersonalityLevel = 1 | 2 | 3; // Regular, Semi-sarcastic, Severely sarcastic
export type Theme = 'light' | 'dark';
export type TargetList = 'watching' | 'wishlist';

export interface Settings {
  // General
  displayName: string;
  personalityLevel: PersonalityLevel;
  
  // Notifications
  notifications: {
    upcomingEpisodes: boolean;
    weeklyDiscover: boolean;
    monthlyStats: boolean;
    alertConfig?: {
      leadTimeHours: number;
      targetList: TargetList;
    };
  };
  
  // Layout
  layout: {
    condensedView: boolean;
    theme: Theme;
    homePageLists: string[];
    forYouGenres: string[];
    episodeTracking: boolean;
    themePack?: string; // Pro feature
  };
  
  // Pro
  pro: {
    isPro: boolean;
    features: {
      advancedNotifications: boolean;
      themePacks: boolean;
      socialFeatures: boolean;
      bloopersAccess: boolean;
      extrasAccess: boolean;
    };
  };
}

// Default settings
const DEFAULT_SETTINGS: Settings = {
  displayName: 'Guest',
  personalityLevel: 1, // Regular
  
  notifications: {
    upcomingEpisodes: true,
    weeklyDiscover: true,
    monthlyStats: true,
  },
  
  layout: {
    condensedView: false,
    theme: 'dark',
    homePageLists: ['currently-watching', 'up-next', 'community', 'for-you-drama', 'for-you-comedy', 'for-you-horror', 'in-theaters', 'feedback'],
    forYouGenres: ['drama', 'comedy', 'horror'],
    episodeTracking: false,
  },
  
  pro: {
    isPro: true,
    features: {
      advancedNotifications: true,
      themePacks: true,
      socialFeatures: true,
      bloopersAccess: true,
      extrasAccess: true,
    },
  },
};

// Storage key
const KEY = 'flicklet.settings.v2';

// Settings state management
class SettingsManager {
  private settings: Settings;
  private subscribers: Set<() => void> = new Set();

  constructor() {
    this.settings = this.loadSettings();
    this.applyTheme(this.settings.layout.theme);
  }

  private loadSettings(): Settings {
    try {
      const stored = localStorage.getItem(KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to handle new settings
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load settings:', error);
    }
    return { ...DEFAULT_SETTINGS };
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.settings));
      this.notifySubscribers();
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  private notifySubscribers(): void {
    // Track notification for diagnostics
    if (typeof window !== 'undefined' && (window as any).flickerDiagnostics) {
      (window as any).flickerDiagnostics.logSubscription('SettingsManager', 'notify', { subscriberCount: this.subscribers.size });
    }
    this.subscribers.forEach(callback => callback());
  }

  // Public API
  getSettings(): Settings {
    return { ...this.settings };
  }

  updateSettings(updates: Partial<Settings>): void {
    this.settings = { ...this.settings, ...updates };
    this.saveSettings();
  }

  updateDisplayName(name: string): void {
    this.settings.displayName = name;
    this.saveSettings();
  }

  updatePersonalityLevel(level: PersonalityLevel): void {
    this.settings.personalityLevel = level;
    this.saveSettings();
  }

  updateTheme(theme: Theme): void {
    this.settings.layout.theme = theme;
    this.applyTheme(theme);
    this.saveSettings();
  }

  private applyTheme(theme: Theme): void {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }

  toggleEpisodeTracking(): void {
    this.settings.layout.episodeTracking = !this.settings.layout.episodeTracking;
    this.saveSettings();
  }

  resetToDefaults(): void {
    this.settings = { ...DEFAULT_SETTINGS };
    this.saveSettings();
  }

  subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }
}

// Singleton instance
const settingsManager = new SettingsManager();

// React hook for settings
export function useSettings() {
  const [settings, setSettings] = React.useState(() => settingsManager.getSettings());

  React.useEffect(() => {
    // Track subscription for diagnostics
    if (typeof window !== 'undefined' && (window as any).flickerDiagnostics) {
      (window as any).flickerDiagnostics.logSubscription('useSettings', 'subscribe', {});
    }
    
    const unsubscribe = settingsManager.subscribe(() => {
      const newSettings = settingsManager.getSettings();
      // Track state change for diagnostics
      if (typeof window !== 'undefined' && (window as any).flickerDiagnostics) {
        (window as any).flickerDiagnostics.logStateChange('useSettings', 'settings', settings, newSettings);
      }
      setSettings(newSettings);
    });
    return unsubscribe;
  }, []);

  return settings;
}

// React hook for specific setting
export function useSetting<K extends keyof Settings>(key: K): Settings[K] {
  const settings = useSettings();
  return settings[key];
}

// Export manager for direct access
export { settingsManager };

// Personality text variations - Apple App Store compliant
export const PERSONALITY_TEXTS = {
  1: { // Regular - Friendly and helpful
    welcome: "Welcome back, {username}! ✨",
    empty: "No shows here yet.",
    add: "Add some shows to get started!",
    sarcasm: "",
    
    // Empty states
    emptyWatching: "No shows in your currently watching list.",
    emptyWishlist: "Your wishlist is empty.",
    emptyWatched: "You haven't marked anything as watched yet.",
    emptyUpNext: "No upcoming episodes scheduled.",
    
    // User interactions
    itemAdded: "Added to your list!",
    itemRemoved: "Removed from your list.",
    searchEmpty: "No results found. Try a different search.",
    searchLoading: "Searching...",
    
    // Error messages
    errorGeneric: "Something went wrong. Please try again.",
    errorNetwork: "Network error. Check your connection.",
    errorNotFound: "Content not found.",
    
    // Success messages
    successSave: "Settings saved!",
    successImport: "Data imported successfully!",
    successExport: "Data exported successfully!",
    
    // Marquee messages
    marquee1: "Discover your next favorite show",
    marquee2: "Track what you're watching",
    marquee3: "Never miss an episode",
    marquee4: "Find your next binge-watch",
    marquee5: "Organize your entertainment",
  },
  
  2: { // Semi-sarcastic - A bit cheeky (Apple-safe)
    welcome: "Oh, you're back, {username}. How... delightful.",
    empty: "Well, this is awkward. Nothing here.",
    add: "Maybe try adding something? Just a thought.",
    sarcasm: "Because clearly you need help.",
    
    // Empty states
    emptyWatching: "Well, this is awkward. Nothing here.",
    emptyWishlist: "Your wishlist is as empty as a Monday morning.",
    emptyWatched: "You haven't watched anything? That's... impressive.",
    emptyUpNext: "No episodes coming up. Shocking.",
    
    // User interactions
    itemAdded: "There you go. You're welcome.",
    itemRemoved: "And it's gone. Poof.",
    searchEmpty: "Nothing found. Surprise, surprise.",
    searchLoading: "Searching... this might take a while.",
    
    // Error messages
    errorGeneric: "Well, that didn't work. Shocking.",
    errorNetwork: "No internet? In this day and age?",
    errorNotFound: "It's gone. Vanished. Poof.",
    
    // Success messages
    successSave: "Settings saved. Finally.",
    successImport: "Data imported. Hope it's better than the last batch.",
    successExport: "Data exported. Don't lose it this time.",
    
    // Marquee messages
    marquee1: "Because clearly you need help finding shows",
    marquee2: "Track what you're watching (if anything)",
    marquee3: "Never miss an episode (that exists)",
    marquee4: "Find your next binge-watch (good luck)",
    marquee5: "Organize your entertainment (finally)",
  },
  
  3: { // Severely sarcastic - Maximum sass (Apple-safe, no user-directed digs)
    welcome: "Oh joy, {username}. Another visit. I'm absolutely thrilled.",
    empty: "Shocking. Absolutely shocking that this is empty.",
    add: "Perhaps you'd like to actually use this app? Revolutionary concept.",
    sarcasm: "I'm sure this will end well.",
    
    // Empty states - Apple-safe: punch at the situation, not the user
    emptyWatching: "This list is emptier than a politician's promises.",
    emptyWishlist: "Your wishlist is emptier than a Monday morning coffee shop.",
    emptyWatched: "Nothing watched yet. The algorithm is probably confused.",
    emptyUpNext: "No episodes coming up. What a surprise. I'm devastated.",
    
    // User interactions - Apple-safe: focus on the action, not the user
    itemAdded: "There. The algorithm is pleased.",
    itemRemoved: "Gone. Vanished. Like my will to live.",
    searchEmpty: "Nothing found. What a shock. I'm devastated.",
    searchLoading: "Searching... this could take forever. Literally.",
    
    // Error messages - Apple-safe: punch at the technology, not the user
    errorGeneric: "It broke. Shocking. Absolutely shocking.",
    errorNetwork: "No internet? What is this, 1995?",
    errorNotFound: "It's gone. Disappeared. Like my hopes and dreams.",
    
    // Success messages - Apple-safe: focus on the system, not the user
    successSave: "Settings saved. The system is pleased.",
    successImport: "Data imported. Hope it's not as disappointing as everything else.",
    successExport: "Data exported. Don't lose it. Again.",
    
    // Marquee messages - Apple-safe: punch at the situation, not the user
    marquee1: "Discover your next favorite show (if such a thing exists)",
    marquee2: "Track what you're watching (assuming you watch anything)",
    marquee3: "Never miss an episode (that actually airs)",
    marquee4: "Find your next binge-watch (good luck with that)",
    marquee5: "Organize your entertainment (finally, some order)",
  },
};

// Get personality text
export function getPersonalityText(
  key: keyof typeof PERSONALITY_TEXTS[1], 
  personalityLevel: PersonalityLevel,
  context?: { username?: string }
): string {
  const text = PERSONALITY_TEXTS[personalityLevel][key];
  
  // Replace {username} placeholder if provided
  if (context?.username) {
    return text.replace('{username}', context.username);
  }
  
  return text;
}
