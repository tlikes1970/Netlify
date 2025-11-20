/**
 * Netlify Function: Generate Insights & Easter Eggs for a Movie/TV Show
 *
 * This function generates original "Insights & Easter Eggs" content from Flicklet's own metadata.
 * Content is generated using templates + metadata (title, type, genres, runtime, etc.),
 * NOT from external copyrighted sources.
 *
 * SECURITY: Admin-only function. Requires x-admin-token header matching GOOFS_INGESTION_ADMIN_TOKEN env var.
 *
 * Query Parameters (GET):
 * - tmdbId: TMDB ID of the movie/show (required)
 *
 * Body Parameters (POST):
 * - tmdbId: TMDB ID (required)
 * - metadata: Object containing title metadata (title, mediaType, genres, year, runtime, etc.)
 * - bulk: Optional boolean. If true, processes multiple titles (for bulk ingestion)
 * - titles: Optional array of title objects for bulk ingestion
 *
 * Returns: JSON with generated InsightsSet and summary
 *
 * NOTE: This feature generates original content from Flicklet's own metadata + templates.
 * No external copyrighted blooper/goof text is used.
 *
 * DATA FLOW:
 * - Admin triggers ingestion via Admin UI (Firebase callable function wrapper)
 * - Function validates admin token, fetches/transforms data, writes to Firestore
 * - Clients read only from Firestore via goofsStore.ts (no direct external API calls)
 *
 * FUTURE AUTOMATION:
 * - This function is idempotent (safe to run multiple times with merge: true)
 * - Can be scheduled via Netlify Scheduled Functions or Cloud Scheduler
 * - To schedule: Create a Netlify scheduled function that calls this endpoint with admin token
 * - Example: Run nightly/weekly to refresh insights for popular titles
 * - Environment variable GOOFS_INGESTION_ADMIN_TOKEN must be set in Netlify
 */

// Initialize Firebase Admin (lazy)
let admin = null;
let database = null;

function initFirebase() {
  if (admin && database) return { admin, db: database };

  try {
    admin = require("firebase-admin");

    // Check if already initialized
    if (admin.apps.length === 0) {
      // Try to initialize with service account JSON from env (full JSON or individual fields)
      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      let serviceAccount = null;

      if (serviceAccountJson) {
        // Try parsing as full JSON string
        try {
          serviceAccount = JSON.parse(serviceAccountJson);
        } catch (e) {
          // If parsing fails, try building from individual environment variables
          if (process.env.FIREBASE_TYPE && process.env.FIREBASE_PROJECT_ID) {
            serviceAccount = {
              type: process.env.FIREBASE_TYPE,
              project_id: process.env.FIREBASE_PROJECT_ID,
              private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
              private_key: (process.env.FIREBASE_PRIVATE_KEY || "").replace(
                /\\n/g,
                "\n"
              ),
              client_email: process.env.FIREBASE_CLIENT_EMAIL,
              client_id: process.env.FIREBASE_CLIENT_ID,
              auth_uri:
                process.env.FIREBASE_AUTH_URI ||
                "https://accounts.google.com/o/oauth2/auth",
              token_uri:
                process.env.FIREBASE_TOKEN_URI ||
                "https://oauth2.googleapis.com/token",
              auth_provider_x509_cert_url:
                process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL ||
                "https://www.googleapis.com/oauth2/v1/certs",
              client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
            };
          }
        }
      } else if (process.env.FIREBASE_TYPE && process.env.FIREBASE_PROJECT_ID) {
        // Build from individual environment variables
        serviceAccount = {
          type: process.env.FIREBASE_TYPE,
          project_id: process.env.FIREBASE_PROJECT_ID,
          private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
          private_key: (process.env.FIREBASE_PRIVATE_KEY || "").replace(
            /\\n/g,
            "\n"
          ),
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          client_id: process.env.FIREBASE_CLIENT_ID,
          auth_uri:
            process.env.FIREBASE_AUTH_URI ||
            "https://accounts.google.com/o/oauth2/auth",
          token_uri:
            process.env.FIREBASE_TOKEN_URI ||
            "https://oauth2.googleapis.com/token",
          auth_provider_x509_cert_url:
            process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL ||
            "https://www.googleapis.com/oauth2/v1/certs",
          client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
        };
      }

      if (serviceAccount) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      } else {
        // Try application default credentials (for Netlify/Cloud environments)
        admin.initializeApp({
          projectId: process.env.GCLOUD_PROJECT || "flicklet-71dff",
        });
      }
    }

    database = admin.firestore();
    return { admin, db: database };
  } catch (error) {
    console.error("[goofs-fetch] ❌ Firebase Admin init error:", error.message);
    console.error("[goofs-fetch] Stack:", error.stack);
    console.error(
      "[goofs-fetch] FIREBASE_SERVICE_ACCOUNT_JSON present:",
      !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    );
    console.error("[goofs-fetch] GCLOUD_PROJECT:", process.env.GCLOUD_PROJECT);
    return { admin: null, db: null };
  }
}

const cors = (contentType = "application/json") => ({
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, x-admin-token, X-Admin-Token",
  "Content-Type": contentType,
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
});

/**
 * Admin token authentication
 * Validates x-admin-token header against GOOFS_INGESTION_ADMIN_TOKEN env var
 */
const ADMIN_TOKEN = process.env.GOOFS_INGESTION_ADMIN_TOKEN;

function isAuthorized(event) {
  if (!ADMIN_TOKEN) {
    console.warn(
      "[goofs-fetch] GOOFS_INGESTION_ADMIN_TOKEN not set - allowing all requests (INSECURE)"
    );
    // In production, this should return false, but for backward compatibility during migration:
    return true;
  }

  const header =
    event.headers?.["x-admin-token"] || event.headers?.["X-Admin-Token"];
  if (!header) {
    return false;
  }

  return header === ADMIN_TOKEN;
}

/**
 * Generate Insights & Easter Eggs from metadata using templates
 * All content is original, generated from metadata - no external copyrighted text
 */

// Helper: Get primary genre from genre array (prioritizes more distinctive genres)
function getPrimaryGenre(genres = []) {
  if (!Array.isArray(genres) || genres.length === 0) return null;

  const genreMap = genres.map((g) => {
    const name = typeof g === "string" ? g : g.name || "";
    return name.toLowerCase().trim();
  });

  // Normalize common variations
  const normalizedGenres = genreMap.map((g) => {
    if (g.includes("sci") || g.includes("science")) return "sci-fi";
    if (g.includes("thriller")) return "thriller";
    if (g.includes("horror")) return "horror";
    if (g.includes("comedy")) return "comedy";
    if (g.includes("drama")) return "drama";
    if (g.includes("fantasy")) return "fantasy";
    if (g.includes("crime")) return "crime";
    if (g.includes("mystery")) return "crime"; // Treat mystery as crime for template purposes
    if (g.includes("action")) return "action";
    return g;
  });

  // Priority order: more distinctive genres first
  const priorityGenres = [
    "horror",
    "thriller",
    "sci-fi",
    "fantasy",
    "crime",
    "comedy",
    "action",
    "drama",
  ];

  for (const priority of priorityGenres) {
    if (normalizedGenres.includes(priority)) return priority;
  }

  // Return first normalized genre if no priority match
  return normalizedGenres[0] || null;
}

// Helper: Classify runtime into buckets
function getRuntimeBucket(runtimeMinutes) {
  if (!runtimeMinutes || typeof runtimeMinutes !== "number") return null;
  if (runtimeMinutes < 90) return "short";
  if (runtimeMinutes <= 120) return "standard";
  return "long";
}

// Helper: Get decade string from year
function getDecade(year) {
  if (!year) return null;
  const yearNum =
    typeof year === "number" ? year : Number.parseInt(String(year));
  if (isNaN(yearNum)) return null;
  const decade = Math.floor(yearNum / 10) * 10;
  return `${decade}s`;
}

// Helper: Deterministic shuffle for stable but varied selection
function selectTemplates(templates, count, seed) {
  if (templates.length === 0) return [];
  if (templates.length <= count) return templates;

  // Use seed to create deterministic but varied selection
  const selected = [];
  const used = new Set();
  let currentSeed = seed;

  for (let i = 0; i < count && selected.length < templates.length; i++) {
    currentSeed = (currentSeed * 1103515245 + 12345) & 0x7fffffff; // Simple LCG
    const index = currentSeed % templates.length;

    if (!used.has(index)) {
      used.add(index);
      selected.push(templates[index]);
    } else {
      // If already used, find next available
      for (let j = 0; j < templates.length; j++) {
        const nextIndex = (index + j) % templates.length;
        if (!used.has(nextIndex)) {
          used.add(nextIndex);
          selected.push(templates[nextIndex]);
          break;
        }
      }
    }
  }

  return selected;
}

// Helper: Extract protagonist name from cast or overview
function extractProtagonistName(cast, overview) {
  // Try cast first - prefer first billed character name
  if (Array.isArray(cast) && cast.length > 0) {
    for (const castMember of cast) {
      if (typeof castMember === "string") {
        // If it's a simple string, assume it's a character name
        return castMember.split(" ")[0]; // Take first name only
      }
      if (castMember && typeof castMember === "object") {
        // Prefer character name over actor name
        const characterName = castMember.character || castMember.name;
        if (characterName && typeof characterName === "string") {
          // Extract first name only (clean up "Maya" from "Maya (as herself)" or "Maya - Protagonist")
          const cleanName = characterName.split(/[\s\-\(]/)[0].trim();
          if (cleanName.length > 1 && cleanName.length < 20) {
            return cleanName;
          }
        }
      }
    }
  }

  // Fallback: extract first proper noun from overview
  if (typeof overview === "string" && overview.length > 0) {
    // Look for capitalized words at start of sentences (likely character names)
    const sentences = overview.split(/[.!?]\s+/);
    const commonWords = new Set([
      "The",
      "A",
      "An",
      "When",
      "After",
      "Before",
      "During",
      "While",
      "This",
      "That",
      "These",
      "Those",
      "In",
      "On",
      "At",
      "For",
      "With",
    ]);

    for (const sentence of sentences) {
      const words = sentence.trim().split(/\s+/);
      if (words.length > 0) {
        const firstWord = words[0].replace(/[^\w]/g, ""); // Remove punctuation
        // If it's capitalized and looks like a name
        if (
          firstWord[0] === firstWord[0].toUpperCase() &&
          firstWord.length > 2 &&
          firstWord.length < 20 &&
          !commonWords.has(firstWord)
        ) {
          return firstWord;
        }
      }
    }
  }

  return null;
}

// Helper: Extract antagonist type from overview
function extractAntagonistType(overview, genres) {
  if (typeof overview !== "string" || overview.length === 0) return null;

  const overviewLower = overview.toLowerCase();
  const genreSet = new Set(
    (genres || []).map((g) =>
      typeof g === "string" ? g.toLowerCase() : (g.name || "").toLowerCase()
    )
  );

  // Horror/thriller patterns
  if (genreSet.has("horror") || genreSet.has("thriller")) {
    if (
      overviewLower.match(/\b(masked|strangers|intruders|home.?invasion)\b/)
    ) {
      return "masked intruders";
    }
    if (overviewLower.match(/\b(killer|murderer|slasher|serial killer)\b/)) {
      return "killer";
    }
    if (overviewLower.match(/\b(stalker|pursuer|hunter)\b/)) {
      return "stalker";
    }
    if (
      overviewLower.match(
        /\b(creature|monster|entity|demon|ghost|spirit|haunting)\b/
      )
    ) {
      return "creature";
    }
    if (overviewLower.match(/\b(cult|cultists)\b/)) {
      return "cult";
    }
  }

  // Crime patterns
  if (genreSet.has("crime")) {
    if (overviewLower.match(/\b(cartel|gang|mafia|mob|syndicate)\b/)) {
      return "criminal organization";
    }
    if (overviewLower.match(/\b(corrupt|crooked)\s+(cop|police|officer)\b/)) {
      return "corrupt cop";
    }
    if (overviewLower.match(/\b(assassin|hitman|contract killer)\b/)) {
      return "assassin";
    }
  }

  // Sci-fi patterns
  if (genreSet.has("sci-fi") || genreSet.has("science fiction")) {
    if (overviewLower.match(/\b(alien|extraterrestrial|entity)\b/)) {
      return "alien";
    }
    if (
      overviewLower.match(/\b(android|robot|cyborg|artificial intelligence)\b/)
    ) {
      return "android";
    }
  }

  // Generic fallback
  if (overviewLower.match(/\b(villain|antagonist|enemy|foe|threat)\b/)) {
    return "threat";
  }

  return null;
}

// Helper: Extract setting from overview
function extractSetting(overview, keywords) {
  if (typeof overview !== "string" || overview.length === 0) {
    // Try keywords
    if (Array.isArray(keywords) && keywords.length > 0) {
      const keywordStr = keywords.join(" ").toLowerCase();
      if (
        keywordStr.match(
          /\b(cabin|house|mansion|apartment|motel|hotel|woods|forest|desert|island|spaceship|compound|small town)\b/
        )
      ) {
        return keywordStr.match(
          /\b(cabin|house|mansion|apartment|motel|hotel|woods|forest|desert|island|spaceship|compound|small town)\b/
        )[0];
      }
    }
    return null;
  }

  const overviewLower = overview.toLowerCase();

  // Common setting patterns
  const settingPatterns = [
    {
      pattern: /\b(secluded|isolated|remote)\s+(cabin|house|mansion)\b/,
      extract: "secluded cabin",
    },
    { pattern: /\b(cabin|house|mansion)\b/, extract: "cabin" },
    {
      pattern: /\b(apartment|apartment complex|building)\b/,
      extract: "apartment",
    },
    { pattern: /\b(motel|hotel|inn)\b/, extract: "motel" },
    { pattern: /\b(woods|forest|wilderness)\b/, extract: "woods" },
    { pattern: /\b(desert|wasteland)\b/, extract: "desert" },
    { pattern: /\b(island|tropical)\b/, extract: "island" },
    { pattern: /\b(spaceship|space station|vessel)\b/, extract: "spaceship" },
    { pattern: /\b(compound|facility|base)\b/, extract: "compound" },
    { pattern: /\b(small town|village|town)\b/, extract: "small town" },
    { pattern: /\b(city|urban|metropolis)\b/, extract: "city" },
  ];

  for (const { pattern, extract } of settingPatterns) {
    if (pattern.test(overviewLower)) {
      return extract;
    }
  }

  return null;
}

// Helper: Extract conflict verb from overview
function extractConflictVerb(overview, genres) {
  if (typeof overview !== "string" || overview.length === 0) return null;

  const overviewLower = overview.toLowerCase();
  const genreSet = new Set(
    (genres || []).map((g) =>
      typeof g === "string" ? g.toLowerCase() : (g.name || "").toLowerCase()
    )
  );

  // Horror/thriller conflict patterns
  if (genreSet.has("horror") || genreSet.has("thriller")) {
    if (overviewLower.match(/\b(trapped|stuck|stranded|isolated|locked)\b/)) {
      return "trapped";
    }
    if (overviewLower.match(/\b(hunted|pursued|chased|stalked)\b/)) {
      return "hunted";
    }
    if (overviewLower.match(/\b(haunted|possessed)\b/)) {
      return "haunted";
    }
    if (overviewLower.match(/\b(surviving|fighting for survival)\b/)) {
      return "surviving";
    }
  }

  // Crime conflict patterns
  if (genreSet.has("crime")) {
    if (
      overviewLower.match(/\b(framed|set up|wrongly accused|falsely accused)\b/)
    ) {
      return "framed";
    }
    if (overviewLower.match(/\b(on the run|fugitive|escaping|running)\b/)) {
      return "on the run";
    }
    if (
      overviewLower.match(/\b(investigating|solving|uncovering|searching)\b/)
    ) {
      return "investigating";
    }
    if (overviewLower.match(/\b(protecting|defending|guarding)\b/)) {
      return "protecting";
    }
  }

  // Generic patterns
  if (overviewLower.match(/\b(fighting|battling|struggling|warring)\b/)) {
    return "fighting";
  }
  if (overviewLower.match(/\b(escaping|fleeing|running away)\b/)) {
    return "escaping";
  }
  if (overviewLower.match(/\b(hiding|concealing|evading)\b/)) {
    return "hiding";
  }

  return null;
}

// Helper: Extract context from metadata
function extractContext(meta) {
  const overview = meta.overview || meta.synopsis || "";
  const cast = meta.cast || meta.characters || null;
  const keywords = meta.keywords || meta.tags || null;
  const genres = meta.genres || [];

  return {
    protagonistName: extractProtagonistName(cast, overview),
    antagonistType: extractAntagonistType(overview, genres),
    setting: extractSetting(overview, keywords),
    conflictVerb: extractConflictVerb(overview, genres),
  };
}

function buildInsightsForTitle(meta) {
  const items = [];
  const tmdbId = String(meta.tmdbId || meta.id);
  const mediaType = meta.mediaType || meta.type || "movie";
  const genres = Array.isArray(meta.genres) ? meta.genres : [];
  const year = meta.year || meta.releaseDate?.slice(0, 4) || null;
  const runtime = meta.runtimeMins || meta.runtime || null;
  const episodeCount = meta.episodeCount || null;
  const seasonCount = meta.seasonCount || null;
  const title = meta.title || "this title";

  // Extract context from metadata
  const ctx = extractContext(meta);

  // Derive metadata helpers
  const primaryGenre = getPrimaryGenre(genres);
  const decade = getDecade(year);
  const runtimeBucket = getRuntimeBucket(runtime);
  const isMovie = mediaType === "movie";
  const isTV = mediaType === "tv";

  // Create seed from tmdbId for deterministic but varied selection
  const seed = tmdbId
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // Intro stems for varied phrasing (deterministic selection)
  const introStems = [
    (text) => text, // No intro
    (text) => `Whenever ${text}`,
    (text) => `One sneaky thing the film keeps doing is ${text}`,
    (text) => `If you watch closely, you'll see ${text}`,
    (text) => `On a rewatch, it's hard to miss that ${text}`,
    (text) => `The movie has a tell: ${text}`,
    (text) => `Once you spot this pattern, it's everywhere: ${text}`,
    (text) => `Here's the thing: ${text}`,
    (text) => `This is wild: ${text}`,
    (text) => `Pay attention to ${text}`,
  ];

  // Helper to get intro stem deterministically
  const getIntroStem = (index) => {
    const stemIndex = (seed + index * 7) % introStems.length;
    return introStems[stemIndex];
  };

  // Helper to create template text with varied intros
  const createTemplate = (baseText, templateIndex, highEnergy = false) => {
    const stem = getIntroStem(templateIndex);
    let text = baseText;

    // Replace context placeholders
    if (ctx.protagonistName) {
      text = text.replace(/\{protagonistName\}/g, ctx.protagonistName);
      text = text.replace(/\{protagonist\}/g, ctx.protagonistName);
    }
    if (ctx.antagonistType) {
      text = text.replace(/\{antagonistType\}/g, ctx.antagonistType);
      text = text.replace(/\{threat\}/g, ctx.antagonistType);
    }
    if (ctx.setting) {
      text = text.replace(/\{setting\}/g, ctx.setting);
      text = text.replace(/\{location\}/g, ctx.setting);
    }
    if (ctx.conflictVerb) {
      text = text.replace(/\{conflictVerb\}/g, ctx.conflictVerb);
    }

    // Fallback replacements
    text = text.replace(/\{protagonistName\}/g, "the protagonist");
    text = text.replace(/\{protagonist\}/g, "the protagonist");
    text = text.replace(/\{antagonistType\}/g, "the threat");
    text = text.replace(/\{threat\}/g, "the threat");
    text = text.replace(/\{setting\}/g, "the main location");
    text = text.replace(/\{location\}/g, "the main location");
    text = text.replace(/\{conflictVerb\}/g, "struggling");

    // Apply intro stem (only if text doesn't already start with a capital letter indicating it's a complete sentence)
    if (!text.match(/^[A-Z]/) && !highEnergy) {
      text = stem(text);
    }

    return text;
  };

  // Genre-specific template pools - spicy, specific, character-aware
  // Templates use base text that gets processed with context and intro stems
  const genreTemplates = {
    horror: [
      {
        type: "style",
        kind: "insight",
        subtlety: "blink",
        highEnergy: false,
        baseText: ctx.protagonistName
          ? `{protagonistName}'s pauses are basically horror alarms—any time they hesitate, brace yourself. It's the film's way of poking you in the ribs.`
          : `the protagonist's pauses are basically horror alarms—any time they hesitate, brace yourself. It's the film's way of poking you in the ribs.`,
      },
      {
        type: "world",
        kind: "pattern",
        subtlety: "obvious",
        highEnergy: false,
        baseText: ctx.antagonistType
          ? `the {antagonistType} show up in places that feel physically impossible. Your brain keeps insisting "nobody should be there" and the movie keeps proving you wrong.`
          : `the threat shows up in places that feel physically impossible. Your brain keeps insisting "nobody should be there" and the movie keeps proving you wrong.`,
      },
      {
        type: "style",
        kind: "insight",
        subtlety: "obvious",
        highEnergy: true,
        baseText: `silence is a weapon here. The moment the sound design drops out, ${title} is about to land something heavy. Once you notice this pattern, you can't unsee it.`,
      },
      {
        type: "world",
        kind: "easterEgg",
        subtlety: "blink",
        highEnergy: false,
        baseText: ctx.setting
          ? `the {setting} layout starts gaslighting you—doorways suddenly connect to rooms they shouldn't. It's not a mistake, it's the film messing with your sense of space.`
          : `the main location's layout starts gaslighting you—doorways suddenly connect to rooms they shouldn't. It's not a mistake, it's the film messing with your sense of space.`,
      },
      {
        type: "logic",
        kind: "pattern",
        subtlety: "blink",
        highEnergy: false,
        baseText: ctx.protagonistName
          ? `{protagonistName} has the worst poker face in horror. Any time they pause just a second too long, something awful is about to happen. The film is basically using them as a warning system.`
          : `the protagonist has the worst poker face in horror. Any time they pause just a second too long, something awful is about to happen. The film is basically using them as a warning system.`,
      },
      {
        type: "world",
        kind: "insight",
        subtlety: "obvious",
        highEnergy: false,
        baseText:
          ctx.antagonistType && ctx.setting
            ? `the way the {antagonistType} use the {setting} is half the tension. Watch which doorways or windows the movie uses as pressure points—it's not random.`
            : `the way the threat uses the space is half the tension. Watch which doorways or windows the movie uses as pressure points—it's not random.`,
      },
      {
        type: "style",
        kind: "easterEgg",
        subtlety: "blink",
        highEnergy: false,
        baseText: `dark corners and single light sources create natural hiding spots where ${ctx.antagonistType || "threats"} can emerge from anywhere. The lighting is basically a cheat code for scares.`,
      },
      {
        type: "world",
        kind: "pattern",
        subtlety: "obvious",
        highEnergy: true,
        baseText:
          ctx.conflictVerb === "trapped" && ctx.setting
            ? `the {setting} becomes a cage. After the second act, the film quietly changes which rooms connect—you can spot the continuity tricks if you watch door placement closely. This is the film gaslighting you on purpose.`
            : ctx.setting
              ? `the {setting} becomes a weapon. After the second act, the film quietly changes which rooms connect—you can spot the continuity tricks if you watch door placement closely. This is the film gaslighting you on purpose.`
              : `the location becomes a weapon. After the second act, the film quietly changes which rooms connect—you can spot the continuity tricks if you watch door placement closely. This is the film gaslighting you on purpose.`,
      },
    ],
    thriller: [
      {
        type: "logic",
        kind: "pattern",
        subtlety: "blink",
        highEnergy: false,
        baseText: ctx.protagonistName
          ? `when {protagonistName} shrugs off details in early scenes, the film is daring you to notice what they don't. Those throwaway objects or conversations? They're coming back.`
          : `when the protagonist shrugs off details in early scenes, the film is daring you to notice what they don't. Those throwaway objects or conversations? They're coming back.`,
      },
      {
        type: "style",
        kind: "insight",
        subtlety: "obvious",
        highEnergy: false,
        baseText: `${title} uses editing rhythm to control your pulse—quick cuts during action, longer takes when building suspense. Each choice is designed to keep you on edge.`,
      },
      {
        type: "world",
        kind: "easterEgg",
        subtlety: "blink",
        highEnergy: false,
        baseText: `background details matter here—newspaper headlines, TV news in the background, or photos on walls often hint at the bigger picture. The film isn't subtle about it either.`,
      },
      {
        type: "logic",
        kind: "insight",
        subtlety: "obvious",
        highEnergy: true,
        baseText: ctx.protagonistName
          ? `${title} plays with perspective—watch for scenes where you know more than {protagonistName}, or moments where the camera shows you something they can't see yet. It's the movie's way of daring you to keep up.`
          : `${title} plays with perspective—watch for scenes where you know more than the characters, or moments where the camera shows you something they can't see yet. It's the movie's way of daring you to keep up.`,
      },
      {
        type: "world",
        kind: "pattern",
        subtlety: "blink",
        highEnergy: false,
        baseText: ctx.antagonistType
          ? `the way the {antagonistType} appear is the real game. Half the tension is guessing which doorway or window becomes a threat next.`
          : `the way the threat appears is the real game. Half the tension is guessing which doorway or window becomes a threat next.`,
      },
      {
        type: "style",
        kind: "easterEgg",
        subtlety: "blink",
        highEnergy: false,
        baseText:
          ctx.conflictVerb === "investigating" && ctx.protagonistName
            ? `every time {protagonistName} finds a clue, the film shows you three things they're not looking at. It's not an accident—it's the movie messing with you.`
            : `every time the protagonist finds a clue, the film shows you three things they're not looking at. It's not an accident—it's the movie messing with you.`,
      },
      {
        type: "world",
        kind: "insight",
        subtlety: "obvious",
        highEnergy: false,
        baseText: ctx.setting
          ? `the {setting} acts like a pressure cooker. Every location where secrets sit starts to feel claustrophobic. Once you notice it, you can't unsee it.`
          : `the setting acts like a pressure cooker. Every location where secrets sit starts to feel claustrophobic. Once you notice it, you can't unsee it.`,
      },
      {
        type: "logic",
        kind: "pattern",
        subtlety: "blink",
        highEnergy: false,
        baseText: ctx.protagonistName
          ? `{protagonistName} keeps missing things right in front of them. The film shows you what they're not seeing, and it's kind of infuriating in a fun way.`
          : `the protagonist keeps missing things right in front of them. The film shows you what they're not seeing, and it's kind of infuriating in a fun way.`,
      },
    ],
    comedy: [
      {
        type: "style",
        kind: "insight",
        subtlety: "blink",
        highEnergy: false,
        baseText: ctx.protagonistName
          ? `{protagonistName} fires off lines that sound throwaway, but half of them are setups for jokes 20 minutes later. The film is playing the long game and it's kind of brilliant.`
          : `the protagonist fires off lines that sound throwaway, but half of them are setups for jokes 20 minutes later. The film is playing the long game and it's kind of brilliant.`,
      },
      {
        type: "world",
        kind: "easterEgg",
        subtlety: "blink",
        highEnergy: false,
        baseText: `visual callbacks are everywhere. Watch for objects, locations, or even camera angles that reappear to underline a running joke. The film is winking at you.`,
      },
      {
        type: "style",
        kind: "pattern",
        subtlety: "obvious",
        highEnergy: false,
        baseText: `the timing here is everything. Notice how the editing creates comedic rhythm—letting jokes breathe or cutting away at the perfect moment for maximum impact.`,
      },
      {
        type: "world",
        kind: "insight",
        subtlety: "blink",
        highEnergy: true,
        baseText: ctx.setting
          ? `the {setting} acts like a comedy stage. You can watch entire jokes play out in the background while the main cast talks. Once you notice it, it's everywhere.`
          : `the setting acts like a comedy stage. You can watch entire jokes play out in the background while the main cast talks. Once you notice it, it's everywhere.`,
      },
      {
        type: "style",
        kind: "easterEgg",
        subtlety: "blink",
        highEnergy: false,
        baseText: `watch the background actors. They're doing their own comedy routine while the main characters talk, and it's often funnier than what's happening in the foreground.`,
      },
      {
        type: "world",
        kind: "pattern",
        subtlety: "obvious",
        highEnergy: false,
        baseText: ctx.setting
          ? `the {setting} isn't just a location—it's a character with its own comedic timing. Notice how the space itself becomes part of the joke.`
          : `the setting isn't just a location—it's a character with its own comedic timing. Notice how the space itself becomes part of the joke.`,
      },
      {
        type: "style",
        kind: "insight",
        subtlety: "blink",
        highEnergy: false,
        baseText: `${title} hides jokes everywhere—background signs, prop placement, and even extras' reactions can deliver punchlines you'll miss if you're not watching closely.`,
      },
      {
        type: "logic",
        kind: "pattern",
        subtlety: "obvious",
        highEnergy: false,
        baseText: ctx.protagonistName
          ? `what seems like a throwaway line when {protagonistName} says it early on often becomes a setup for a bigger payoff later. The film is basically setting up dominoes.`
          : `what seems like a throwaway line early on often becomes a setup for a bigger payoff later. The film is basically setting up dominoes.`,
      },
    ],
    drama: [
      {
        type: "style",
        kind: "insight",
        subtlety: "obvious",
        highEnergy: true,
        baseText: ctx.protagonistName
          ? `when {protagonistName}'s face lingers on screen after an argument, the film is forcing you to sit in the fallout with them. It's uncomfortable and that's the point.`
          : `when the protagonist's face lingers on screen after an argument, the film is forcing you to sit in the fallout with them. It's uncomfortable and that's the point.`,
      },
      {
        type: "world",
        kind: "pattern",
        subtlety: "blink",
        highEnergy: false,
        baseText: ctx.setting
          ? `the {setting} changes as the story progresses. It's not just a backdrop—it's telling you how the characters feel. Once you notice it, you can't unsee it.`
          : `the setting changes as the story progresses. It's not just a backdrop—it's telling you how the characters feel. Once you notice it, you can't unsee it.`,
      },
      {
        type: "style",
        kind: "insight",
        subtlety: "blink",
        highEnergy: false,
        baseText: `color and lighting tell you how to feel—warm tones for comfort, cool tones for distance. The film is manipulating your mood and it's not subtle about it.`,
      },
      {
        type: "world",
        kind: "easterEgg",
        subtlety: "blink",
        highEnergy: false,
        baseText: ctx.protagonistName
          ? `little objects—photos, props, outfits—keep reappearing as emotional markers once you notice them. The way {protagonistName} interacts with them tells you everything.`
          : `little objects—photos, props, outfits—keep reappearing as emotional markers once you notice them. The way characters interact with them tells you everything.`,
      },
      {
        type: "logic",
        kind: "pattern",
        subtlety: "obvious",
        highEnergy: false,
        baseText:
          ctx.conflictVerb && ctx.protagonistName
            ? `the way {protagonistName} handles being {conflictVerb} tells you everything about who they really are. The film shows, it doesn't tell.`
            : `the way the protagonist handles their situation tells you everything about who they really are. The film shows, it doesn't tell.`,
      },
      {
        type: "style",
        kind: "pattern",
        subtlety: "blink",
        highEnergy: false,
        baseText: ctx.protagonistName
          ? `${title} lets moments breathe. Watch how the camera holds on {protagonistName}'s face after big revelations, giving you space to process the emotional weight.`
          : `${title} lets moments breathe. Watch how the camera holds on characters' faces after big revelations, giving you space to process the emotional weight.`,
      },
      {
        type: "world",
        kind: "insight",
        subtlety: "obvious",
        highEnergy: false,
        baseText: ctx.setting
          ? `the {setting} isn't just where things happen—it's part of the emotional landscape. Pay attention to how it shifts with the story's mood.`
          : `the setting isn't just where things happen—it's part of the emotional landscape. Pay attention to how it shifts with the story's mood.`,
      },
      {
        type: "logic",
        kind: "easterEgg",
        subtlety: "blink",
        highEnergy: false,
        baseText: ctx.protagonistName
          ? `small details carry big meaning—family photos, personal items, or even the way {protagonistName} dresses can reveal backstory. The film trusts you to notice.`
          : `small details carry big meaning—family photos, personal items, or even the way characters dress can reveal backstory. The film trusts you to notice.`,
      },
    ],
    "sci-fi": [
      {
        type: "world",
        kind: "easterEgg",
        subtlety: "blink",
        highEnergy: false,
        baseText: `${title} builds its world in the background—screens, signage, and tech details you might miss on first watch actually establish the rules. It's all there if you look.`,
      },
      {
        type: "world",
        kind: "pattern",
        subtlety: "obvious",
        highEnergy: false,
        baseText: ctx.setting
          ? `the {setting} uses visual consistency to sell its reality. Watch for recurring design elements, tech interfaces, or architectural details that make the world feel lived-in.`
          : `visual consistency sells the reality. Watch for recurring design elements, tech interfaces, or architectural details that make the world feel lived-in.`,
      },
      {
        type: "style",
        kind: "insight",
        subtlety: "blink",
        highEnergy: true,
        baseText: ctx.protagonistName
          ? `{protagonistName}'s quiet moments do as much world-building as any big effects shot. Watch how they react to the {setting} like it's alive.`
          : `the protagonist's quiet moments do as much world-building as any big effects shot. Watch how they react to the environment like it's alive.`,
      },
      {
        type: "world",
        kind: "easterEgg",
        subtlety: "blink",
        highEnergy: false,
        baseText: ctx.antagonistType
          ? `the tech isn't just set dressing—pay attention to how interfaces, displays, and gadgets actually function. Especially when the {antagonistType} use them.`
          : `the tech isn't just set dressing—pay attention to how interfaces, displays, and gadgets actually function. The film plays fair with its rules.`,
      },
      {
        type: "logic",
        kind: "pattern",
        subtlety: "obvious",
        highEnergy: false,
        baseText: ctx.antagonistType
          ? `the rules of how the {antagonistType} work are shown, not told. Watch for how they behave consistently—once you notice it, you can't unsee it.`
          : `the rules of this universe are shown, not told. Watch for how things behave consistently—once you notice it, you can't unsee it.`,
      },
      {
        type: "world",
        kind: "insight",
        subtlety: "blink",
        highEnergy: false,
        baseText: ctx.setting
          ? `the {setting} has its own logic. Pay attention to how the space itself functions—it's not just a backdrop, it's part of the story.`
          : `the setting has its own logic. Pay attention to how the space itself functions—it's not just a backdrop, it's part of the story.`,
      },
      {
        type: "style",
        kind: "pattern",
        subtlety: "obvious",
        highEnergy: false,
        baseText: ctx.protagonistName
          ? `${title} balances spectacle with intimacy. Notice how big sci-fi concepts are often explored through small moments with {protagonistName} that ground the story.`
          : `${title} balances spectacle with intimacy. Notice how big sci-fi concepts are often explored through small, human moments that ground the story.`,
      },
      {
        type: "logic",
        kind: "easterEgg",
        subtlety: "blink",
        highEnergy: false,
        baseText: `the film establishes what's possible early on, then sticks to those rules. Watch for how technology and physics behave consistently—it's the movie's way of playing fair.`,
      },
    ],
    fantasy: [
      {
        type: "world",
        kind: "pattern",
        subtlety: "obvious",
        highEnergy: false,
        baseText: ctx.protagonistName
          ? `watch for recurring symbols, colors, or objects that signal how {protagonistName}'s powers work. The film establishes its magic system through visual consistency.`
          : `watch for recurring symbols, colors, or objects that signal how the fantasy elements work. The film establishes its magic system through visual consistency.`,
      },
      {
        type: "world",
        kind: "easterEgg",
        subtlety: "blink",
        highEnergy: false,
        baseText: ctx.setting
          ? `the {setting} hides lore in plain sight. Background details, architecture, and even costume choices often hint at deeper mythology. It's all there if you know where to look.`
          : `lore hides in plain sight. Background details, architecture, and even costume choices often hint at deeper mythology. It's all there if you know where to look.`,
      },
      {
        type: "style",
        kind: "insight",
        subtlety: "obvious",
        highEnergy: true,
        baseText: `visual language distinguishes the ordinary from the magical. Notice how camera movement and color grading shift when fantasy elements appear—the film is literally changing its language.`,
      },
      {
        type: "world",
        kind: "pattern",
        subtlety: "blink",
        highEnergy: false,
        baseText: `the rules of this world are shown, not told. Watch for how magic, creatures, or fantastical elements behave consistently—once you notice it, you can't unsee it.`,
      },
      {
        type: "logic",
        kind: "easterEgg",
        subtlety: "blink",
        highEnergy: false,
        baseText: ctx.antagonistType
          ? `the way the {antagonistType} use magic tells you everything about how the system works. Pay attention to the details—they're not just for show.`
          : `the way magic is used tells you everything about how the system works. Pay attention to the details—they're not just for show.`,
      },
      {
        type: "world",
        kind: "insight",
        subtlety: "obvious",
        highEnergy: false,
        baseText: ctx.setting
          ? `the {setting} isn't just a backdrop—it's part of the magic system. Watch how the space itself responds to fantastical elements.`
          : `the setting isn't just a backdrop—it's part of the magic system. Watch how the space itself responds to fantastical elements.`,
      },
      {
        type: "style",
        kind: "pattern",
        subtlety: "blink",
        highEnergy: false,
        baseText: ctx.protagonistName
          ? `{protagonistName}'s reactions to magic tell you everything. Watch how they interact with fantastical elements—it's the film's way of showing you the rules.`
          : `the protagonist's reactions to magic tell you everything. Watch how they interact with fantastical elements—it's the film's way of showing you the rules.`,
      },
      {
        type: "logic",
        kind: "pattern",
        subtlety: "obvious",
        highEnergy: false,
        baseText: `the film establishes what's possible early on, then sticks to those rules. Watch for how magic behaves consistently—it's the movie's way of playing fair.`,
      },
    ],
    crime: [
      {
        type: "logic",
        kind: "pattern",
        subtlety: "blink",
        highEnergy: false,
        baseText: ctx.protagonistName
          ? `${title} plays fair with its clues—everything {protagonistName} needs to solve the mystery is there, but it's hidden in plain sight among red herrings.`
          : `${title} plays fair with its clues—everything you need to solve the mystery is there, but it's hidden in plain sight among red herrings.`,
      },
      {
        type: "world",
        kind: "insight",
        subtlety: "obvious",
        highEnergy: false,
        baseText: ctx.setting
          ? `the {setting} is a character. The places where crimes happen, investigations occur, or secrets are kept all tell their own stories.`
          : `location is a character. The places where crimes happen, investigations occur, or secrets are kept all tell their own stories.`,
      },
      {
        type: "logic",
        kind: "easterEgg",
        subtlety: "blink",
        highEnergy: false,
        baseText: ctx.protagonistName
          ? `pay attention to what {protagonistName} notices (or doesn't notice). The details that catch their eye often reveal their expertise or hidden knowledge.`
          : `pay attention to what characters notice (or don't notice). The details that catch someone's eye often reveal their expertise or hidden knowledge.`,
      },
      {
        type: "style",
        kind: "pattern",
        subtlety: "obvious",
        highEnergy: true,
        baseText: `${title} uses editing to control information. Watch how it reveals clues, misdirects attention, or shows you multiple perspectives of the same moment. The film is playing you and it's kind of brilliant.`,
      },
      {
        type: "world",
        kind: "pattern",
        subtlety: "blink",
        highEnergy: false,
        baseText: ctx.antagonistType
          ? `the way the {antagonistType} operate tells you everything about the stakes. Pay attention to their methods—they're not random.`
          : `the way the criminals operate tells you everything about the stakes. Pay attention to their methods—they're not random.`,
      },
      {
        type: "logic",
        kind: "insight",
        subtlety: "obvious",
        highEnergy: false,
        baseText:
          ctx.conflictVerb === "investigating" && ctx.protagonistName
            ? `every scene where {protagonistName} investigates shows you three things they're not looking at. It's not an accident—it's the movie messing with you.`
            : `every scene shows you three things the characters aren't looking at. It's not an accident—it's the movie messing with you.`,
      },
      {
        type: "world",
        kind: "easterEgg",
        subtlety: "blink",
        highEnergy: false,
        baseText: ctx.setting
          ? `the {setting} acts like a pressure cooker. Every location where secrets sit starts to feel claustrophobic. Once you notice it, you can't unsee it.`
          : `the setting acts like a pressure cooker. Every location where secrets sit starts to feel claustrophobic. Once you notice it, you can't unsee it.`,
      },
      {
        type: "style",
        kind: "pattern",
        subtlety: "obvious",
        highEnergy: false,
        baseText: ctx.protagonistName
          ? `{protagonistName} keeps missing things right in front of them. The film shows you what they're not seeing, and it's kind of infuriating in a fun way.`
          : `the protagonist keeps missing things right in front of them. The film shows you what they're not seeing, and it's kind of infuriating in a fun way.`,
      },
    ],
    action: [
      {
        type: "style",
        kind: "insight",
        subtlety: "obvious",
        highEnergy: false,
        baseText: ctx.protagonistName
          ? `${title} choreographs its action like a dance. Watch how camera movement, editing rhythm, and {protagonistName}'s positioning create clear spatial geography even in chaos.`
          : `${title} choreographs its action like a dance. Watch how camera movement, editing rhythm, and character positioning create clear spatial geography even in chaos.`,
      },
      {
        type: "world",
        kind: "pattern",
        subtlety: "blink",
        highEnergy: false,
        baseText: `the first action sequence sets up the rules. Pay attention to how it establishes what's physically possible for the rest of the story—the film plays fair.`,
      },
      {
        type: "style",
        kind: "easterEgg",
        subtlety: "blink",
        highEnergy: true,
        baseText: `practical effects and stunts are used strategically. See if you can spot where real stunts transition to CGI, or where the camera work hides the seams. It's a game and once you notice it, it's everywhere.`,
      },
      {
        type: "world",
        kind: "insight",
        subtlety: "obvious",
        highEnergy: false,
        baseText:
          ctx.antagonistType && ctx.protagonistName
            ? `the action isn't just spectacle. Each set piece advances character or plot. Watch how {protagonistName} handles the {antagonistType} to reveal something new.`
            : `the action isn't just spectacle. Each set piece advances character or plot, so watch for how fights and chases reveal something new.`,
      },
      {
        type: "logic",
        kind: "pattern",
        subtlety: "blink",
        highEnergy: false,
        baseText: ctx.setting
          ? `the {setting} becomes a weapon. After the midpoint, notice how the action sequences start using the environment itself as part of the choreography.`
          : `the environment becomes a weapon. After the midpoint, notice how the action sequences start using the space itself as part of the choreography.`,
      },
      {
        type: "style",
        kind: "pattern",
        subtlety: "obvious",
        highEnergy: false,
        baseText: ctx.protagonistName
          ? `{protagonistName}'s fighting style tells you everything about who they are. Watch how they move—it's the film's way of showing character through action.`
          : `the protagonist's fighting style tells you everything about who they are. Watch how they move—it's the film's way of showing character through action.`,
      },
      {
        type: "world",
        kind: "easterEgg",
        subtlety: "blink",
        highEnergy: false,
        baseText: `the film establishes what's physically possible early on, then sticks to those rules. Watch for how stunts and physics behave consistently—it's the movie's way of playing fair.`,
      },
      {
        type: "logic",
        kind: "insight",
        subtlety: "obvious",
        highEnergy: false,
        baseText: ctx.setting
          ? `the {setting} isn't just a backdrop—it's part of the action choreography. Notice how the space itself becomes a weapon or obstacle.`
          : `the setting isn't just a backdrop—it's part of the action choreography. Notice how the space itself becomes a weapon or obstacle.`,
      },
    ],
  };

  // Select templates based on primary genre
  if (primaryGenre && genreTemplates[primaryGenre]) {
    const templates = genreTemplates[primaryGenre];
    const selected = selectTemplates(templates, 4, seed);

    // Ensure at least one high-energy insight
    const hasHighEnergy = selected.some((t) => t.highEnergy);
    if (!hasHighEnergy && templates.length > selected.length) {
      const highEnergyTemplates = templates.filter((t) => t.highEnergy);
      if (highEnergyTemplates.length > 0) {
        // Replace one selected template with a high-energy one
        const highEnergyTemplate = selectTemplates(
          highEnergyTemplates,
          1,
          seed + 500
        )[0];
        selected[0] = highEnergyTemplate;
      }
    }

    selected.forEach((template, idx) => {
      // Process template text with context and intro stems
      let finalText = template.baseText || template.text || "";
      if (template.baseText) {
        finalText = createTemplate(template.baseText, idx, template.highEnergy);
      }

      items.push({
        id: `insight-${primaryGenre}-${idx}-${tmdbId}`,
        type: template.type,
        kind: template.kind,
        subtlety: template.subtlety,
        text: finalText,
      });
    });
  }

  // Also check for secondary genres (thriller often pairs with horror, etc.)
  const genreSet = new Set(
    genres.map((g) =>
      typeof g === "string"
        ? g.toLowerCase().trim()
        : (g.name || "").toLowerCase().trim()
    )
  );

  if (
    genreSet.has("thriller") &&
    primaryGenre !== "thriller" &&
    genreTemplates.thriller
  ) {
    const selected = selectTemplates(genreTemplates.thriller, 1, seed + 100);
    selected.forEach((template) => {
      items.push({
        id: `insight-thriller-secondary-${tmdbId}`,
        ...template,
      });
    });
  }

  // Media type and runtime-specific insights
  if (isMovie && runtimeBucket) {
    if (runtimeBucket === "short") {
      items.push({
        id: `insight-short-runtime-${tmdbId}`,
        type: "style",
        kind: "insight",
        subtlety: "obvious",
        text: `${title} packs a lot into its runtime—watch for how it uses visual shorthand, efficient editing, and tight pacing to tell a complete story quickly.`,
      });
    } else if (runtimeBucket === "long") {
      items.push({
        id: `insight-long-runtime-${tmdbId}`,
        type: "style",
        kind: "insight",
        subtlety: "obvious",
        text: `${title} takes its time—notice how extended sequences and slower pacing let atmosphere and character development breathe, building to bigger moments.`,
      });
    }
  }

  if (isTV) {
    if (episodeCount && episodeCount <= 10) {
      items.push({
        id: `insight-limited-series-${tmdbId}`,
        type: "style",
        kind: "pattern",
        subtlety: "obvious",
        text: `As a limited series, ${title} has a clear endgame—each episode likely builds toward a specific conclusion, so watch for how threads introduced early pay off later.`,
      });
    } else if (
      episodeCount &&
      episodeCount > 20 &&
      seasonCount &&
      seasonCount > 1
    ) {
      items.push({
        id: `insight-multi-season-${tmdbId}`,
        type: "world",
        kind: "pattern",
        subtlety: "blink",
        text: `Long-running shows like ${title} develop visual vocabulary over time—watch for recurring locations, props, or camera techniques that become signature elements.`,
      });
    }
  }

  // Decade-specific insights (only if we don't have enough genre-specific ones)
  if (items.length < 3 && decade) {
    if (decade === "2020s") {
      items.push({
        id: `insight-modern-${tmdbId}`,
        type: "style",
        kind: "insight",
        subtlety: "blink",
        text: `${title} reflects modern filmmaking techniques—notice how it blends practical and digital effects, or uses contemporary camera and editing styles.`,
      });
    }
  }

  // Fallback: Only use generic templates if we truly have minimal metadata
  if (items.length < 3 && !primaryGenre && !decade) {
    const fallbackTemplates = [
      {
        type: "style",
        kind: "insight",
        subtlety: "obvious",
        text: ctx.protagonistName
          ? `Pay attention to how ${ctx.protagonistName} moves through the frame—the composition tells you everything about their state of mind.`
          : `${title} uses visual storytelling—pay attention to how composition, color, and camera movement enhance the narrative without words.`,
      },
      {
        type: "world",
        kind: "pattern",
        subtlety: "blink",
        text: ctx.setting
          ? `The ${ctx.setting} isn't just a backdrop—watch how it changes as the story progresses. It's telling its own story.`
          : `Watch for recurring elements in ${title}—objects, locations, or visual motifs that appear multiple times often carry deeper meaning.`,
      },
      {
        type: "logic",
        kind: "easterEgg",
        subtlety: "blink",
        text: ctx.antagonistType
          ? `The way the ${ctx.antagonistType} operate isn't random—pay attention to their patterns. The film is showing you how they work.`
          : `Pay attention to patterns—the way things happen isn't random. The film is showing you how it works.`,
      },
    ];

    const selected = selectTemplates(
      fallbackTemplates,
      Math.min(2, 3 - items.length),
      seed
    );
    selected.forEach((template, idx) => {
      items.push({
        id: `insight-fallback-${idx}-${tmdbId}`,
        ...template,
      });
    });
  }

  // Ensure we have at least 3 items, but limit to 5 for quality
  while (items.length < 3 && items.length < 5) {
    // If we still don't have enough, add one more generic but title-specific insight
    const genericVariants = [
      {
        type: "style",
        kind: "insight",
        subtlety: "obvious",
        text: ctx.protagonistName
          ? `${title} tells its story through both what you see and what you hear—notice how sound design and visuals work together, especially when ${ctx.protagonistName} is on screen.`
          : `${title} tells its story through both what you see and what you hear—notice how sound design and visuals work together.`,
      },
      {
        type: "world",
        kind: "pattern",
        subtlety: "blink",
        text: ctx.setting
          ? `Background details in the ${ctx.setting} often reward close attention—props, set decoration, and background action can add layers to the story.`
          : `Background details in ${title} often reward close attention—props, set decoration, and background action can add layers to the story.`,
      },
      {
        type: "logic",
        kind: "easterEgg",
        subtlety: "blink",
        text: ctx.antagonistType
          ? `The way the ${ctx.antagonistType} move through the frame tells you everything. Pay attention to their patterns—it's not random.`
          : `The way things move through the frame tells you everything. Pay attention to the patterns—it's not random.`,
      },
    ];

    const variantIndex = items.length % genericVariants.length;
    items.push({
      id: `insight-generic-${items.length}-${tmdbId}`,
      ...genericVariants[variantIndex],
    });
  }

  // Limit to 5 items max for quality over quantity
  return items.slice(0, 5);
}

exports.handler = async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: cors("text/plain"), body: "" };
  }

  // Admin authentication check
  if (!isAuthorized(event)) {
    console.warn(
      "[goofs-fetch] Unauthorized request - missing or invalid admin token"
    );
    return {
      statusCode: 401,
      headers: cors(),
      body: JSON.stringify({
        error: "Unauthorized",
        message: "Admin token required",
      }),
    };
  }

  const { admin: adminInstance, db: firestore } = initFirebase();

  // Log Firestore initialization status for debugging
  if (!firestore) {
    console.error(
      "[goofs-fetch] ⚠️ Firestore not initialized - writes will fail!"
    );
    console.error(
      "[goofs-fetch] Check FIREBASE_SERVICE_ACCOUNT_JSON environment variable in Netlify"
    );
  } else {
    console.log("[goofs-fetch] ✅ Firestore initialized successfully");
  }

  // Parse request
  let tmdbId = null;
  let metadata = null;

  if (event.httpMethod === "GET") {
    const qs = event.queryStringParameters || {};
    tmdbId = qs.tmdbId || qs.tmdb_id;
  } else if (event.httpMethod === "POST") {
    try {
      const body = JSON.parse(event.body || "{}");
      tmdbId = body.tmdbId || body.tmdb_id;
      metadata = body.metadata || null;
    } catch (error) {
      return {
        statusCode: 400,
        headers: cors(),
        body: JSON.stringify({
          error: "Invalid JSON body",
          message: error.message,
        }),
      };
    }
  } else {
    return {
      statusCode: 405,
      headers: cors(),
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  if (!tmdbId) {
    return {
      statusCode: 400,
      headers: cors(),
      body: JSON.stringify({
        error: "Missing required parameter",
        message: 'Provide "tmdbId" in query (GET) or body (POST)',
      }),
    };
  }

  try {
    const tmdbIdString = String(tmdbId);

    // Debug logging: Log what we received
    console.log("[goofs-fetch] Received request", {
      tmdbId: tmdbId,
      tmdbIdString: tmdbIdString,
      metadataProvided: !!metadata,
      metadataTmdbId: metadata?.tmdbId,
      metadataId: metadata?.id,
      metadataTitle: metadata?.title,
      metadataGenres: metadata?.genres,
    });

    // If metadata not provided, try to read from Firestore (if we have a titles collection)
    // For now, we require metadata to be passed in
    if (!metadata) {
      // Try to read from a potential Firestore collection (optional)
      if (firestore) {
        try {
          const titleDocument = await firestore
            .collection("titles")
            .doc(tmdbIdString)
            .get();
          if (titleDocument.exists) {
            metadata = { tmdbId: tmdbId, ...titleDocument.data() };
          }
        } catch (error) {
          // Collection might not exist, that's okay
          console.log(
            "[goofs-fetch] No titles collection or error reading:",
            error.message
          );
        }
      }

      // If still no metadata, return error asking for it
      if (!metadata) {
        return {
          statusCode: 400,
          headers: cors(),
          body: JSON.stringify({
            error: "Metadata required",
            message:
              'Provide "metadata" object in POST body with title, mediaType, genres, etc.',
          }),
        };
      }
    }

    // Ensure tmdbId is in metadata
    metadata.tmdbId = metadata.tmdbId || tmdbId;
    metadata.id = metadata.id || tmdbId;

    // Debug logging: Log what we're using to generate insights
    console.log("[goofs-fetch] Generating insights with metadata", {
      tmdbId: metadata.tmdbId,
      id: metadata.id,
      title: metadata.title,
      mediaType: metadata.mediaType,
      genres: metadata.genres,
      year: metadata.year,
    });

    // Generate insights
    const items = buildInsightsForTitle(metadata);

    // Debug logging: Log what was generated
    console.log("[goofs-fetch] Generated insights", {
      itemCount: items.length,
      firstItemId: items[0]?.id || null,
      firstItemText: items[0]?.text?.slice(0, 80) || null,
    });

    const insightsSet = {
      tmdbId: tmdbIdString,
      source: "auto",
      lastUpdated: new Date().toISOString(),
      items: items,
    };

    // Write to Firestore (idempotent - using merge: true to allow safe re-runs)
    if (firestore) {
      try {
        const docPath = `insights/${tmdbIdString}`;
        console.log("[goofs-fetch] Writing to Firestore", {
          docPath: docPath,
          tmdbId: tmdbIdString,
          itemCount: items.length,
          insightsSetTmdbId: insightsSet.tmdbId,
        });

        await firestore
          .collection("insights")
          .doc(tmdbIdString)
          .set(
            {
              ...insightsSet,
              updatedAt: adminInstance.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true } // Idempotent: safe to run multiple times
          );
        console.log(
          `[goofs-fetch] ✅ Wrote ${items.length} insights to Firestore for TMDB ID ${tmdbIdString} at path ${docPath}`
        );

        // Update lastIngestedAt timestamp in /titles collection
        // This tracks when a title was last successfully ingested
        try {
          const titleReference = firestore
            .collection("titles")
            .doc(tmdbIdString);
          await titleReference.update({
            lastIngestedAt:
              adminInstance.firestore.FieldValue.serverTimestamp(),
          });
          console.log(
            `[goofs-fetch] Updated lastIngestedAt for title ${tmdbIdString}`
          );
        } catch (titleUpdateError) {
          // Don't fail ingestion if title update fails - log and continue
          console.warn(
            `[goofs-fetch] Could not update lastIngestedAt for ${tmdbIdString}:`,
            titleUpdateError.message
          );
        }
      } catch (firestoreError) {
        console.error(
          "[goofs-fetch] Firestore write error:",
          firestoreError.message
        );
        // Continue anyway - return the generated insights even if Firestore write fails
      }
    } else {
      console.error(
        "[goofs-fetch] ❌ Firestore not available - insights were NOT written to database!"
      );
      console.error(
        "[goofs-fetch] This means insights were generated but not saved. Check Firebase Admin initialization."
      );
    }

    return {
      statusCode: 200,
      headers: {
        ...cors(),
        "Cache-Control": "no-cache", // Don't cache generated content
      },
      body: JSON.stringify({
        success: true,
        tmdbId: tmdbIdString,
        itemsGenerated: items.length,
        insights: insightsSet,
      }),
    };
  } catch (error) {
    console.error("[goofs-fetch] Error generating insights:", error);
    return {
      statusCode: 500,
      headers: cors(),
      body: JSON.stringify({
        error: "Failed to generate insights",
        message: error.message || String(error),
      }),
    };
  }
};
