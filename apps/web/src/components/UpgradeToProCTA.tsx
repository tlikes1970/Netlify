import { t, useLanguage } from "../lib/language";
/**
 * Process: Unified Upgrade CTA Component
 * Purpose: Single reusable component for all "Upgrade to Pro" prompts across Settings
 * Data Source: Pro status from useProStatus hook
 * Update Path: Modify this component to change upgrade messaging/visuals globally
 * Dependencies: proUpgrade.ts, proStatus.ts
 */

import { useEntitlements } from "../hooks/useEntitlements";
import { startProUpgrade, isAndroidBillingAvailable } from "../lib/proUpgrade";

export type UpgradeCTAVariant = "banner" | "panel" | "inline" | "button";

export interface UpgradeToProCTAProps {
  variant?: UpgradeCTAVariant;
  message?: string; // Optional custom message
  showIcon?: boolean; // Show 💎 icon (default: true for banner/panel)
  className?: string;
  disabled?: boolean;
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
  variant = "banner",
  message,
  showIcon,
  className = "",
  disabled = false,
}: UpgradeToProCTAProps) {
  useLanguage();
  const entitlements = useEntitlements();

  // Purchased accounts need no purchase CTA; Android trials may purchase early.
  if (entitlements.paidPro || !isAndroidBillingAvailable()) {
    return null;
  }

  const defaultMessages = {
    banner: entitlements.isReadOnlyMode
      ? t("accessReadOnly")
      : t("accessBanner"),
    panel: entitlements.isReadOnlyMode
      ? `${t("accessReadOnly")} ${t("accessExplainer")}`
      : t("accessPanel"),
    inline: t("accessUnlock"),
    button: t("accessUnlock"),
  };

  const displayMessage = message || defaultMessages[variant];
  const shouldShowIcon =
    showIcon !== undefined
      ? showIcon
      : variant === "banner" || variant === "panel";

  switch (variant) {
    case "banner":
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
                onClick={() => {
                  void startProUpgrade().catch(() => undefined);
                }}
                className="underline font-medium"
                style={{ color: "var(--accent)" }}
              >
                {t("accessLearn")}
              </button>
            </span>
          </div>
        </div>
      );

    case "panel":
      return (
        <div
          className={`p-4 rounded-lg border ${className}`}
          style={{ backgroundColor: "var(--btn)", borderColor: "var(--line)" }}
        >
          <div className="flex flex-wrap items-center gap-3">
            {shouldShowIcon && <div className="text-2xl">💎</div>}
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold">{t("accessUnlock")}</h4>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                {displayMessage}
              </p>
            </div>
            <button
              onClick={() => {
                void startProUpgrade().catch(() => undefined);
              }}
              className="px-4 py-2 rounded text-sm font-medium transition-colors"
              style={{ backgroundColor: "var(--accent)", color: "white" }}
            >
              {t("accessUnlockShort")}
            </button>
          </div>
        </div>
      );

    case "inline":
      return (
        <button
          onClick={() => {
            void startProUpgrade().catch(() => undefined);
          }}
          className={`underline ${className}`}
          style={{ color: "var(--accent)" }}
        >
          {displayMessage}
        </button>
      );

    case "button":
      return (
        <button
          onClick={() => {
            void startProUpgrade().catch(() => undefined);
          }}
          disabled={disabled}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${className}`}
          style={{
            backgroundColor: "var(--accent)",
            color: "white",
            opacity: disabled ? 0.6 : 1,
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        >
          {displayMessage}
        </button>
      );

    default:
      return null;
  }
}
