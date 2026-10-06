import { t, useLanguage } from "@/lib/language";
import React, { useState, useEffect, useRef } from "react";
import {
  getInsightsForTitle,
  subscribeToInsights,
  InsightsSet,
} from "../../lib/insights/insightsStore";
import { useEntitlements } from "../../hooks/useEntitlements";
import { UpgradeToProCTA } from "../UpgradeToProCTA";

interface ShowsLikeThisModalProps {
  isOpen: boolean;
  onClose: () => void;
  tmdbId: number | string | null;
  title?: string;
}

/** Shows Like This displays existing localized observations from Firestore, cache and seed fallback. */

export const ShowsLikeThisModal: React.FC<ShowsLikeThisModalProps> = ({
  isOpen,
  onClose,
  tmdbId,
  title,
}) => {
  console.log("🎭 ShowsLikeThisModal render:", { isOpen, tmdbId, title });

  const language = useLanguage();
  const { hasFullAccess } = useEntitlements();

  const [insights, setInsights] = useState<InsightsSet | null>(null);
  const [loading, setLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInsightRef = useRef<HTMLDivElement>(null);

  // Load insights when modal opens
  useEffect(() => {
    if (!isOpen || !tmdbId) {
      setInsights(null);
      return;
    }

    if (!hasFullAccess) {
      return;
    }

    if (import.meta.env.DEV) {
      console.log(`🎭 ShowsLikeThisModal: Loading insights for TMDB ID ${tmdbId}`);
    }

    setLoading(true);
    setInsights(null);
    let current = true;

    // Use subscribe for real-time updates (though currently just reads from cache)
    const unsubscribe = subscribeToInsights(tmdbId, (insightsSet) => {
      if (!current) return;
      if (import.meta.env.DEV) {
        console.log(
          `🎭 ShowsLikeThisModal: Subscription callback received:`,
          insightsSet ? `${insightsSet.items.length} items` : "null"
        );
      }
      setInsights(insightsSet);
      setLoading(false);
    });

    // Fallback: also try direct fetch
    getInsightsForTitle(tmdbId, language).then((insightsSet) => {
      if (!current) return;
      if (import.meta.env.DEV) {
        console.log(
          `🎭 ShowsLikeThisModal: Direct fetch result:`,
          insightsSet ? `${insightsSet.items.length} items` : "null"
        );
      }
      if (insightsSet) {
        setInsights(insightsSet);
      }
      setLoading(false);
    });

    return () => {
      current = false;
      unsubscribe();
    };
  }, [isOpen, tmdbId, hasFullAccess, language]);

  // Focus management
  useEffect(() => {
    if (isOpen && firstInsightRef.current) {
      firstInsightRef.current.focus();
    }
  }, [isOpen, insights]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "Tab") {
        // Focus trap - let browser handle tab navigation within modal
        const modal = modalRef.current;
        if (modal) {
          const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[
            focusableElements.length - 1
          ] as HTMLElement;

          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const getTypeLabel = (type: InsightsSet["items"][0]["type"]): string => {
    const labels: Record<string, string> = {
      continuity: t("contentContinuity"),
      prop: t("contentProp"),
      crew: t("contentCrewVisible"),
      logic: t("contentLogic"),
      style: t("contentStyle"),
      world: t("contentWorldBuilding"),
      other: t("contentOther"),
    };
    return labels[type] || type;
  };

  const getKindLabel = (kind?: string): string => {
    if (!kind) return "";
    const labels: Record<string, string> = {
      insight: t("contentInsight"),
      easterEgg: t("contentEasterEgg"),
      pattern: t("contentPattern"),
    };
    return labels[kind] || kind;
  };

  const getTypeColor = (type: InsightsSet["items"][0]["type"]): string => {
    const colors: Record<string, string> = {
      continuity:
        "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
      prop: "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200",
      crew: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
      logic: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
      style:
        "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
      world:
        "bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200",
      other: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200",
    };
    return colors[type] || colors.other;
  };

  const renderInsightsContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">
            {t("contentLoadingInsights")}
          </span>
        </div>
      );
    }

    if (!insights || insights.items.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400 mb-4">
            <h3 className="text-lg font-medium mb-2">{t("contentNoInsightsFound")}</h3>
            <p className="text-sm">
              {t("contentWeDonTHaveAnyInsightsForThisOneYetTheyLlAppearHereAsWeExpandFullAccessExtras")}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {insights.items.map((insight, index) => (
          <div
            key={insight.id}
            ref={index === 0 ? firstInsightRef : null}
            className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
            tabIndex={0}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2 flex-wrap gap-1">
                {insight.kind && (
                  <span className="text-xs px-2 py-1 rounded font-medium bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200">
                    {getKindLabel(insight.kind)}
                  </span>
                )}
                <span
                  className={`text-xs px-2 py-1 rounded font-medium ${getTypeColor(insight.type)}`}
                >
                  {getTypeLabel(insight.type)}
                </span>
                {insight.subtlety && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {insight.subtlety === "blink"
                      ? t("contentEasyToMiss")
                      : t("contentObvious")}
                  </span>
                )}
              </div>
            </div>
            <p className="text-sm break-words text-gray-900 dark:text-white leading-relaxed">
              {language === "es" && insight.textLanguage !== "es" && <span className="block text-xs mb-1">{t(insight.textLanguage === "en" ? "contentSourceTextInEnglish" : "contentOriginalSourceText")}</span>}
              {insight.text}
            </p>
          </div>
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black bg-opacity-50"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          ref={modalRef}
          className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-3xl max-h-[75dvh] overflow-hidden flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-labelledby="insights-modal-title"
          aria-describedby="insights-modal-description"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
            <h2
              id="insights-modal-title"
              className="min-w-0 break-words text-xl font-semibold text-gray-900 dark:text-white"
            >
              {title ? `${title} - ${t("coreShowsLikeThis")}` : t("coreShowsLikeThis")}
            </h2>
            <button
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
              aria-label={t("contentCloseModal")}
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div
            id="insights-modal-description"
            className="p-4 overflow-y-auto min-h-0 flex-1"
          >
            {!hasFullAccess ? (
              <UpgradeToProCTA variant="panel" message={t("accessSimilarTrial")} />
            ) : (
              renderInsightsContent()
            )}
          </div>
        </div>
      </div>
    </>
  );
};
