import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { useFocusTrap } from '../../lib/a11y/useFocusTrap';
import { useInertOutside } from '../../lib/a11y/useInertOutside';
import { SETTINGS_SECTIONS, getVisibleSections, type SettingsSectionId } from '../settingsConfig';
import { renderSettingsSection } from '../settingsSections';
import { useAdminRole } from '../../hooks/useAdminRole';
import { isMobileNow } from '../../lib/isMobile';
import NotInterestedModal from '../modals/NotInterestedModal';

// Lazy load heavy notification modals
const NotificationSettings = lazy(() =>
  import('../modals/NotificationSettings').then((m) => ({
    default: m.NotificationSettings,
  }))
);
const NotificationCenter = lazy(() =>
  import('../modals/NotificationCenter').then((m) => ({
    default: m.NotificationCenter,
  }))
);


function applyOpen(open: boolean) {
  const html = document.documentElement;
  if (open) {
    html.setAttribute('data-settings-sheet', 'true');
    document.body.style.overflow = 'hidden';
  } else {
    html.removeAttribute('data-settings-sheet');
    document.body.style.overflow = '';
  }
}

export function openSettingsSheet(initial?: SettingsSectionId) {
  console.log('🔧 openSettingsSheet called', { initial });
  if (initial) {
    const target = `#settings/${initial}`;
    if (location.hash !== target) history.replaceState(null, '', target);
  }
  applyOpen(true);
  const event = new CustomEvent('settings:open', { detail: { initialSection: initial } });
  console.log('🔧 Dispatching settings:open event', event);
  window.dispatchEvent(event);
}

export function closeSettingsSheet() {
  applyOpen(false);
  // Clear hash completely when closing
  if (location.hash.startsWith('#settings/')) {
    history.replaceState(null, '', location.pathname + location.search);
  }
  window.dispatchEvent(new Event('settings:close'));
}

// Set up global event listener immediately (before component mounts)
if (typeof window !== 'undefined') {
  // Store the setState function in a way that can be accessed globally
  let globalSetOpen: ((open: boolean) => void) | null = null;
  let globalSetActiveSection: ((section: SettingsSectionId | null) => void) | null = null;
  
  window.addEventListener('settings:open', ((e: CustomEvent<{ initialSection?: SettingsSectionId }>) => {
    console.log('🔧 Global settings:open listener called', e);
    if (globalSetOpen) {
      console.log('🔧 Global listener: Setting open to true');
      globalSetOpen(true);
      if (globalSetActiveSection) {
        globalSetActiveSection(e.detail?.initialSection || null);
      }
    } else {
      console.log('🔧 Global listener: Component not mounted yet, setting DOM attribute');
      applyOpen(true);
    }
  }) as EventListener);
  
  window.addEventListener('settings:close', () => {
    console.log('🔧 Global settings:close listener called');
    if (globalSetOpen) {
      globalSetOpen(false);
      if (globalSetActiveSection) {
        globalSetActiveSection(null);
      }
    } else {
      applyOpen(false);
    }
  });
  
  // Export functions to set the state setters
  (window as any).__settingsSheetSetOpen = (setter: (open: boolean) => void) => {
    globalSetOpen = setter;
  };
  (window as any).__settingsSheetSetActiveSection = (setter: (section: SettingsSectionId | null) => void) => {
    globalSetActiveSection = setter;
  };
}

export default function SettingsSheet() {
  console.log('🔧 SettingsSheet component rendering - component function called');
  const [open, setOpen] = useState<boolean>(() => {
    if (typeof document === 'undefined') {
      console.log('🔧 SettingsSheet: document undefined in initial state');
      return false;
    }
    const isOpen = document.documentElement.getAttribute('data-settings-sheet') === 'true';
    console.log('🔧 SettingsSheet initial state from DOM:', isOpen);
    return isOpen;
  });
  console.log('🔧 SettingsSheet current open state:', open);
  
  // Register state setters globally and check initial state
  useEffect(() => {
    console.log('🔧 SettingsSheet: Registering state setters');
    if (typeof window !== 'undefined') {
      (window as any).__settingsSheetSetOpen?.(setOpen);
      
      // Check if we should be open (in case DOM attribute was set before mount)
      const shouldBeOpen = document.documentElement.getAttribute('data-settings-sheet') === 'true';
      if (shouldBeOpen && !open) {
        console.log('🔧 SettingsSheet: Found open state on mount, updating');
        setOpen(true);
      }
      
      return () => {
        (window as any).__settingsSheetSetOpen?.(null);
      };
    }
  }, [open]);
  const [activeSection, setActiveSection] = useState<SettingsSectionId | null>(null);
  
  // Register activeSection setter globally
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__settingsSheetSetActiveSection?.(setActiveSection);
      return () => {
        (window as any).__settingsSheetSetActiveSection?.(null);
      };
    }
  }, []);
  const [showNotInterestedModal, setShowNotInterestedModal] = useState(false);
  const [showSharingModal, setShowSharingModal] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  
  const { isAdmin } = useAdminRole();
  const visibleSections = getVisibleSections(isAdmin);
  
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const firstFocusable = useRef<HTMLButtonElement | null>(null);

  // Prevent background scroll with layout stabilization
  useEffect(() => {
    if (!open) return;
    const doc = document.documentElement;
    const prevOverflow = doc.style.overflow;
    const prevPadRight = doc.style.paddingRight;

    const scw = window.innerWidth - doc.clientWidth;
    doc.style.overflow = 'hidden';
    if (scw > 0) doc.style.paddingRight = `${scw}px`;

    return () => { 
      doc.style.overflow = prevOverflow; 
      doc.style.paddingRight = prevPadRight; 
    };
  }, [open]);

  // Focus trap + Escape handling
  useEffect(() => {
    if (!open) return;
    const el = dialogRef.current;
    if (!el) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeSettingsSheet();
      }
    }
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, [open]);

  // Focus trap
  useFocusTrap(dialogRef.current, !!open, '[role="tab"][aria-selected="true"]');

  // Hide rest of app from screen readers
  useInertOutside(dialogRef.current, !!open);

  // iOS soft keyboard: keep inputs visible
  useEffect(() => {
    if (!open || !('visualViewport' in window)) return;
    const vv = window.visualViewport!;
    const body = bodyRef.current;
    if (!body) return;

    const onResize = () => {
      // add bottom padding equal to the occluded area
      const occluded = Math.max(0, (window.innerHeight - vv.height - vv.offsetTop));
      body.style.paddingBottom = occluded ? `${occluded + 16}px` : '';
    };
    vv.addEventListener('resize', onResize);
    vv.addEventListener('scroll', onResize);
    onResize();
    return () => {
      vv.removeEventListener('resize', onResize);
      vv.removeEventListener('scroll', onResize);
      if (body) body.style.paddingBottom = '';
    };
  }, [open]);

  // Sync with custom events - run once on mount
  useEffect(() => {
    console.log('🔧 SettingsSheet: useEffect for event listeners running');
    function handleOpen(e: Event) {
      console.log('🔧 SettingsSheet: handleOpen called', e);
      const customEvent = e as CustomEvent<{ initialSection?: SettingsSectionId }>;
      console.log('🔧 SettingsSheet: Setting open to true');
      setOpen(true);
      applyOpen(true);
      if (customEvent.detail?.initialSection) {
        setActiveSection(customEvent.detail.initialSection);
      } else {
        setActiveSection(null); // Show section list
      }
    }
    function handleClose() {
      console.log('🔧 SettingsSheet: handleClose called');
      setOpen(false);
      applyOpen(false);
      setActiveSection(null); // Reset to section list
    }

    console.log('🔧 SettingsSheet: Adding event listeners');
    window.addEventListener('settings:open', handleOpen as EventListener);
    window.addEventListener('settings:close', handleClose);

    // Also check if we should be open right now (in case event was dispatched before mount)
    const currentlyOpen = document.documentElement.getAttribute('data-settings-sheet') === 'true';
    if (currentlyOpen && !open) {
      console.log('🔧 SettingsSheet: Found open state on mount, updating');
      setOpen(true);
    }

    return () => {
      console.log('🔧 SettingsSheet: Removing event listeners');
      window.removeEventListener('settings:open', handleOpen as EventListener);
      window.removeEventListener('settings:close', handleClose);
    };
  }, []); // Empty deps - only run on mount

  // Check DOM attribute changes (for cases where it's set before component mounts)
  useEffect(() => {
    const checkState = () => {
      const isOpen = document.documentElement.getAttribute('data-settings-sheet') === 'true';
      if (isOpen !== open) {
        console.log('🔧 SettingsSheet: DOM state changed, updating', { isOpen, open });
        setOpen(isOpen);
      }
    };

    // Check immediately
    checkState();

    // Watch for attribute changes
    const observer = new MutationObserver(checkState);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-settings-sheet'],
    });

    return () => observer.disconnect();
  }, [open]);

  // Hash/deep link support
  useEffect(() => {
    if (!open) return;

    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#settings/')) {
        const sectionId = hash.replace('#settings/', '').toLowerCase();
        const validSections: SettingsSectionId[] = ['account', 'notifications', 'display', 'pro', 'data', 'about', 'admin'];
        if (validSections.includes(sectionId as SettingsSectionId)) {
          setActiveSection(sectionId as SettingsSectionId);
        } else {
          setActiveSection(null);
        }
      } else {
        setActiveSection(null);
      }
    };

    // Check hash on mount
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [open]);

  // Update hash when activeSection changes
  useEffect(() => {
    if (!open) return;
    
    if (activeSection !== null) {
      const target = `#settings/${activeSection}`;
      if (location.hash !== target) {
        history.replaceState(null, '', target);
      }
    } else {
      // When going back to section list, clear hash or set to #settings
      if (location.hash.startsWith('#settings/')) {
        history.replaceState(null, '', '#settings');
      }
    }
  }, [activeSection, open]);

  const isMobile = isMobileNow();
  
  // Always render the component (even when closed) so event listeners are always active
  // This ensures we can receive the 'settings:open' event even when the sheet is closed
  if (!open) {
    console.log('🔧 SettingsSheet: open is false, returning null but listeners are active');
    return null;
  }
  
  console.log('🔧 SettingsSheet: open is true, rendering sheet');

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
      tabIndex={-1}
      className={`fixed inset-0 flex ${isMobile ? 'items-start' : 'items-start justify-center'} ${isMobile ? '' : 'p-4 pt-16'}`}
      style={{
        backgroundColor: "rgba(0,0,0,0.8)",
        zIndex: 9999,
        ...(isMobile ? {
          top: 0,
          left: 0,
          padding: 0,
        } : {}),
      }}
    >
      <div
        className={`relative overflow-hidden ${isMobile ? 'w-full h-full' : 'w-full max-w-3xl rounded-xl'}`}
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--line)",
          border: "1px solid",
          ...(isMobile ? {
            width: "100vw",
            height: "100vh",
            maxWidth: "100vw",
            maxHeight: "100vh",
            borderRadius: 0,
          } : {
            maxHeight: "85vh",
          }),
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <header
          className="flex items-center justify-between p-4"
          style={{
            backgroundColor: "var(--btn)",
            borderBottomColor: "var(--line)",
            borderBottom: "1px solid",
          }}
        >
          {activeSection !== null && (
            <button
              onClick={() => setActiveSection(null)}
              className="flex items-center space-x-2 transition-colors"
              style={{ color: "var(--text)" }}
              aria-label="Back to sections"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </button>
          )}
          <h2
            className="text-lg font-semibold flex-1"
            style={{ color: "var(--text)", textAlign: activeSection ? "center" : "left" }}
          >
            {activeSection
              ? visibleSections.find((s) => s.id === activeSection)?.label || "Settings"
              : "Settings"}
          </h2>
          <button
            onClick={closeSettingsSheet}
            className="transition-colors"
            style={{ color: "var(--muted)" }}
            aria-label="Close Settings"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        {/* Scrollable body */}
        <div
          ref={bodyRef}
          className="overflow-y-auto p-4"
          style={{
            WebkitOverflowScrolling: "touch",
            flex: 1,
          }}
        >
          {activeSection === null ? (
            /* Section List */
            <div className="space-y-2">
              {visibleSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className="w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center justify-between"
                  style={{
                    backgroundColor: "var(--btn)",
                    borderColor: "var(--line)",
                    border: "1px solid",
                    color: "var(--text)",
                  }}
                >
                  <span className="font-medium">{section.label}</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          ) : (
            /* Section Detail */
            <div>
              {renderSettingsSection(activeSection, {
                onShowNotInterestedModal: () => setShowNotInterestedModal(true),
                onShowSharingModal: () => setShowSharingModal(true),
                onShowNotificationSettings: () => setShowNotificationSettings(true),
                onShowNotificationCenter: () => setShowNotificationCenter(true),
                isMobile: true,
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <NotInterestedModal
        isOpen={showNotInterestedModal}
        onClose={() => setShowNotInterestedModal(false)}
      />

      {showNotificationSettings && (
        <Suspense
          fallback={
            <div className="loading-spinner">Loading notification settings...</div>
          }
        >
          <NotificationSettings
            isOpen={showNotificationSettings}
            onClose={() => setShowNotificationSettings(false)}
          />
        </Suspense>
      )}

      {showNotificationCenter && (
        <Suspense
          fallback={
            <div className="loading-spinner">Loading notification center...</div>
          }
        >
          <NotificationCenter
            isOpen={showNotificationCenter}
            onClose={() => setShowNotificationCenter(false)}
          />
        </Suspense>
      )}

      {/* TODO: SharingModal is defined inline in SettingsPage.tsx - consider extracting to shared component */}
      {showSharingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.8)" }}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 max-w-md w-full">
            <p>Sharing modal - TODO: Extract from SettingsPage or implement separately</p>
            <button onClick={() => setShowSharingModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Expose helpers for QA
declare global {
  interface Window {
    openSettingsSheet?: (section?: SettingsSectionId) => void;
    closeSettingsSheet?: () => void;
  }
}
if (typeof window !== 'undefined') {
  window.openSettingsSheet = openSettingsSheet;
  window.closeSettingsSheet = closeSettingsSheet;
}