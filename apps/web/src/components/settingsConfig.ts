/**
 * Process: Settings Configuration
 * Purpose: Central definition of Settings sections used by both desktop and mobile UIs
 * Data Source: Static configuration
 * Update Path: Modify this file to add/remove/reorder sections
 * Dependencies: SettingsPage.tsx, SettingsSheet.tsx
 */

export type SettingsSectionId =
  | 'account'
  | 'notifications'
  | 'display'
  | 'pro'
  | 'data'
  | 'about'
  | 'admin'; // admin is gated

export interface SettingsSectionConfig {
  id: SettingsSectionId;
  label: string;
  icon?: string; // emoji or icon identifier
  isAdminOnly?: boolean;
}

export const SETTINGS_SECTIONS: SettingsSectionConfig[] = [
  { id: 'account', label: 'Account & Profile' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'display', label: 'Display & Layout' },
  { id: 'pro', label: 'Pro' },
  { id: 'data', label: 'Data & Backups' },
  { id: 'about', label: 'About' },
  { id: 'admin', label: 'Admin', isAdminOnly: true },
];

/**
 * Get visible sections for a user (filters out admin-only sections for non-admins)
 */
export function getVisibleSections(isAdmin: boolean): SettingsSectionConfig[] {
  return SETTINGS_SECTIONS.filter(section => {
    if (section.isAdminOnly && !isAdmin) {
      return false;
    }
    return true;
  });
}


