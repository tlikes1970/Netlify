// www/js/app-init-marquee.js
import { loadQuips } from './marquee-data.js';
import { Marquee } from './marquee.js';

(async () => {
  try {
    const quotes = await loadQuips('/data/marquee-quips.json');
    Marquee.init({ list: quotes }); // interval auto-detects from CSS/width
    window.FlickletMarquee = Marquee; // console access for QA
  } catch (e) {
    console.warn('[marquee] using fallback quotes:', e);
    Marquee.init({
        list: [
          'There\'s no place like 127.0.0.1.',
          'In code we trust. Everyone else bring logs.',
          'Errors are just features with stage fright.'
        ]
    });
  }
})();
