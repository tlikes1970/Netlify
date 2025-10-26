/**
 * Compact Gate Diagnostics - Dev Only
 * Instruments HTML attribute writes and provides runtime snapshot
 */

import { getFlag } from '../lib/mobileFlags';
import { isMobileNow } from '../lib/isMobile';

let originalSetAttribute: typeof Element.prototype.setAttribute;
let originalRemoveAttribute: typeof Element.prototype.removeAttribute;
let mutationObserver: MutationObserver | null = null;

function instrumentHtmlWrites() {
  const html = document.documentElement;
  
  // Store original methods
  originalSetAttribute = html.setAttribute.bind(html);
  originalRemoveAttribute = html.removeAttribute.bind(html);

  // Monkey patch setAttribute
  html.setAttribute = function(name: string, value: string) {
    if (name === 'data-compact-mobile-v1' || name === 'data-actions-split') {
      console.groupCollapsed(`🔧 HTML.setAttribute('${name}', '${value}')`);
      console.trace('Stack trace:');
      console.groupEnd();
    }
    return originalSetAttribute(name, value);
  };

  // Monkey patch removeAttribute
  html.removeAttribute = function(name: string) {
    if (name === 'data-compact-mobile-v1' || name === 'data-actions-split') {
      console.groupCollapsed(`🗑️ HTML.removeAttribute('${name}')`);
      console.trace('Stack trace:');
      console.groupEnd();
    }
    return originalRemoveAttribute(name);
  };
}

function reportGateStatus() {
  const compactGateAttr = getFlag('compact-mobile-v1') ? 'true' : 'false';
  const actionsSplitAttr = getFlag('actions-split') ? 'true' : 'false';
  
  console.group('🔍 Gate Status Report');
  console.log('data-compact-mobile-v1:', compactGateAttr);
  console.log('data-actions-split:', actionsSplitAttr);
  
  // Check CSS/JS agreement
  const compactGateCSS = isMobileNow();
  const compactGateJS = compactGateAttr === 'true';
  const actionsSplitJS = actionsSplitAttr === 'true';
  
  console.log('CSS mobile breakpoint (768px):', compactGateCSS);
  console.log('JS compact gate:', compactGateJS);
  console.log('JS actions split:', actionsSplitJS);
  console.log('CSS/JS agreement:', compactGateCSS === compactGateJS ? '✅' : '❌');
  console.groupEnd();
}

function installMutationObserver() {
  const html = document.documentElement;
  
  mutationObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && 
          (mutation.attributeName === 'data-compact-mobile-v1' || mutation.attributeName === 'data-actions-split')) {
        const oldValue = mutation.oldValue;
        const newValue = html.getAttribute(mutation.attributeName!);
        
        console.groupCollapsed(`👀 MutationObserver: ${mutation.attributeName} changed`);
        console.log('Old value:', oldValue);
        console.log('New value:', newValue);
        console.log('Target:', mutation.target);
        console.groupEnd();
        reportGateStatus(); // Report status after each change
      }
    }
  });

  mutationObserver.observe(html, {
    attributes: true,
    attributeFilter: ['data-compact-mobile-v1', 'data-actions-split'],
    attributeOldValue: true
  });
}

function collectDiagnostics() {
  const html = document.documentElement;
  const scrollingElement = document.scrollingElement || document.documentElement;
  
  // Find CSS selectors that use data-compact-mobile-v1
  const compactPresence: string[] = [];
  const compactTrue: string[] = [];
  
  // Scan all stylesheets for selectors
  for (let i = 0; i < document.styleSheets.length; i++) {
    try {
      const sheet = document.styleSheets[i];
      if (sheet.cssRules) {
        for (let j = 0; j < sheet.cssRules.length; j++) {
          const rule = sheet.cssRules[j];
          if (rule.type === CSSRule.STYLE_RULE) {
            const selector = (rule as CSSStyleRule).selectorText;
            if (selector && selector.includes('data-compact-mobile-v1')) {
              if (selector.includes('[data-compact-mobile-v1="true"]')) {
                compactTrue.push(selector);
              } else if (selector.includes('[data-compact-mobile-v1]')) {
                compactPresence.push(selector);
              }
            }
          }
        }
      }
    } catch (_e) {
      // Cross-origin stylesheets may throw
    }
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
    density: html.dataset.density ?? null,
    flagMobileCompactV1: localStorage.getItem('flag:mobile_compact_v1') === 'true',
    compactAttr: getFlag('compact-mobile-v1') ? 'true' : 'false', // "true" | "false"
    compactAttrPresent: html.hasAttribute('data-compact-mobile-v1'),
    hasHScroll: scrollingElement.scrollWidth > scrollingElement.clientWidth,
    dialogs: [...document.querySelectorAll('[role="dialog"][aria-modal="true"]')].length,
    bgLocked: scrollingElement.scrollHeight === scrollingElement.clientHeight,
    hash: location.hash || '',
    tabs: {
      count: [...document.querySelectorAll('[role="tab"]')].length,
      selectedCount: [...document.querySelectorAll('[role="tab"][aria-selected="true"]')].length,
      ids: [...document.querySelectorAll('[role="tab"]')].map(t => t.id || t.getAttribute('data-tab-id') || t.textContent?.trim() || '(unnamed)')
    },
    panels: {
      count: [...document.querySelectorAll('[role="tabpanel"]')].length,
      visibleCount: [...document.querySelectorAll('[role="tabpanel"]')].filter(p => !p.hasAttribute('hidden')).length
    },
    cssSelectors: {
      compactPresence,
      compactTrue
    }
  };
}

// Top-level export only
export function installDiagnostics() {
  // Dev guard lives inside the function
  if (!import.meta.env.DEV) return;

  console.log('🔎 Installing Compact Gate Diagnostics...');
  
  // Instrument HTML writes
  instrumentHtmlWrites();
  
  // Install mutation observer
  installMutationObserver();
  
  // Expose global diagnostic function
  (window as any).collectFlickletDiagnostics = collectDiagnostics;
  (window as any).reportGateStatus = reportGateStatus;
  
  console.log('✅ Diagnostics installed. Run collectFlickletDiagnostics() to get snapshot or reportGateStatus() for gate status.');
}



