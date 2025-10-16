export interface NotificationSettings {
  // Global settings
  globalEnabled: boolean;
  
  // Free Tier - Vague timing
  freeTierTiming: '24-hours-before' | '7-days-before';
  
  // Pro Tier - Precise timing (hours before episode airs)
  proTierTiming: number; // 1-24 hours
  
  // Notification methods
  methods: {
    inApp: boolean;
    push: boolean;
    email: boolean; // Pro only
  };
  
  // Per-show overrides
  showOverrides: Record<string, ShowNotificationSettings>;
}

export interface ShowNotificationSettings {
  enabled: boolean;
  timing?: number; // Override global timing (Pro only)
  methods?: {
    inApp?: boolean;
    push?: boolean;
    email?: boolean;
  };
}

export interface NotificationLogEntry {
  id: string;
  showId: number;
  showName: string;
  episodeTitle: string;
  airDate: string;
  notificationTime: string;
  method: 'in-app' | 'push' | 'email';
  status: 'sent' | 'delivered' | 'failed' | 'read';
  userId?: string;
}

export interface UpcomingEpisode {
  showId: number;
  showName: string;
  seasonNumber: number;
  episodeNumber: number;
  episodeTitle: string;
  airDate: string;
  posterUrl?: string;
}

class NotificationManager {
  private settings: NotificationSettings;
  private log: NotificationLogEntry[] = [];

  constructor() {
    this.settings = this.loadSettings();
    this.log = this.loadLog();
  }

  // Settings Management
  loadSettings(): NotificationSettings {
    try {
      const saved = localStorage.getItem('notification-settings');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
    
    // Default settings
    return {
      globalEnabled: true,
      freeTierTiming: '24-hours-before',
      proTierTiming: 2, // 2 hours before
      methods: {
        inApp: true,
        push: false,
        email: false,
      },
      showOverrides: {},
    };
  }

  saveSettings(): void {
    try {
      localStorage.setItem('notification-settings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    }
  }

  updateSettings(updates: Partial<NotificationSettings>): void {
    this.settings = { ...this.settings, ...updates };
    this.saveSettings();
  }

  // Show-specific settings
  updateShowSettings(showId: number, settings: ShowNotificationSettings): void {
    this.settings.showOverrides[showId.toString()] = settings;
    this.saveSettings();
  }

  getShowSettings(showId: number): ShowNotificationSettings {
    return this.settings.showOverrides[showId.toString()] || {
      enabled: true,
    };
  }

  // Notification Log
  loadLog(): NotificationLogEntry[] {
    try {
      const saved = localStorage.getItem('notification-log');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load notification log:', error);
      return [];
    }
  }

  saveLog(): void {
    try {
      localStorage.setItem('notification-log', JSON.stringify(this.log));
    } catch (error) {
      console.error('Failed to save notification log:', error);
    }
  }

  addLogEntry(entry: Omit<NotificationLogEntry, 'id'>): void {
    const newEntry: NotificationLogEntry = {
      ...entry,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    this.log.unshift(newEntry); // Add to beginning
    
    // Keep only last 100 entries
    if (this.log.length > 100) {
      this.log = this.log.slice(0, 100);
    }
    
    this.saveLog();
  }

  getLog(): NotificationLogEntry[] {
    return this.log;
  }

  markAsRead(entryId: string): void {
    const entry = this.log.find(e => e.id === entryId);
    if (entry) {
      entry.status = 'read';
      this.saveLog();
    }
  }

  // Notification Methods
  async requestPushPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  async sendInAppNotification(episode: UpcomingEpisode): Promise<void> {
    // This will be handled by the UI component
    console.log('In-app notification:', episode);
  }

  async sendPushNotification(episode: UpcomingEpisode): Promise<void> {
    if (!this.settings.methods.push) return;

    const permission = await this.requestPushPermission();
    if (!permission) return;

    const notification = new Notification(
      `${episode.showName} - New Episode!`,
      {
        body: `S${episode.seasonNumber}E${episode.episodeNumber}: ${episode.episodeTitle}`,
        icon: episode.posterUrl || '/icons/icon-192.png',
        tag: `episode-${episode.showId}-${episode.seasonNumber}-${episode.episodeNumber}`,
        requireInteraction: true,
      }
    );

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }

  async sendEmailNotification(episode: UpcomingEpisode, userEmail: string): Promise<void> {
    if (!this.settings.methods.email) return;

    console.log('🔔 Attempting to send email notification:', { episode, userEmail });

    try {
      const response = await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: userEmail,
          templateId: 'd-22144b9bf8d74fe0bec75f0a430ede9a',
          dynamicTemplateData: {
            userName: 'Flicklet User', // TODO: Get actual user name
            message: `New episode of ${episode.showName} is airing!`,
            showName: episode.showName,
            episodeTitle: episode.episodeTitle,
            seasonNumber: episode.seasonNumber,
            episodeNumber: episode.episodeNumber,
            airDate: episode.airDate,
          },
          subject: `🎬 New Episode: ${episode.showName} S${episode.seasonNumber}E${episode.episodeNumber}`,
        }),
      });

      console.log('🔔 Email notification response:', response.status, response.statusText);

      if (response.status !== 202) {
        const errorText = await response.text();
        console.error('🔔 Email notification failed:', errorText);
        throw new Error(`Failed to send email notification: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('🔔 Email notification sent successfully:', result);
    } catch (error) {
      console.error('🔔 Email notification failed:', error);
      throw error;
    }
  }

  // Main notification method
  async sendNotification(episode: UpcomingEpisode, userEmail?: string): Promise<void> {
    const showSettings = this.getShowSettings(episode.showId);
    
    if (!this.settings.globalEnabled || !showSettings.enabled) {
      return;
    }

    const promises: Promise<void>[] = [];

    // Send in-app notification
    if (this.settings.methods.inApp && showSettings.methods?.inApp !== false) {
      promises.push(this.sendInAppNotification(episode));
    }

    // Send push notification
    if (this.settings.methods.push && showSettings.methods?.push !== false) {
      promises.push(this.sendPushNotification(episode));
    }

    // Send email notification (Pro only)
    if (this.settings.methods.email && showSettings.methods?.email !== false && userEmail) {
      promises.push(this.sendEmailNotification(episode, userEmail));
    }

    // Execute all notifications
    try {
      await Promise.allSettled(promises);
      
      // Log the notification
      this.addLogEntry({
        showId: episode.showId,
        showName: episode.showName,
        episodeTitle: episode.episodeTitle,
        airDate: episode.airDate,
        notificationTime: new Date().toISOString(),
        method: 'in-app', // Primary method
        status: 'sent',
      });
    } catch (error) {
      console.error('Notification failed:', error);
      
      // Log the failure
      this.addLogEntry({
        showId: episode.showId,
        showName: episode.showName,
        episodeTitle: episode.episodeTitle,
        airDate: episode.airDate,
        notificationTime: new Date().toISOString(),
        method: 'in-app',
        status: 'failed',
      });
    }
  }

  // Test function to send a test notification
  async sendTestNotification(userEmail: string): Promise<void> {
    console.log('🧪 Sending test notification to:', userEmail);
    
    try {
      const response = await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: userEmail,
          templateId: 'd-22144b9bf8d74fe0bec75f0a430ede9a',
          dynamicTemplateData: {
            userName: 'Flicklet User',
            message: 'This is a test notification email.',
          },
          subject: 'Flicklet Test Email',
        }),
      });

      if (response.status !== 202) {
        const errorText = await response.text();
        throw new Error(`Test email failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      console.log('🧪 Test notification sent successfully');
    } catch (error) {
      console.error('🧪 Test notification failed:', error);
      throw error;
    }
  }

  // Utility methods
  getSettings(): NotificationSettings {
    return this.settings;
  }

  isProUser(): boolean {
    // This should check against your Pro user system
    // For now, return false - implement based on your auth system
    return false;
  }

  getAvailableTimingOptions(): Array<{ value: string; label: string; proOnly?: boolean }> {
    const options: Array<{ value: string; label: string; proOnly?: boolean }> = [
      { value: '24-hours-before', label: '24 hours before' },
      { value: '7-days-before', label: '7 days before' },
    ];

    if (this.isProUser()) {
      // Add precise timing options for Pro users
      for (let hours = 1; hours <= 24; hours++) {
        options.push({
          value: hours.toString(),
          label: `${hours} hour${hours !== 1 ? 's' : ''} before`,
          proOnly: true,
        });
      }
    }

    return options;
  }
}

// Export singleton instance
export const notificationManager = new NotificationManager();


