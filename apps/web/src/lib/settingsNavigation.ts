/**
 * Process: Settings Navigation Helper
 * Purpose: Centralized function to open Settings at a specific section for both desktop and mobile
 * Data Source: Settings view state and section configuration
 * Update Path: Modify this file to change how Settings navigation works
 * Dependencies: SettingsPage.tsx, SettingsSheet.tsx, settingsConfig.ts
 */

import { openSettingsSheet } from "@/components/settings/SettingsSheet";
import type { SettingsSectionId } from "@/components/settingsConfig";
import { flag } from "@/lib/flags";
import { isCompactMobileV1 } from "@/lib/mobileFlags";
import { useEffect, useState } from "react";

/** Viewport width at or below this uses the mobile Settings sheet when that flag is on. */
export const MOBILE_SETTINGS_BREAKPOINT = 744;

/**
 * Determines if mobile settings should be used based on viewport and feature flags.
 */
export function shouldUseMobileSettings(): boolean {
  if (typeof window === "undefined") return false;

  const width = window.innerWidth;
  const isCompact = isCompactMobileV1 ? isCompactMobileV1() : false;
  const flagEnabled = flag ? flag("settings_mobile_sheet_v1") : true;

  if (!flagEnabled) return false;
  if (width <= MOBILE_SETTINGS_BREAKPOINT) return true;
  if (isCompact) return true;

  return false;
}

/** Subscribe to the same Settings-shell breakpoint used at open time. */
export function useShouldUseMobileSettings(): boolean {
  const [mobile, setMobile] = useState(shouldUseMobileSettings);

  useEffect(() => {
    const update = () => setMobile(shouldUseMobileSettings());
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    window.visualViewport?.addEventListener("resize", update);
    update();
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, []);

  return mobile;
}

/**
 * Opens Settings at a specific section.
 * Works for both desktop (SettingsPage) and mobile (SettingsSheet).
 * 
 * @param section - The Settings section ID to open (e.g., "display", "pro", "account")
 * @param setShowSettings - Optional callback to show Settings on desktop (from App.tsx)
 */
export function openSettingsAtSection(
  section: SettingsSectionId,
  setShowSettings?: (show: boolean) => void
): void {
  if (shouldUseMobileSettings()) {
    // Mobile: Use SettingsSheet
    openSettingsSheet(section);
  } else {
    // Desktop: Open SettingsPage and navigate to section
    if (setShowSettings) {
      setShowSettings(true);
    }
    
    // Dispatch event to navigate to section (SettingsPage listens for this)
    // Use a small delay to ensure SettingsPage is mounted
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("navigate-to-settings-section", {
          detail: { sectionId: section },
        })
      );
    }, 100);
  }
}

