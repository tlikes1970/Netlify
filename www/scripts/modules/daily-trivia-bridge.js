/**
 * Daily Trivia Bridge
 * Purpose: Mount/unmount trivia iframe in modal
 * Data Source: DOM elements
 * Update Path: Update iframe source if needed
 * Dependencies: DOM API
 */

window.DailyTriviaBridge = (() => {
  let handle = null;
  const TRIVIA_SRC = 'features/trivia.html';

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function mount(rootSel) {
    console.log('🧠 DailyTriviaBridge: Mounting trivia game');
    const root = typeof rootSel === 'string' ? document.querySelector(rootSel) : rootSel;
    if (!root) {
      console.error('🧠 DailyTriviaBridge: Root element not found:', rootSel);
      throw new Error('DailyTrivia root not found');
    }
    if (handle) {
      console.log('🧠 DailyTriviaBridge: Already mounted, returning existing handle');
      return handle;
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'triviaFrame_new';
    iframe.title = 'Daily Trivia Game';
    iframe.loading = 'eager';
    iframe.referrerPolicy = 'no-referrer';
    iframe.allow = '';
    iframe.sandbox = 'allow-scripts allow-same-origin';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '10px';

    // Add date parameter for daily consistency
    iframe.src = `${TRIVIA_SRC}?date=${todayISO()}`;

    root.replaceChildren(iframe);

    const onLoad = () => {
      try {
        iframe.focus();
        console.log('🧠 DailyTriviaBridge: Iframe loaded successfully');
      } catch (error) {
        console.error('🧠 DailyTriviaBridge: Error focusing iframe:', error);
      }
    };
    iframe.addEventListener('load', onLoad);

    // Listen for messages from the trivia game
    const onMessage = (event) => {
      try {
        if (event.data && typeof event.data === 'object') {
          console.log('🧠 DailyTriviaBridge: Received message:', event.data);
          
          // Handle trivia completion
          if (event.data.type === 'trivia:complete') {
            console.log('🧠 DailyTriviaBridge: Trivia completed');
            // Could emit custom event here if needed
          }
        }
      } catch (error) {
        console.error('🧠 DailyTriviaBridge: Error handling message:', error);
      }
    };
    window.addEventListener('message', onMessage);

    handle = {
      iframe,
      destroy() {
        try {
          iframe.removeEventListener('load', onLoad);
        } catch (error) {
          console.error('🧠 DailyTriviaBridge: Error removing load listener:', error);
        }
        try {
          window.removeEventListener('message', onMessage);
        } catch (error) {
          console.error('🧠 DailyTriviaBridge: Error removing message listener:', error);
        }
        try {
          iframe.src = 'about:blank';
        } catch (error) {
          console.error('🧠 DailyTriviaBridge: Error clearing iframe src:', error);
        }
        try {
          iframe.remove();
        } catch (error) {
          console.error('🧠 DailyTriviaBridge: Error removing iframe:', error);
        }
        handle = null;
        console.log('🧠 DailyTriviaBridge: Destroyed successfully');
      }
    };

    console.log('🧠 DailyTriviaBridge: Mounted successfully');
    return handle;
  }

  function unmount() {
    console.log('🧠 DailyTriviaBridge: Unmounting trivia game');
    if (handle) {
      handle.destroy();
    } else {
      console.log('🧠 DailyTriviaBridge: No handle to unmount');
    }
  }

  return { mount, unmount };
})();






