/**
 * Common 5-letter words that most English speakers will know
 * Curated list focusing on familiar, everyday vocabulary
 * Used for both daily word selection and guess validation
 */

// Common words list - lowercase for consistency
export const COMMON_WORDS = new Set([
  // High frequency everyday words
  "about", "above", "abuse", "actor", "acute", "admit", "adopt", "adult", "after", "again",
  "agent", "agree", "ahead", "alarm", "album", "alert", "alien", "align", "alike", "alive",
  "allow", "alone", "along", "alter", "among", "anger", "angle", "angry", "apart", "apple",
  "apply", "arena", "argue", "arise", "array", "aside", "asset", "avoid", "awake", "aware",
  "award", "badly", "basic", "beach", "began", "begin", "being", "below", "bench", "birth",
  "black", "blame", "blank", "blind", "block", "blood", "board", "boost", "booth", "bound",
  "brain", "brand", "brave", "bread", "break", "breed", "brief", "bring", "broad", "broke",
  "brown", "build", "built", "buyer", "cable", "calif", "carry", "catch", "cause", "chain",
  "chair", "chaos", "charm", "chart", "chase", "cheap", "check", "chest", "chief", "child",
  "china", "chose", "civil", "claim", "class", "clean", "clear", "click", "climb", "clock",
  "close", "cloud", "coach", "coast", "could", "count", "court", "cover", "craft", "crash",
  "crazy", "cream", "crime", "cross", "crowd", "crown", "crude", "curve", "cycle", "daily",
  "dance", "dated", "dealt", "death", "debut", "delay", "depth", "doing", "doubt", "dozen",
  "draft", "drama", "drank", "dream", "dress", "drill", "drink", "drive", "drove", "dying",
  "eager", "early", "earth", "eight", "elite", "empty", "enemy", "enjoy", "enter", "entry",
  "equal", "error", "event", "every", "exact", "exist", "extra", "faith", "false", "fault",
  "fiber", "field", "fifth", "fifty", "fight", "final", "first", "fixed", "flash", "fleet",
  "floor", "fluid", "focus", "force", "forth", "forty", "forum", "found", "frame", "frank",
  "fraud", "fresh", "front", "fruit", "fully", "funny", "giant", "given", "glass", "globe",
  "going", "grace", "grade", "grand", "grant", "grass", "grave", "great", "green", "gross",
  "group", "grown", "guard", "guess", "guest", "guide", "happy", "harry", "heart", "heavy",
  "hello", "hence", "holly", "hopes", "horse", "hotel", "house", "human", "ideal", "image", "index", "inner", "input",
  "issue", "japan", "jimmy", "joint", "jones", "judge", "known", "label", "large", "laser",
  "later", "laugh", "layer", "learn", "lease", "least", "leave", "legal", "level", "lewis",
  "light", "limit", "links", "lives", "local", "logic", "loose", "lower", "lucky", "lunch",
  "lying", "magic", "major", "maker", "march", "maria", "match", "maybe", "mayor", "meant",
  "media", "metal", "might", "minor", "minus", "mixed", "model", "money", "month", "moral",
  "motor", "mount", "mouse", "mouth", "moved", "movie", "music", "needs", "never", "newly",
  "night", "noise", "north", "noted", "novel", "nurse", "occur", "ocean", "offer", "often",
  "order", "other", "ought", "paint", "panel", "paper", "party", "peace", "penny", "peter",
  "phase", "phone", "photo", "piece", "pilot", "pitch", "place", "plain", "plane", "plant",
  "plate", "point", "pound", "power", "press", "price", "pride", "prime", "print", "prior",
  "prize", "proof", "proud", "prove", "queen", "quick", "quiet", "quite", "radio", "raise",
  "range", "rapid", "ratio", "reach", "ready", "realm", "rebel", "refer", "relax", "reply",
  "right", "rigid", "rival", "river", "robin", "roger", "roman", "rough", "round", "route",
  "royal", "rural", "scale", "scene", "scope", "score", "sense", "serve", "seven", "shall",
  "shape", "share", "sharp", "sheet", "shelf", "shell", "shift", "shine", "shirt", "shock",
  "shoot", "short", "shown", "sides", "sight", "silly", "since", "sixth", "sixty", "sized",
  "skill", "sleep", "slide", "small", "smart", "smile", "smith", "smoke", "snake", "solid",
  "solve", "sorry", "sound", "south", "space", "spare", "speak", "speed", "spend", "spent",
  "split", "spoke", "sport", "staff", "stage", "stake", "stand", "start", "state", "steam",
  "steel", "stick", "still", "stock", "stone", "stood", "store", "storm", "story", "strip",
  "stuck", "study", "stuff", "style", "sugar", "suite", "super", "sweet", "table", "taken",
  "taste", "taxes", "teach", "teeth", "thank", "theft", "their", "theme", "there", "these",
  "thick", "thing", "think", "third", "those", "three", "threw", "throw", "thumb", "tight",
  "times", "tired", "title", "today", "topic", "total", "touch", "tough", "tower", "track",
  "trade", "train", "treat", "trend", "trial", "tribe", "trick", "tried", "tries", "truck",
  "truly", "trust", "truth", "twice", "uncle", "under", "union", "unity", "until", "upper",
  "upset", "urban", "usage", "usual", "valid", "value", "video", "virus", "visit", "vital",
  "voice", "waste", "watch", "water", "wheel", "where", "which", "while", "white", "whole",
  "whose", "woman", "women", "world", "worry", "worse", "worst", "worth", "would", "wound",
  "write", "wrong", "wrote", "young", "youth"
]);

/**
 * Check if a word is in the common words list
 */
export function isCommonWord(word: string): boolean {
  return COMMON_WORDS.has(word.toLowerCase());
}

/**
 * Get array of common words (for indexing)
 */
export function getCommonWordsArray(): string[] {
  return Array.from(COMMON_WORDS);
}

