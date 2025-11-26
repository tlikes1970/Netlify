import React, { useEffect, useRef } from "react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Process: Help Modal
 * Purpose: Provides comprehensive help and guidance for all app features
 * Data Source: Static help content
 * Update Path: Manual content updates
 * Dependencies: Accessibility standards, responsive design
 */

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);
  const [activeSection, setActiveSection] = React.useState("welcome");

  // Focus management
  useEffect(() => {
    if (isOpen && firstFocusableRef.current) {
      firstFocusableRef.current.focus();
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Trap focus within modal
  useEffect(() => {
    if (!isOpen) return;

    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener("keydown", handleTabKey);
    return () => document.removeEventListener("keydown", handleTabKey);
  }, [isOpen]);

  if (!isOpen) return null;

  const sections = [
    { id: "welcome", title: "Welcome to Flicklet", icon: "👋" },
    { id: "getting-started", title: "Getting Started", icon: "🚀" },
    { id: "managing-library", title: "Managing Your Library", icon: "📚" },
    { id: "discovery-search", title: "Discovery & Search", icon: "🔍" },
    { id: "notifications", title: "Notifications", icon: "🔔" },
    {
      id: "settings-customization",
      title: "Settings & Customization",
      icon: "⚙️",
    },
    { id: "pro-features", title: "Pro Features", icon: "⭐" },
    { id: "troubleshooting", title: "Troubleshooting", icon: "🔧" },
    {
      id: "keyboard-shortcuts",
      title: "Keyboard & Gesture Shortcuts",
      icon: "⌨️",
    },
    { id: "accessibility", title: "Accessibility & Support", icon: "♿️" },
    { id: "about", title: "About & Version Info", icon: "ℹ️" },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "welcome":
        return (
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <p>
              Track what you watch, find what's next. We'll help you stay organized.
            </p>
            <p>Here's what you can do:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Save what you're watching now</li>
              <li>Build a wishlist of what's next</li>
              <li>Mark what you've finished</li>
              <li>Get recommendations that fit your taste</li>
            </ul>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              <strong>Pro tip:</strong> Your lists sync across devices when you sign in.
            </p>
          </div>
        );
      case "getting-started":
        return (
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <div>
              <h4 className="font-semibold mb-2">Sign In & Setup</h4>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>
                  Open Flicklet and tap <strong>Sign In</strong> in the top
                  corner.
                </li>
                <li>Choose your Google account (required for sync).</li>
                <li>
                  Once signed in, your lists and settings are stored securely in
                  your account.
                </li>
              </ol>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Navigating the App</h4>
              <p className="mb-2">
                Across the bottom (mobile) or top (desktop), you'll see the main
                sections:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Home:</strong> personalized dashboard and
                  recommendations
                </li>
                <li>
                  <strong>Currently Watching:</strong> everything you're mid-way
                  through
                </li>
                <li>
                  <strong>Want to Watch:</strong> your wishlist of shows and
                  movies
                </li>
                <li>
                  <strong>Watched:</strong> what you've completed
                </li>
                <li>
                  <strong>Discovery:</strong> smart suggestions based on your
                  viewing
                </li>
                <li>
                  <strong>My Lists:</strong> any custom lists you've created
                </li>
                <li>
                  <strong>Settings (⚙️):</strong> your preferences, data, and
                  Pro options
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">
                Adding Your First Show or Movie
              </h4>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>
                  Tap the <strong>Search bar</strong> 🔍 at the top.
                </li>
                <li>Type a title or actor's name.</li>
                <li>
                  Tap the <strong>➕ Add</strong> button on any card to put it
                  in your <em>Want to Watch</em> list.
                </li>
                <li>
                  You can move it to <em>Currently Watching</em> once you start
                  it.
                </li>
              </ol>
            </div>
          </div>
        );
      case "managing-library":
        return (
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <div>
              <h4 className="font-semibold mb-2">Your Lists Explained</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Currently Watching:</strong> active shows and movies
                  you're tracking.
                </li>
                <li>
                  <strong>Want to Watch:</strong> your personal wishlist.
                </li>
                <li>
                  <strong>Watched:</strong> completed items.
                </li>
                <li>
                  <strong>Returning:</strong> shows confirmed for another
                  season.
                </li>
                <li>
                  <strong>My Lists:</strong> fully custom collections (for
                  example, "Holiday Movies" or "Scary Stuff").
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Organizing Content</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Drag and drop items to reorder within a list (desktop).</li>
                <li>
                  On mobile, swipe <strong>right</strong> to mark as{" "}
                  <em>Watched</em> or <strong>left</strong> to move to another
                  list.
                </li>
                <li>
                  Tap the <strong>⋯ (More)</strong> button on any card to see
                  all actions: rate, tag, add notes, view bloopers, etc.
                </li>
                <li>
                  Add notes for your own reminders (e.g., "stopped at episode
                  4").
                </li>
                <li>Use tags to group items ("comedy," "family," "2024").</li>
                <li>Rate items ⭐ 1-5 to improve your recommendations.</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Tracking Episodes</h4>
              <p className="mb-2">If you're watching a TV show:</p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>
                  Tap <strong>Track Episodes</strong> from the overflow menu.
                </li>
                <li>Use the selector to mark what you've seen.</li>
                <li>Flicklet will highlight what's next to watch.</li>
              </ol>
            </div>
          </div>
        );
      case "pro-features":
        return (
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <div>
              <p className="mb-3">
                Free covers the basics. Pro adds more ways to enjoy your watchlist.
              </p>

              <h4 className="font-semibold mb-2">What you get with Pro:</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  🎬 <strong>Bloopers & Outtakes:</strong> watch
                  behind-the-scenes clips from verified sources.
                </li>
                <li>
                  ⏰ <strong>Advanced Notifications:</strong> detailed timing
                  control and per-show alerts.
                </li>
                <li>
                  🧩 <strong>Theme Packs:</strong> change how Flicklet looks for
                  holidays or genres.
                </li>
                <li>
                  🕹️ <strong>FlickWord & Trivia:</strong> light games built into
                  the app.
                </li>
                <li>
                  📺 <strong>Extended Episode Tracking:</strong> detailed season
                  progress for multiple shows.
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">How It Works</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  Look for the gold <strong>PRO</strong> badge on features that
                  need Pro.
                </li>
                <li>
                  Upgrade in <strong>Settings → Pro</strong>.
                </li>
                <li>You can preview what Pro offers before paying.</li>
              </ul>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
                Legal & Content Notes
              </h4>
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                All extra videos or bloopers link directly from verified
                providers. Flicklet doesn't re-upload or host any copyrighted
                material—everything plays from its original source.
              </p>
            </div>
          </div>
        );
      case "discovery-search":
        return (
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <div>
              <h4 className="font-semibold mb-2">Finding New Content</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  Type anything into the Search bar—title, actor, or genre.
                </li>
                <li>
                  Use the filter above the results to limit by{" "}
                  <strong>Movies</strong>, <strong>TV</strong>, or{" "}
                  <strong>People</strong>.
                </li>
                <li>
                  Discovery tab gives you <strong>"For You" rails</strong>
                  —personalized picks based on your ratings and history.
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Tips</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  Use <strong>tag:</strong> search (like{" "}
                  <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-sm">
                    tag:comedy
                  </code>
                  ) to search your own lists.
                </li>
                <li>
                  Discovery shows only refresh when your tastes change—rate or
                  tag more items to improve accuracy.
                </li>
              </ul>
            </div>
          </div>
        );
      case "notifications":
        return (
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <div>
              <h4 className="font-semibold mb-2">What You Can Get</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Episode Alerts:</strong> when new episodes air.
                </li>
                <li>
                  <strong>Weekly Discover:</strong> curated picks sent weekly.
                </li>
                <li>
                  <strong>Monthly Stats:</strong> quick snapshot of your viewing
                  totals.
                </li>
                <li>
                  <strong>Custom Reminders:</strong> set alerts ahead of time.
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">How to Manage</h4>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>
                  Go to <strong>Settings → Notifications</strong>.
                </li>
                <li>Toggle each alert on or off.</li>
                <li>
                  Adjust timing for episode reminders (e.g., 1 hour before).
                </li>
                <li>
                  Make sure your browser or device allows notifications from
                  Flicklet.
                </li>
              </ol>
            </div>

            <div>
              <p className="font-semibold mb-2">
                If you stop receiving alerts, check:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Your browser's permission settings.</li>
                <li>You're still signed in.</li>
                <li>You haven't cleared site data or cookies.</li>
              </ul>
            </div>
          </div>
        );
      case "settings-customization":
        return (
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <div>
              <h4 className="font-semibold mb-2">
                Personalize Your Experience
              </h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  Switch between <strong>Light</strong> and{" "}
                  <strong>Dark</strong> mode.
                </li>
                <li>
                  Change your <strong>display name</strong> (shown in community
                  or Pro features).
                </li>
                <li>
                  Choose your <strong>personality level</strong>—controls the
                  humor tone of messages and empty states.
                </li>
                <li>
                  Pick your favorite genres to shape <em>For You</em>{" "}
                  recommendations.
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Layout Options</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  Toggle <strong>Condensed View</strong> for tighter spacing.
                </li>
                <li>Choose which sections appear on your Home screen.</li>
                <li>
                  Enable or disable <strong>Episode Tracking</strong> here too.
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Data Management</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Export Backup:</strong> download a JSON copy of your
                  data.
                </li>
                <li>
                  <strong>Import Backup:</strong> restore from a saved file.
                </li>
                <li>
                  <strong>Share With Friends:</strong> generate a shareable
                  summary of your lists.
                </li>
                <li>
                  <strong>Reset All Data:</strong> wipes everything back to
                  defaults (careful).
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Privacy & Sync</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  Flicklet only stores minimal data (lists, ratings, notes).
                </li>
                <li>
                  All media data (titles, images) comes from official TMDB
                  sources.
                </li>
                <li>
                  Your info syncs through your Google sign-in only—no external
                  tracking.
                </li>
              </ul>
            </div>
          </div>
        );
      case "troubleshooting":
        return (
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <div>
              <h4 className="font-semibold mb-3">Quick fixes for common issues</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-700">
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold">
                        Problem
                      </th>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold">
                        Try This
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                        App not loading
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                        Refresh the page or check your internet connection
                      </td>
                    </tr>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                        Search gives no results
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                        Try different spelling or switch between Movies/TV
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                        Notifications stopped
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                        Check browser permissions and sign-in status
                      </td>
                    </tr>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                        Lists look empty
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                        Make sure you're logged in; local storage may have
                        cleared
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                        Can't sign in on mobile
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                        Clear browser cache, reopen app, and retry login
                      </td>
                    </tr>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                        Bloopers/Extras not playing
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                        Some videos open externally if embedding is blocked
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
                Still stuck?
              </h4>
              <p className="text-blue-800 dark:text-blue-200 text-sm mb-2">
                <strong>Pro tip:</strong> Go to Settings → Feedback and tell us what happened. The more detail, the faster we can help.
              </p>
            </div>
          </div>
        );
      case "keyboard-shortcuts":
        return (
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <div>
              <h4 className="font-semibold mb-2">Keyboard (Desktop)</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <kbd className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">
                    Esc
                  </kbd>{" "}
                  close modals or exit search
                </li>
                <li>
                  <kbd className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">
                    Tab
                  </kbd>{" "}
                  move between fields or buttons
                </li>
                <li>
                  <kbd className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">
                    Enter
                  </kbd>{" "}
                  activate selected button
                </li>
                <li>
                  <kbd className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">
                    /
                  </kbd>{" "}
                  jump to search
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Touch (Mobile)</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Swipe right:</strong> mark as Watched
                </li>
                <li>
                  <strong>Swipe left:</strong> move to another list
                </li>
                <li>
                  <strong>Pull down:</strong> refresh content
                </li>
                <li>
                  <strong>Tap and hold:</strong> reorder (on supported lists)
                </li>
              </ul>
            </div>
          </div>
        );
      case "accessibility":
        return (
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Fully navigable by keyboard</li>
              <li>Screen reader friendly structure</li>
              <li>Focus trapping ensures you don't lose cursor position</li>
              <li>ARIA roles and labels implemented in all modals</li>
              <li>Contrast and font-size compliant with WCAG guidelines</li>
            </ul>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                For help with accessibility or other feedback, contact support
                via the Feedback form in Settings.
              </p>
            </div>
          </div>
        );
      case "about":
        return (
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>App Version:</strong> Flicklet v2
              </li>
              <li>
                <strong>Last Updated:</strong> shown at the bottom of the Help
                modal
              </li>
              <li>
                <strong>Component:</strong>{" "}
                <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-sm">
                  apps/web/src/components/HelpModal.tsx
                </code>
              </li>
              <li>
                <strong>Feature Flags:</strong> Help content is static—visible
                to everyone.
              </li>
            </ul>
          </div>
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-overlay bg-black bg-opacity-50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
        <div
          ref={modalRef}
          className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="help-modal-title"
          aria-describedby="help-modal-description"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2
              id="help-modal-title"
              className="text-2xl font-bold text-gray-900 dark:text-white"
            >
              Help & Support
            </h2>
            <button
              ref={firstFocusableRef}
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-3xl font-bold p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close help modal"
            >
              ×
            </button>
          </div>

          {/* Two-column layout */}
          <div className="flex h-[calc(90vh-120px)]">
            {/* Left sidebar - Navigation */}
            <div className="w-64 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
              <nav className="p-4 space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeSection === section.id
                        ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <span className="mr-2">{section.icon}</span>
                    {section.title}
                  </button>
                ))}
              </nav>
            </div>

            {/* Right content area */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                    <span className="text-2xl mr-3">
                      {sections.find((s) => s.id === activeSection)?.icon}
                    </span>
                    {sections.find((s) => s.id === activeSection)?.title}
                  </h3>
                </div>
                <div id="help-modal-description">{renderContent()}</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Flicklet v2 • Last updated: {new Date().toLocaleDateString()}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
