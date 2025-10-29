// Diagnostic utility for debugging daily word cache issues

/**
 * Debug function to inspect the current cache state
 * Run this in browser console: window.FlickletDebug?.inspectWordCache()
 */
export function inspectWordCache() {
  const CACHE_KEY = 'flicklet:daily-word';
  
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) {
      console.log('❌ No word cache found');
      return null;
    }
    
    const parsed: any = JSON.parse(cached);
    const today = new Date().toISOString().slice(0, 10);
    
    console.log('📦 Current Cache State:');
    console.log('  Cached Date:', parsed.date);
    console.log('  Today:', today);
    console.log('  Cached Word:', parsed.word);
    console.log('  Definition:', parsed.definition || 'N/A');
    console.log('  Timestamp:', new Date(parsed.timestamp).toLocaleString());
    console.log('  Is Valid:', parsed.date === today);
    
    if (parsed.date !== today) {
      console.log('⚠️ WARNING: Cached date does not match today!');
      console.log('   This cache should expire and fetch a new word.');
    } else {
      console.log('✅ Cache is valid for today');
    }
    
    return parsed;
  } catch (error) {
    console.error('Failed to inspect cache:', error);
    return null;
  }
}

/**
 * Clear the word cache manually
 */
export function clearWordCache() {
  const CACHE_KEY = 'flicklet:daily-word';
  try {
    localStorage.removeItem(CACHE_KEY);
    console.log('🗑️ Word cache cleared');
    return true;
  } catch (error) {
    console.error('Failed to clear cache:', error);
    return false;
  }
}

/**
 * Show what word WOULD be selected for any given date
 */
export async function predictWordForDate(dateString: string) {
  const seed = parseInt(dateString.replace(/-/g, ''), 10);
  
  try {
    const response = await fetch('/words/accepted.json');
    if (response.ok) {
      const words = await response.json();
      const wordIndex = seed % words.length;
      console.log(`📅 Date: ${dateString}`);
      console.log(`   Seed: ${seed}`);
      console.log(`   Word Index: ${wordIndex}`);
      console.log(`   Word: ${words[wordIndex]}`);
      
      return {
        date: dateString,
        seed,
        index: wordIndex,
        word: words[wordIndex]
      };
    }
  } catch (error) {
    console.error('Failed to load accepted words:', error);
  }
  
  return null;
}

/**
 * Show word predictions for the next 7 days
 */
export async function showWeeklyWords() {
  console.log('🗓️ Word Predictions for Next 7 Days:');
  console.log('=====================================');
  
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dateString = date.toISOString().slice(0, 10);
    await predictWordForDate(dateString);
  }
}

// Make functions available globally for console debugging
if (typeof window !== 'undefined') {
  (window as any).FlickletDebug = {
    inspectWordCache,
    clearWordCache,
    predictWordForDate,
    showWeeklyWords
  };
}



