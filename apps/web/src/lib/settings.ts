/**
 * Process: Settings Management with Cross-Device Sync
 * Purpose: Manage user settings with localStorage persistence and Firebase sync for cross-device synchronization
 * Data Source: localStorage (flicklet.settings.v2) and Firebase (users/{uid}/settings)
 * Update Path: settingsManager.update*() methods → saveSettings() → syncSettingsToFirebase()
 * Dependencies: authManager, Firebase Firestore
 * 
 * Cross-Device Sync Flow:
 * 1. Settings changes → saveSettings() → syncSettingsToFirebase() → Firebase
 * 2. Login → loadSettingsFromFirebase() → merge with localStorage → apply settings
 * 3. Conflict resolution: Firebase settings take precedence over localStorage
 */

import React from 'react';
import { authManager } from './auth';
import type { UserSettings } from './auth.types';

// Settings data model based on design document
// Personality modes: 8 distinct personalities with unique commentary styles
import { PersonalityName, DEFAULT_PERSONALITY, clearVariantCache } from '../data/personalities';
export type { PersonalityName } from '../data/personalities';
export { getPersonalityText, PERSONALITY_LIST, DEFAULT_PERSONALITY, clearVariantCache } from '../data/personalities';

export type Theme = 'light' | 'dark';
export type TargetList = 'watching' | 'wishlist';

// Legacy type alias for backwards compatibility
export type PersonalityLevel = 1 | 2 | 3;

export interface Settings {
  // General
  displayName: string;
  personalityLevel: PersonalityLevel; // Legacy field (kept for migration)
  personality: PersonalityName; // New personality system
  
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
    discoveryLimit: 25 | 50 | 75 | 100; // Number of discovery recommendations
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
  
  // Community
  community: {
    followedTopics: string[]; // Array of topic slugs user follows
  };
}

// Default settings
const DEFAULT_SETTINGS: Settings = {
  displayName: 'Guest',
  personalityLevel: 1, // Legacy (kept for migration)
  personality: DEFAULT_PERSONALITY, // New: defaults to 'Zen'
  
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
    discoveryLimit: 25, // Default to 25 recommendations
  },
  
  pro: {
    isPro: false, // Default OFF - users must explicitly enable Pro (Alpha/testing) or purchase
    features: {
      advancedNotifications: false,
      themePacks: false,
      socialFeatures: false,
      bloopersAccess: false,
      extrasAccess: false,
    },
  },
  
  community: {
    followedTopics: [],
  },
};

type FirebaseUserSettings = UserSettings & Partial<{
  displayName: string;
  personalityLevel: PersonalityLevel;
  notifications: Settings['notifications'];
  layout: Settings['layout'];
  pro: Settings['pro'];
  community: Settings['community'];
  fullSettings: Settings;
  theme: Theme;
}>;

// Storage key
const KEY = 'flicklet.settings.v2';

// Settings state management
class SettingsManager {
  private settings: Settings;
  private subscribers: Set<() => void> = new Set();
  private syncTimeout: ReturnType<typeof setTimeout> | null = null;
  private isSyncing = false;

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
      // Sync to Firebase in background (non-blocking)
      this.syncSettingsToFirebase();
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  /**
   * Sync settings to Firebase for cross-device persistence
   * Debounced to avoid excessive writes
   */
  private syncSettingsToFirebase(): void {
    // Clear existing timeout
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }

    // Debounce sync calls (1 second delay)
    this.syncTimeout = setTimeout(async () => {
      if (this.isSyncing) {
        return; // Skip if sync already in progress
      }

      try {
        // Get current user
        const currentUser = authManager.getCurrentUser();
        if (!currentUser) {
          // User not logged in, skip sync
          return;
        }

        this.isSyncing = true;

        // Convert Settings to format compatible with Firebase UserSettings
        // We'll store the full settings object
        // Note: updateUserSettings accepts Partial<UserSettings> but Firebase will accept additional fields
        const firebaseSettings: FirebaseUserSettings = {
          // Map Settings to Firebase format
          displayName: this.settings.displayName,
          personalityLevel: this.settings.personalityLevel,
          theme: this.settings.layout.theme,
          notifications: this.settings.notifications,
          layout: this.settings.layout,
          pro: this.settings.pro,
          community: this.settings.community,
          // Store full settings as JSON for easy retrieval
          fullSettings: this.settings,
        };

        await authManager.updateUserSettings(currentUser.uid, firebaseSettings);
        console.log('✅ Settings synced to Firebase');
      } catch (error) {
        // Don't block UI on sync failure - settings are saved locally
        console.warn('Failed to sync settings to Firebase:', error);
      } finally {
        this.isSyncing = false;
      }
    }, 1000); // 1 second debounce
  }

  /**
   * Load settings from Firebase and merge with local settings
   * Called on login to sync settings across devices
   * Public method for external callers
   */
  async loadSettingsFromFirebase(uid: string): Promise<boolean> {
    try {
      const firebaseSettings = (await authManager.getUserSettings(uid)) as FirebaseUserSettings | null;
      
      if (!firebaseSettings) {
        // No settings in Firebase, keep local settings
        return false;
      }

      // Check if fullSettings exists (new format) or use legacy format
      let firebaseFullSettings: Settings;
      
      if (firebaseSettings.fullSettings) {
        // New format: full settings object stored
        firebaseFullSettings = firebaseSettings.fullSettings;
      } else {
        // Legacy format: individual fields, convert to Settings format
        // This handles backward compatibility with existing Firebase data
        firebaseFullSettings = {
          ...DEFAULT_SETTINGS,
          displayName: firebaseSettings.displayName || DEFAULT_SETTINGS.displayName,
          personalityLevel: (firebaseSettings.personalityLevel as PersonalityLevel) || DEFAULT_SETTINGS.personalityLevel,
          layout: {
            ...DEFAULT_SETTINGS.layout,
            theme: (firebaseSettings.theme as Theme) || DEFAULT_SETTINGS.layout.theme,
            ...(firebaseSettings.layout || {}),
          },
          notifications: {
            ...DEFAULT_SETTINGS.notifications,
            ...(firebaseSettings.notifications || {}),
          },
          pro: {
            ...DEFAULT_SETTINGS.pro,
            ...(firebaseSettings.pro || {}),
          },
          community: {
            ...DEFAULT_SETTINGS.community,
            ...(firebaseSettings.community || {}),
          },
        };
      }

      // Merge Firebase settings with local settings
      // Firebase wins for conflict resolution
      
      // Merge with defaults to handle new settings fields
      const mergedSettings: Settings = {
        ...DEFAULT_SETTINGS,
        ...firebaseFullSettings,
        // Deep merge nested objects
        notifications: {
          ...DEFAULT_SETTINGS.notifications,
          ...firebaseFullSettings.notifications,
        },
        layout: {
          ...DEFAULT_SETTINGS.layout,
          ...firebaseFullSettings.layout,
        },
        pro: {
          ...DEFAULT_SETTINGS.pro,
          ...firebaseFullSettings.pro,
          features: {
            ...DEFAULT_SETTINGS.pro.features,
            ...firebaseFullSettings.pro.features,
          },
        },
        community: {
          ...DEFAULT_SETTINGS.community,
          ...firebaseFullSettings.community,
        },
      };

      // Update local settings
      this.settings = mergedSettings;
      
      // Save merged settings to localStorage
      localStorage.setItem(KEY, JSON.stringify(this.settings));
      
      // Apply theme immediately
      this.applyTheme(this.settings.layout.theme);
      
      // Notify subscribers
      this.notifySubscribers();
      
      console.log('✅ Settings loaded from Firebase');
      return true;
    } catch (error) {
      console.warn('Failed to load settings from Firebase:', error);
      return false;
    }
  }

  private notifySubscribers(): void {
    // ⚠️ REMOVED: flickerDiagnostics logging disabled
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

  updatePersonality(personality: PersonalityName): void {
    this.settings.personality = personality;
    // Clear variant cache so new personality gets fresh variants
    clearVariantCache();
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

  updateDiscoveryLimit(limit: 25 | 50 | 75 | 100): void {
    this.settings.layout.discoveryLimit = limit;
    this.saveSettings();
  }

  updateFollowedTopics(topics: string[]): void {
    this.settings.community.followedTopics = topics;
    this.saveSettings();
  }

  toggleFollowTopic(topicSlug: string): void {
    const current = this.settings.community.followedTopics;
    if (current.includes(topicSlug)) {
      this.settings.community.followedTopics = current.filter(t => t !== topicSlug);
    } else {
      this.settings.community.followedTopics = [...current, topicSlug];
    }
    this.saveSettings();
  }

  updateProStatus(isPro: boolean): void {
    this.settings.pro.isPro = isPro;
    // Update feature flags based on Pro status
    this.settings.pro.features = {
      advancedNotifications: isPro,
      themePacks: isPro,
      socialFeatures: isPro,
      bloopersAccess: isPro,
      extrasAccess: isPro,
    };
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
    // ⚠️ REMOVED: flickerDiagnostics logging disabled
    const unsubscribe = settingsManager.subscribe(() => {
      const newSettings = settingsManager.getSettings();
      // ⚠️ REMOVED: flickerDiagnostics logging disabled
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

// Legacy PERSONALITY_TEXTS removed - now using data/personalities.ts
// The getPersonalityText function is re-exported from data/personalities.ts above
