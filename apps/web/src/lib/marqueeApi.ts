// Marquee API Service - Fetches fun content for the marquee feed
// Uses completely free APIs with no limits or authentication required

export interface MarqueeContent {
  text: string;
  source: string;
}

// Free API endpoints (no authentication, no limits)
const MARQUEE_APIS = [
  {
    name: 'Useless Facts',
    url: 'https://uselessfacts.jsph.pl/random.json?language=en',
    parser: (data: any) => data.text,
    source: 'useless-facts'
  },
  {
    name: 'Dad Jokes',
    url: 'https://icanhazdadjoke.com/',
    parser: (data: any) => data.joke,
    source: 'dad-jokes'
  },
  {
    name: 'Chuck Norris Facts',
    url: 'https://api.chucknorris.io/jokes/random',
    parser: (data: any) => data.value,
    source: 'chuck-norris'
  }
];

// Fallback content when APIs fail
const FALLBACK_CONTENT = [
  "🎬 Did you know? The average person spends 3 years of their life watching TV",
  "📺 Fun fact: Netflix has over 15,000 titles but you'll still scroll for 20 minutes",
  "🍿 Irony: We have more entertainment options than ever, yet we're more indecisive",
  "🎭 The paradox of choice: 500+ shows to watch, but nothing to watch",
  "📱 We live in the golden age of content and the dark age of decision-making",
  "🎪 Your watchlist is like a museum you never visit",
  "🎨 Binge-watching: The art of consuming content faster than you can process it",
  "🎯 The algorithm knows you better than you know yourself",
  "🎪 We've turned entertainment into a competitive sport",
  "🎬 The only thing harder than finding something to watch is explaining why you didn't like it"
];

let contentCache: MarqueeContent[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function fetchMarqueeContent(): Promise<MarqueeContent[]> {
  // Return cached content if still fresh
  if (contentCache.length > 0 && Date.now() - lastFetchTime < CACHE_DURATION) {
    return contentCache;
  }

  const newContent: MarqueeContent[] = [];
  
  // Try to fetch from each API
  for (const api of MARQUEE_APIS) {
    try {
      const response = await fetch(api.url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Flicklet/1.0'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const text = api.parser(data);
        
        // Clean up the text and add some flair
        const cleanedText = cleanMarqueeText(text);
        if (cleanedText) {
          newContent.push({
            text: cleanedText,
            source: api.source
          });
        }
      }
    } catch (error) {
      console.warn(`Failed to fetch from ${api.name}:`, error);
    }
  }

  // If we got some content, cache it
  if (newContent.length > 0) {
    contentCache = newContent;
    lastFetchTime = Date.now();
    return newContent;
  }

  // Fallback to static content
  return FALLBACK_CONTENT.map(text => ({
    text,
    source: 'fallback'
  }));
}

function cleanMarqueeText(text: string): string | null {
  if (!text || typeof text !== 'string') return null;
  
  // Remove excessive punctuation and clean up
  let cleaned = text.trim();
  
  // Skip if too short or too long
  if (cleaned.length < 10 || cleaned.length > 200) return null;
  
  // Skip if contains inappropriate content (basic filter)
  const inappropriateWords = ['damn', 'hell', 'crap', 'stupid', 'idiot'];
  if (inappropriateWords.some(word => cleaned.toLowerCase().includes(word))) {
    return null;
  }
  
  // Add some entertainment flair
  const entertainmentPrefixes = ['🎬', '📺', '🍿', '🎭', '🎪', '🎨', '🎯'];
  const randomPrefix = entertainmentPrefixes[Math.floor(Math.random() * entertainmentPrefixes.length)];
  
  return `${randomPrefix} ${cleaned}`;
}

// Get a random piece of content
export async function getRandomMarqueeContent(): Promise<string> {
  const content = await fetchMarqueeContent();
  const randomItem = content[Math.floor(Math.random() * content.length)];
  return randomItem.text;
}

// Preload content for better performance
export async function preloadMarqueeContent(): Promise<void> {
  try {
    await fetchMarqueeContent();
  } catch (error) {
    console.warn('Failed to preload marquee content:', error);
  }
}






