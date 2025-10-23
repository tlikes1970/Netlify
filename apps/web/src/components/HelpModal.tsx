import React, { useEffect, useRef } from 'react';

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
  const [activeSection, setActiveSection] = React.useState('getting-started');

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
      
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
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
      if (e.key !== 'Tab') return;

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

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  if (!isOpen) return null;

  const sections = [
    { id: 'getting-started', title: 'Getting Started', icon: '🚀' },
    { id: 'managing-library', title: 'Managing Your Library', icon: '📚' },
    { id: 'pro-features', title: 'Pro Features', icon: '⭐' },
    { id: 'search-discovery', title: 'Search & Discovery', icon: '🔍' },
    { id: 'notifications', title: 'Notifications', icon: '🔔' },
    { id: 'settings-customization', title: 'Settings & Customization', icon: '⚙️' },
    { id: 'troubleshooting', title: 'Troubleshooting', icon: '🔧' },
    { id: 'keyboard-shortcuts', title: 'Keyboard Shortcuts', icon: '⌨️' }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'getting-started':
        return (
          <div className="space-y-3 text-gray-700 dark:text-gray-300">
            <p><strong>Welcome to Flicklet!</strong> Your personal TV and movie tracker.</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Home:</strong> Your dashboard with personalized content recommendations</li>
              <li><strong>Currently Watching:</strong> Track shows you're actively watching</li>
              <li><strong>Want to Watch:</strong> Build your wishlist of shows and movies</li>
              <li><strong>Watched:</strong> Keep track of completed shows and movies</li>
              <li><strong>Discovery:</strong> Find new content based on genres and preferences</li>
            </ul>
          </div>
        );
      case 'managing-library':
        return (
          <div className="space-y-3 text-gray-700 dark:text-gray-300">
            <p><strong>Adding Content:</strong></p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Use the search function to find shows and movies</li>
              <li>Click the "+" button on any card to add to your lists</li>
              <li>Drag and drop cards between lists for quick organization</li>
              <li>Use the "Not Interested" button to hide content you don't want to see</li>
            </ul>
            
            <p><strong>Organizing Lists:</strong></p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Create custom lists for specific themes or genres</li>
              <li>Add personal notes and tags to any item</li>
              <li>Rate shows and movies with our 5-star system</li>
              <li>Track episode progress for ongoing shows</li>
            </ul>
          </div>
        );
      case 'pro-features':
        return (
          <div className="space-y-6 text-gray-700 dark:text-gray-300">
            <div>
              <p><strong>Enhanced Experience:</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Bloopers & Behind-the-Scenes:</strong> Access exclusive content on show cards</li>
                <li><strong>Advanced Notifications:</strong> Customize when and how you're notified about new episodes</li>
                <li><strong>Theme Packs:</strong> Holiday and movie-themed visual experiences</li>
                <li><strong>Social Features:</strong> FlickWord games and trivia challenges</li>
                <li><strong>Episode Tracking:</strong> Detailed progress tracking for ongoing series</li>
              </ul>
            </div>

            {/* Bloopers & Outtakes Detailed Section */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center">
                <span className="text-xl mr-2">🎬</span>
                Bloopers & Outtakes (Pro)
              </h4>
              
              <div className="space-y-4 text-blue-800 dark:text-blue-200">
                <div>
                  <h5 className="font-semibold mb-2">What it is</h5>
                  <p className="text-sm">Flicklet surfaces behind-the-scenes bloopers, outtakes, and gag reels for supported titles.</p>
                </div>

                <div>
                  <h5 className="font-semibold mb-2">How it works</h5>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                    <li>When official bloopers/outtakes are released by the rights holder and permitted for embedding, Flicklet displays them in-app using the provider's official player.</li>
                    <li>If no official bloopers are available, Flicklet curates a short list of off-site videos that meet strict criteria. These open in a new tab and play on the hosting provider's site.</li>
                  </ul>
                </div>

                <div>
                  <h5 className="font-semibold mb-2">Curation criteria (when official assets are unavailable)</h5>
                  <p className="text-sm mb-2">We only surface links that pass all of the following checks:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                    <li><strong>Source authenticity:</strong> posted by an official studio/network/distributor channel, verified creator, or a source with clear permission to publish.</li>
                    <li><strong>Provider policy compliance:</strong> embeddable where permitted; otherwise link-out only. We never rehost, modify, or strip provider branding.</li>
                    <li><strong>Content relevance:</strong> the video is clearly a blooper/outtake/gag reel for the selected title (not general clips, fan edits, or unrelated compilations).</li>
                    <li><strong>Quality bar:</strong> acceptable resolution and audio; no camrips or low-effort reposts.</li>
                    <li><strong>Stability:</strong> not obviously subject to immediate takedown; periodically re-verified.</li>
                  </ul>
                </div>

                <div>
                  <h5 className="font-semibold mb-2">What you'll see</h5>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                    <li><strong>Bloopers tab:</strong> plays official clips in-app when allowed. If not, you'll see a small set of vetted "Watch on [Provider]" links.</li>
                    <li><strong>Extras tab:</strong> trailers, featurettes, interviews, and other official bonus materials when available.</li>
                    <li><strong>No-clip state:</strong> if nothing qualifies, the tab explains that no approved bloopers are available yet.</li>
                  </ul>
                </div>

                <div>
                  <h5 className="font-semibold mb-2">What we won't do</h5>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                    <li>No paywalled streamer embeds (e.g., subscription services).</li>
                    <li>No scraping, downloading, or re-uploading third-party content.</li>
                    <li>No embedding of videos where the provider or uploader has disabled embedding.</li>
                  </ul>
                </div>

                <div className="bg-blue-100 dark:bg-blue-800/30 border border-blue-300 dark:border-blue-700 rounded p-3">
                  <h5 className="font-semibold mb-2">Legal notice</h5>
                  <p className="text-sm">Flicklet indexes metadata and links to third-party content hosted by their respective providers. Availability, quality, and playback are controlled by those providers and may change or be removed at any time.</p>
                </div>

                <div>
                  <h5 className="font-semibold mb-2">Why this benefits you</h5>
                  <p className="text-sm">You get the best available bloopers and outtakes without dealing with broken uploads, shady sources, or copyright headaches. When official clips exist, they're featured first. When they don't, you still get a high-quality, trustworthy path to watch them elsewhere and hop right back to Flicklet.</p>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                <strong>Note:</strong> Pro features are marked with a golden "PRO" badge and may require upgrading your account.
              </p>
            </div>
          </div>
        );
      case 'search-discovery':
        return (
          <div className="space-y-3 text-gray-700 dark:text-gray-300">
            <p><strong>Finding Content:</strong></p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Search by title, actor, director, or genre</li>
              <li>Filter results by type (TV shows, movies, people)</li>
              <li>Browse by genre in the Discovery section</li>
              <li>Get personalized recommendations on the Home page</li>
            </ul>
            
            <p><strong>Smart Recommendations:</strong></p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Based on your watching history and preferences</li>
              <li>Updates automatically as you add more content</li>
              <li>Considers your ratings and viewing patterns</li>
            </ul>
          </div>
        );
      case 'notifications':
        return (
          <div className="space-y-3 text-gray-700 dark:text-gray-300">
            <p><strong>Stay Updated:</strong></p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Episode Alerts:</strong> Get notified when new episodes air</li>
              <li><strong>Weekly Discover:</strong> Receive curated recommendations</li>
              <li><strong>Monthly Stats:</strong> See your viewing statistics and trends</li>
              <li><strong>Custom Timing:</strong> Set how far in advance you want to be notified</li>
            </ul>
            
            <p><strong>Managing Notifications:</strong></p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Enable/disable notifications in Settings</li>
              <li>Set custom notification times for each show</li>
              <li>Choose which lists trigger notifications</li>
            </ul>
          </div>
        );
      case 'settings-customization':
        return (
          <div className="space-y-3 text-gray-700 dark:text-gray-300">
            <p><strong>Personalization:</strong></p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Choose between light and dark themes</li>
              <li>Set your display name and personality level</li>
              <li>Customize your home page layout</li>
              <li>Select your preferred genres for recommendations</li>
            </ul>
            
            <p><strong>Data Management:</strong></p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Your data syncs across devices when signed in</li>
              <li>Export your library for backup purposes</li>
              <li>Import data from other tracking services</li>
            </ul>
          </div>
        );
      case 'troubleshooting':
        return (
          <div className="space-y-3 text-gray-700 dark:text-gray-300">
            <p><strong>Common Issues:</strong></p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Content not loading:</strong> Check your internet connection and try refreshing</li>
              <li><strong>Search not working:</strong> Try different keywords or check your spelling</li>
              <li><strong>Notifications not appearing:</strong> Check your browser's notification permissions</li>
              <li><strong>Data not syncing:</strong> Ensure you're signed in and have a stable connection</li>
            </ul>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                <strong>Need more help?</strong> Use the feedback form in Settings to report issues or suggest improvements.
              </p>
            </div>
          </div>
        );
      case 'keyboard-shortcuts':
        return (
          <div className="space-y-3 text-gray-700 dark:text-gray-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><strong>Navigation:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                  <li><kbd className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Esc</kbd> Close modals</li>
                  <li><kbd className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Tab</kbd> Navigate between elements</li>
                  <li><kbd className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Enter</kbd> Activate buttons/links</li>
                </ul>
              </div>
              <div>
                <p><strong>Search:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                  <li><kbd className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">/</kbd> Focus search bar</li>
                  <li><kbd className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Esc</kbd> Clear search</li>
                </ul>
              </div>
            </div>
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
        className="fixed inset-0 z-[1100] bg-black bg-opacity-50" 
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
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
            <h2 id="help-modal-title" className="text-2xl font-bold text-gray-900 dark:text-white">
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
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
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
                      {sections.find(s => s.id === activeSection)?.icon}
                    </span>
                    {sections.find(s => s.id === activeSection)?.title}
                  </h3>
                </div>
                <div id="help-modal-description">
                  {renderContent()}
                </div>
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
