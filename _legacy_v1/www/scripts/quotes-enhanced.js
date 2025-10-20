/**
 * Process: Enhanced Quotes System
 * Purpose: Expand marquee quotes content pool with sarcastic/snarky/fun quotes
 * Data Source: Enhanced quotes array, existing quote system
 * Update Path: Add new quotes or modify rotation logic in this file
 * Dependencies: Existing quote system, translation system
 */

(function () {
  'use strict';

  if (window.QuotesEnhanced) return; // Prevent double initialization

  console.log('💬 Initializing enhanced quotes system...');

  // Enhanced quotes pool with sarcastic/snarky/fun content
  const ENHANCED_QUOTES = [
    // Motivational (existing style)
    'The best way to predict the future is to create it. - Peter Drucker',
    "Life is what happens to you while you're busy making other plans. - John Lennon",
    'The only way to do great work is to love what you do. - Steve Jobs',
    'Innovation distinguishes between a leader and a follower. - Steve Jobs',
    "Your time is limited, don't waste it living someone else's life. - Steve Jobs",
    'Stay hungry, stay foolish. - Steve Jobs',
    'The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt',
    'It is during our darkest moments that we must focus to see the light. - Aristotle',

    // Sarcastic/Snarky TV & Movie themed
    "I don't always watch TV, but when I do, I prefer shows that don't get cancelled after one season.",
    'Netflix: Where every show is either a masterpiece or a guilty pleasure. No in-between.',
    'The only thing more addictive than a good TV show is the next episode button.',
    "I'm not addicted to TV shows. I can stop watching anytime I want. Just not right now.",
    'My watchlist is like a black hole—things go in, but they never come out.',
    "I have a PhD in binge-watching. My thesis was on 'The Art of Ignoring Responsibilities.'",
    "I don't have a problem with spoilers. I have a problem with people who think I care about spoilers.",
    'The best part about streaming services? They never judge you for watching the same show 47 times.',
    "I'm not avoiding social interaction. I'm just prioritizing character development over real people.",
    'My ideal weekend: 48 hours, 12 seasons, and zero human contact.',
    "I don't watch bad movies. I watch 'so bad they're good' movies. It's a fine line.",
    'The only thing worse than a cliffhanger is waiting a year to find out what happens next.',
    'I have a love-hate relationship with TV shows. I love them; they hate my sleep schedule.',
    'My watchlist is longer than my grocery list, and somehow more important.',
    "I don't need therapy. I have Netflix, and it's cheaper.",
    'The only thing more dramatic than a soap opera is my reaction to a plot twist.',
    "I'm not procrastinating. I'm just doing research for my future career as a TV critic.",
    'My ideal date night: two people, one screen, and a shared hatred for the main character.',
    "I don't have commitment issues. I have commitment issues with TV shows that get cancelled.",
    'The only thing more predictable than a rom-com is my decision to watch another rom-com.',

    // Fun & Playful
    "🎬 Plot twist: You're actually the main character in someone else's story.",
    '🍿 Popcorn is just a socially acceptable way to eat butter for dinner.',
    '📺 My TV remote has more buttons than my car, and I use it more often.',
    "🎭 I don't act in real life, but I definitely act like I'm not crying during sad movies.",
    '🎪 My life is like a reality show, but with better editing and worse ratings.',
    "🎨 I don't paint, but I do create elaborate backstories for fictional characters.",
    "🎵 My theme song would be the 'next episode' sound from Netflix.",
    '🎯 My aim in life is to find the perfect show that never ends.',
    "🎪 I'm not a clown, but I do make questionable life choices based on TV shows.",
    "🎭 I don't need a therapist. I have fictional characters who understand me better.",
    '🎨 My art is the elaborate theories I create about TV show plotlines.',
    '🎵 My playlist is just TV show theme songs on repeat.',
    "🎯 My goal is to watch every show ever made. I'm currently at 0.001%.",
    "🎪 My circus is my watchlist, and I'm the ringmaster.",
    "🎭 I don't need a mirror. I have TV shows to reflect on my life choices.",
    '🎨 My masterpiece is the perfect binge-watching setup.',
    "🎵 My soundtrack is the sound of my own voice saying 'just one more episode.'",
    "🎯 My target is to finish my watchlist before I die. It's not looking good.",
    "🎪 My performance is pretending I'm not emotionally invested in fictional characters.",
    '🎭 My role is the person who cries at commercials but not at real life.',

    // Tech & Modern Life
    '💻 My computer has more storage for TV shows than for actual work files.',
    '📱 My phone knows more about my TV preferences than my family does.',
    '🌐 The internet was invented so we could argue about TV shows with strangers.',
    "🤖 I'm not a robot, but I do have automated responses for 'what should I watch?'",
    '💾 My brain is 90% TV show quotes and 10% actual useful information.',
    "🔍 I don't need Google. I have a photographic memory of every TV show I've watched.",
    '📊 My analytics show I spend 23 hours a day watching TV. The other hour is for snacks.',
    "🔄 My refresh rate is faster than my TV's, and that's saying something.",
    '💡 My lightbulb moments happen during TV show plot twists, not real life.',
    '⚡ My energy comes from coffee and the excitement of a new season release.',
    '🔋 My battery life is better than my attention span for anything non-TV related.',
    '📶 My WiFi connection is more stable than my relationships with TV show characters.',
    '🎮 My gaming skills are limited to choosing what to watch next.',
    '💬 My social skills are limited to discussing TV shows with other people.',
    '📈 My growth is measured in shows watched per month, not personal development.',
    '📉 My decline is measured in hours of sleep lost to binge-watching.',
    '🎯 My focus is laser-sharp when watching TV, blurry everywhere else.',
    "⚖️ My balance is perfect between work, life, and TV shows. Just kidding, it's all TV.",
    '🏆 My achievements include finishing entire seasons in one sitting.',
    '🥇 My gold medal is for the most creative excuses to avoid social plans.',

    // Philosophical (with a twist)
    "To watch or not to watch, that is the question. The answer is always 'watch.'",
    'I think, therefore I binge-watch. - Descartes (probably)',
    'The unexamined life is not worth living, but the unexamined TV show is not worth watching.',
    'I came, I saw, I watched 12 episodes in a row. - Julius Caesar (if he had Netflix)',
    'The only thing I know is that I know nothing... except everything about TV shows.',
    'Be the change you want to see in the world, starting with your watchlist.',
    'The journey of a thousand miles begins with a single episode.',
    'I have a dream... that one day all shows will be available on one platform.',
    'Ask not what your TV can do for you, ask what you can do for your TV.',
    'The only thing we have to fear is running out of things to watch.',
    'I am not a number, I am a free man... who watches too much TV.',
    "The truth is out there... and it's probably in season 3, episode 7.",
    "I have not failed. I've just found 10,000 shows that don't work for me.",
    'The best way to find out if you can trust somebody is to watch TV with them.',
    'Life is like a box of chocolates, but TV shows are like a box of surprises.',
    'The only thing constant in life is change... and my love for TV shows.',
    "I have a dream that one day my watchlist will be empty. Just kidding, that's a nightmare.",
    'The unexamined show is not worth watching, but the over-examined show is not worth living.',
    'I think, therefore I am... watching TV.',
    'The only thing I know is that I know nothing... about what to watch next.',
  ];

  // Get existing quotes system
  function getExistingQuotes() {
    // Try to get quotes from existing system
    if (window.QUOTES && Array.isArray(window.QUOTES)) {
      return window.QUOTES;
    }

    // Fallback to basic quotes
    return [
      'The best way to predict the future is to create it. - Peter Drucker',
      "Life is what happens to you while you're busy making other plans. - John Lennon",
      'The only way to do great work is to love what you do. - Steve Jobs',
    ];
  }

  // Merge existing quotes with enhanced quotes
  function getMergedQuotes() {
    const existingQuotes = getExistingQuotes();
    const mergedQuotes = [...existingQuotes, ...ENHANCED_QUOTES];

    // Remove duplicates
    const uniqueQuotes = [...new Set(mergedQuotes)];

    return uniqueQuotes;
  }

  // Enhanced quote rotation with better distribution
  function createEnhancedQuoteDeck() {
    const quotes = getMergedQuotes();
    const deck = [];

    // Create weighted distribution
    const weights = {
      motivational: 0.2, // 20% motivational
      sarcastic: 0.4, // 40% sarcastic/snarky
      fun: 0.3, // 30% fun/playful
      philosophical: 0.1, // 10% philosophical
    };

    // Categorize quotes (simple keyword matching)
    const categorized = {
      motivational: quotes.filter(
        (q) =>
          q.includes('best way') ||
          q.includes('future') ||
          q.includes('great work') ||
          q.includes('believe') ||
          q.includes('dreams') ||
          q.includes('light'),
      ),
      sarcastic: quotes.filter(
        (q) =>
          q.includes('Netflix') ||
          q.includes('binge') ||
          q.includes('watchlist') ||
          q.includes('addicted') ||
          q.includes('problem') ||
          q.includes('avoiding'),
      ),
      fun: quotes.filter(
        (q) =>
          q.includes('🎬') ||
          q.includes('🍿') ||
          q.includes('📺') ||
          q.includes('🎭') ||
          q.includes('🎨') ||
          q.includes('🎵'),
      ),
      philosophical: quotes.filter(
        (q) =>
          q.includes('think') ||
          q.includes('know') ||
          q.includes('life') ||
          q.includes('truth') ||
          q.includes('dream') ||
          q.includes('journey'),
      ),
    };

    // Build weighted deck
    Object.entries(weights).forEach(([category, weight]) => {
      const categoryQuotes = categorized[category] || [];
      const count = Math.floor(categoryQuotes.length * weight);

      for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * categoryQuotes.length);
        const selectedQuote = categoryQuotes[randomIndex];
        if (selectedQuote && !deck.includes(selectedQuote)) {
          deck.push(selectedQuote);
        }
      }
    });

    // Fill remaining slots with random quotes
    while (deck.length < quotes.length) {
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      if (randomQuote && !deck.includes(randomQuote)) {
        deck.push(randomQuote);
      }
    }

    // Shuffle the deck
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    return deck;
  }

  // Enhanced quote drawing with better rotation
  function drawEnhancedQuote() {
    const deck = createEnhancedQuoteDeck();
    const next = deck.shift();
    const quoteIndex = next || 0;

    // Get translated quote based on current language
    const quoteKey = `quote_${quoteIndex + 1}`;
    const quote = (typeof t === 'function' ? t(quoteKey) : null) || next || ENHANCED_QUOTES[0];

    // Save remaining deck
    try {
      if (deck.length > 0) {
        localStorage.setItem('flicklet:quote:deck', JSON.stringify(deck));
      } else {
        localStorage.removeItem('flicklet:quote:deck');
      }
    } catch (error) {
      console.warn('💬 Failed to save quote deck:', error);
    }

    return quote;
  }

  // Get quote deck from storage
  function getQuoteDeck() {
    try {
      const raw = localStorage.getItem('flicklet:quote:deck');
      if (raw) {
        const deck = JSON.parse(raw);
        // Check if deck contains actual quotes (strings) not indices (numbers)
        if (Array.isArray(deck) && deck.length > 0 && typeof deck[0] === 'string') {
          return deck;
        } else {
          // Clear corrupted deck data
          localStorage.removeItem('flicklet:quote:deck');
          console.log('💬 Cleared corrupted quote deck data');
        }
      }
    } catch (error) {
      console.warn('💬 Failed to load quote deck:', error);
      localStorage.removeItem('flicklet:quote:deck');
    }

    // Create new deck if none exists
    return createEnhancedQuoteDeck();
  }

  // Enhanced quote drawing with deck system
  function drawQuote() {
    const deck = getQuoteDeck();
    const next = deck.shift();

    // Get the actual quote text directly from the deck
    const quote = next || ENHANCED_QUOTES[0];

    // Save remaining deck
    try {
      if (deck.length > 0) {
        localStorage.setItem('flicklet:quote:deck', JSON.stringify(deck));
      } else {
        localStorage.removeItem('flicklet:quote:deck');
      }
    } catch (error) {
      console.warn('💬 Failed to save quote deck:', error);
    }

    return quote;
  }

  // Quote rotation system
  let rotationInterval = null;

  function startQuoteRotation(intervalMs = 15000) {
    // 15 seconds default
    if (rotationInterval) {
      clearInterval(rotationInterval);
    }

    rotationInterval = setInterval(() => {
      updateQuoteDisplay();
    }, intervalMs);

    console.log('💬 Quote rotation started with', intervalMs, 'ms interval');
  }

  function stopQuoteRotation() {
    if (rotationInterval) {
      clearInterval(rotationInterval);
      rotationInterval = null;
      console.log('💬 Quote rotation stopped');
    }
  }

  function updateQuoteDisplay() {
    const quoteBar = document.getElementById('quote-bar');
    const quoteText = document.getElementById('quoteText');

    if (!quoteBar || !quoteText) return;

    const newQuote = drawQuote();
    if (newQuote && newQuote !== quoteText.textContent) {
      // Add fade transition
      quoteText.style.transition = 'opacity 0.3s ease';
      quoteText.style.opacity = '0';

      setTimeout(() => {
        quoteText.textContent = newQuote;
        quoteText.style.opacity = '1';
      }, 150);
    }
  }

  // Initialize enhanced quotes system
  function init() {
    // Stop any existing rotation systems
    if (window.QuotesEnhanced && window.QuotesEnhanced.stopRotation) {
      window.QuotesEnhanced.stopRotation();
    }

    // Override existing quote functions
    window.drawQuote = drawQuote;

    // Expose enhanced functions
    window.QuotesEnhanced = {
      drawQuote: drawQuote,
      getMergedQuotes: getMergedQuotes,
      createEnhancedQuoteDeck: createEnhancedQuoteDeck,
      getQuoteDeck: getQuoteDeck,
      startRotation: startQuoteRotation,
      stopRotation: stopQuoteRotation,
      updateDisplay: updateQuoteDisplay,
    };

    console.log('💬 Enhanced quotes system initialized with', getMergedQuotes().length, 'quotes');

    // Initialize the quote display immediately
    const quoteBar = document.getElementById('quote-bar');
    const quoteText = document.getElementById('quoteText');
    if (quoteBar && quoteText) {
      const initialQuote = drawQuote();
      quoteText.textContent = initialQuote;
      quoteBar.setAttribute('data-state', 'loaded');
    }

    // Start rotation after a short delay to let the page load
    setTimeout(() => {
      startQuoteRotation(20000); // 20 seconds for less frequent changes
    }, 3000);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
