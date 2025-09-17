/**
 * Process: Cleanup Inline Scripts
 * Purpose: Remove all inline script blocks and replace with external modules
 * Data Source: HTML file with inline scripts
 * Update Path: Processes index.html
 * Dependencies: None
 */

const fs = require('fs');
const path = require('path');

// Read the HTML file
const htmlPath = path.join(__dirname, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

console.log('🧹 Cleaning up inline scripts...');

// Remove the large home layout guardrails inline script
// Find the start and end of the script block
const scriptStart = html.indexOf('      // Runtime Order Assertion');
const scriptEnd = html.indexOf('    })();\n    </script>', scriptStart);

if (scriptStart !== -1 && scriptEnd !== -1) {
  const beforeScript = html.substring(0, scriptStart);
  const afterScript = html.substring(scriptEnd + '    })();\n    </script>'.length);
  html = beforeScript + afterScript;
  console.log('✅ Removed large home layout guardrails inline script');
}

// Remove other inline script blocks and replace with external modules
const inlineScripts = [
  {
    start: '<script>\n      // FlickWord Modal Functions',
    end: '    </script>',
    replacement: '<script type="module" src="/scripts/inline/flickword-modal.mjs"></script>'
  },
  {
    start: '<script>\n    console.log(\'🎮 Script starting...\');',
    end: '    })();\n    </script>',
    replacement: '<script type="module" src="/scripts/inline/game-cards-modal.mjs"></script>'
  },
  {
    start: '<script>\n    // === Daily Trivia <-> Modal bridge',
    end: '    })();\n    </script>',
    replacement: '<script type="module" src="/scripts/inline/daily-trivia-bridge.mjs"></script>'
  },
  {
    start: '<script>\n    // Helper to size an iframe to its modal body',
    end: '    })();\n    </script>',
    replacement: '<script type="module" src="/scripts/inline/modal-iframe-sizing.mjs"></script>'
  },
  {
    start: '<script>\n    (function() {',
    end: '    })();\n    </script>',
    replacement: '<script type="module" src="/scripts/inline/search-fallback.mjs"></script>'
  },
  {
    start: '<script>\n    function openSettingsToFeedback() {',
    end: '    }\n    </script>',
    replacement: '<script type="module" src="/scripts/inline/feedback-handler.mjs"></script>'
  },
  {
    start: '<script>\n    (function(){',
    end: '    })();\n    </script>',
    replacement: '<script type="module" src="/scripts/inline/episode-tracking-toggle.mjs"></script>'
  },
  {
    start: '<script>\n    (function(){',
    end: '    })();\n    </script>',
    replacement: '<script type="module" src="/scripts/inline/curated-rows-setting.mjs"></script>'
  },
  {
    start: '<script>\n    (function(){',
    end: '    })();\n    </script>',
    replacement: '<script type="module" src="/scripts/inline/currently-watching-limit.mjs"></script>'
  }
];

// Process each inline script
inlineScripts.forEach((script, index) => {
  const startIndex = html.indexOf(script.start);
  if (startIndex !== -1) {
    const endIndex = html.indexOf(script.end, startIndex);
    if (endIndex !== -1) {
      const beforeScript = html.substring(0, startIndex);
      const afterScript = html.substring(endIndex + script.end.length);
      html = beforeScript + script.replacement + '\n' + afterScript;
      console.log(`✅ Replaced inline script ${index + 1}`);
    }
  }
});

// Remove dev-only scripts
const devScripts = [
  '<script src="/verify-fixes.js"></script>',
  '<script src="/debug-verification.js"></script>',
  '<script src="/simple-translation-scanner.js"></script>',
  '<script src="/comprehensive-translation-fix.js"></script>'
];

devScripts.forEach(script => {
  if (html.includes(script)) {
    html = html.replace(script, '');
    console.log('✅ Removed dev script:', script);
  }
});

// Write the cleaned HTML back
fs.writeFileSync(htmlPath, html, 'utf8');
console.log('✅ HTML cleanup complete');
