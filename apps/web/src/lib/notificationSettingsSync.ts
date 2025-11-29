/**
 * Process: Notification Settings Sync
 * Purpose: Sync notification settings to/from Firebase for cross-device synchronization
 * Data Source: localStorage (notification-settings) and Firebase (users/{uid}/notificationSettings)
 * Update Path: NotificationManager.saveSettings() → syncNotificationSettingsToFirebase()
 * Dependencies: Firebase Firestore, authManager, notifications.ts
 */

import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebaseBootstrap';
import { authManager } from './auth';
import type { NotificationSettings } from './notifications';

/**
 * Sync notification settings to Firebase
 * Called when notification settings are saved
 */
export async function syncNotificationSettingsToFirebase(settings: NotificationSettings): Promise<void> {
  try {
    const currentUser = authManager.getCurrentUser();
    if (!currentUser) {
      // User not logged in, skip sync
      return;
    }

    // Save to Firebase
    const firebaseDb = db;
    const settingsRef = doc(firebaseDb, 'users', currentUser.uid, 'notificationSettings', 'main');
    
    await setDoc(settingsRef, {
      globalEnabled: settings.globalEnabled,
      freeTierTiming: settings.freeTierTiming,
      proTierTiming: settings.proTierTiming,
      methods: settings.methods,
      showOverrides: settings.showOverrides,
      lastUpdated: new Date().toISOString(),
    }, { merge: true });

    console.log('✅ Synced notification settings to Firebase');
  } catch (error) {
    console.error('❌ Failed to sync notification settings to Firebase:', error);
  }
}

/**
 * Load notification settings from Firebase and merge with local
 * Called on login to sync settings across devices
 */
export async function loadNotificationSettingsFromFirebase(uid: string): Promise<NotificationSettings | null> {
  try {
    const firebaseDb = db;
    const settingsRef = doc(firebaseDb, 'users', uid, 'notificationSettings', 'main');
    const settingsDoc = await getDoc(settingsRef);

    if (!settingsDoc.exists()) {
      console.log('📭 No notification settings found in Firebase');
      return null;
    }

    const cloudSettings = settingsDoc.data();
    
    // Get local settings
    const localSaved = localStorage.getItem('notification-settings');
    let localSettings: NotificationSettings | null = null;
    
    if (localSaved) {
      try {
        localSettings = JSON.parse(localSaved);
      } catch (error) {
        console.warn('⚠️ Failed to parse local notification settings:', error);
      }
    }

    // Merge: Cloud wins for global settings, deep merge for showOverrides
    const mergedSettings: NotificationSettings = {
      globalEnabled: cloudSettings.globalEnabled !== undefined 
        ? cloudSettings.globalEnabled 
        : (localSettings?.globalEnabled ?? true),
      freeTierTiming: cloudSettings.freeTierTiming || localSettings?.freeTierTiming || '24-hours-before',
      proTierTiming: cloudSettings.proTierTiming || localSettings?.proTierTiming || 2,
      methods: {
        inApp: cloudSettings.methods?.inApp !== undefined 
          ? cloudSettings.methods.inApp 
          : (localSettings?.methods?.inApp ?? true),
        push: cloudSettings.methods?.push !== undefined 
          ? cloudSettings.methods.push 
          : (localSettings?.methods?.push ?? false),
        email: cloudSettings.methods?.email !== undefined 
          ? cloudSettings.methods.email 
          : (localSettings?.methods?.email ?? false),
      },
      // Deep merge showOverrides (cloud wins for conflicts)
      showOverrides: {
        ...(localSettings?.showOverrides || {}),
        ...(cloudSettings.showOverrides || {}),
      },
    };

    // Save merged settings to localStorage
    localStorage.setItem('notification-settings', JSON.stringify(mergedSettings));
    
    console.log('✅ Loaded notification settings from Firebase');
    return mergedSettings;
  } catch (error) {
    console.error('❌ Failed to load notification settings from Firebase:', error);
    return null;
  }
}


