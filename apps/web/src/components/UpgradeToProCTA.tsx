/**
 * Process: Unified Upgrade CTA Component
 * Purpose: Single reusable component for all "Upgrade to Pro" prompts across Settings
 * Data Source: Pro status from useProStatus hook
 * Update Path: Modify this component to change upgrade messaging/visuals globally
 * Dependencies: proUpgrade.ts, proStatus.ts
 */

import { useEntitlements } from "../hooks/useEntitlements";
import { startProUpgrade } from "../lib/proUpgrade";

export type UpgradeCTAVariant = 'banner' | 'panel' | 'inline' | 'button';

export interface UpgradeToProCTAProps {
  variant?: UpgradeCTAVariant;
  message?: string; // Optional custom message
  showIcon?: boolean; // Show 💎 icon (default: true for banner/panel)
  className?: string;
}

/**
 * Unified Upgrade to Pro CTA component
 * 
 * Variants:
 * - 'banner': Small banner with icon and text link (used in NotificationsSection)
 * - 'panel': Larger panel with icon, heading, description, and button (used in NotificationSettings modal)
 * - 'inline': Inline text link (used in DisplaySection)
 * - 'button': Button-only style (used in ProSection)
 */
export function UpgradeToProCTA({
  variant = 'banner',
  message,
  showIcon,
  className = '',
}: UpgradeToProCTAProps) {
  const entitlements = useEntitlements();

  // Paid Pro or active full-access trial — no upgrade nag
  if (entitlements.paidPro || entitlements.hasFullAccess) {
    return null;
  }

  const defaultMessages = {
    banner: entitlements.isReadOnlyMode
      ? 'Your trial has ended. Upgrade to keep editing, or export your library anytime.'
      : 'Start your 21-day full access trial, or upgrade to keep access after trial.',
    panel: entitlements.isReadOnlyMode
      ? 'Trial ended — upgrade for full access or export your data from Settings.'
      : '21-day full access trial — explore the complete app before deciding to support Flicklet.',
    inline: entitlements.isReadOnlyMode ? 'Upgrade to keep editing' : 'Upgrade to Pro',
    button: entitlements.isReadOnlyMode ? 'Upgrade to keep full access' : 'Upgrade to Pro',
  };

  const displayMessage = message || defaultMessages[variant];
  const shouldShowIcon = showIcon !== undefined ? showIcon : variant === 'banner' || variant === 'panel';

  switch (variant) {
    case 'banner':
      return (
        <div
          className={`p-3 rounded-lg border text-sm ${className}`}
          style={{
            backgroundColor: "var(--btn)",
            borderColor: "var(--accent)",
          }}
        >
          <div className="flex items-center gap-2">
            {shouldShowIcon && <span>💎</span>}
            <span style={{ color: "var(--muted)" }}>
              {displayMessage}{" "}
              <button
                onClick={startProUpgrade}
                className="underline font-medium"
                style={{ color: "var(--accent)" }}
              >
                Learn more
              </button>
            </span>
          </div>
        </div>
      );

    case 'panel':
      return (
        <div className={`p-4 rounded-lg border ${className}`} style={{ backgroundColor: 'var(--btn)', borderColor: 'var(--line)' }}>
          <div className="flex items-center gap-3">
            {shouldShowIcon && <div className="text-2xl">💎</div>}
            <div className="flex-1">
              <h4 className="font-semibold">Upgrade to Pro</h4>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                {displayMessage}
              </p>
            </div>
            <button 
              onClick={startProUpgrade}
              className="px-4 py-2 rounded text-sm font-medium transition-colors"
              style={{ backgroundColor: 'var(--accent)', color: 'white' }}>
              Upgrade
            </button>
          </div>
        </div>
      );

    case 'inline':
      return (
        <button
          onClick={startProUpgrade}
          className={`underline ${className}`}
          style={{ color: "var(--accent)" }}
        >
          {displayMessage}
        </button>
      );

    case 'button':
      return (
        <button
          onClick={startProUpgrade}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${className}`}
          style={{ backgroundColor: "var(--accent)", color: "white" }}
        >
          {displayMessage}
        </button>
      );

    default:
      return null;
  }
}




