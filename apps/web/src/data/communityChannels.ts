/**
 * Process: Community Player Channel Schema and Data
 * Purpose: Define channel types and provide starter content for multi-channel player
 * Data Source: Static channel definitions with Archive.org and streaming sources
 * Update Path: Add/modify channels here, player reads from COMMUNITY_CHANNELS array
 * Dependencies: CommunityPlayer.tsx
 */

/**
 * Channel content types:
 * - "live": Live streaming content (e.g., NASA TV, webcams)
 * - "loop": Looping video content (e.g., Archive.org films)
 * - "short": Short-form clips (≤27 seconds)
 * - "audio": Audio-only streams (e.g., SomaFM)
 */
export type ChannelType = "live" | "loop" | "short" | "audio";

/**
 * Community channel definition
 */
export interface CommunityChannel {
  /** Unique identifier */
  id: string;
  /** Display title */
  title: string;
  /** Content type */
  type: ChannelType;
  /** HLS/MP4/iframe embed URL */
  url: string;
  /** Array of thumbnail URLs for rotation (pick one per 6hr) */
  thumbnails: string[];
  /** true = auto-generated, string = VTT URL */
  captions: boolean | string;
  /** Micro-genre labels for display (#Vintage, #Space, etc.) */
  genreTags: string[];
  /** Short description (1-2 sentences) */
  description?: string;
  /** Whether to autoplay (default: true for shorts) */
  autoplay?: boolean;
  /** Whether to start muted (default: true for autoplay) */
  muteStart?: boolean;
  /** For audio-only streams */
  isAudioOnly?: boolean;
  /** Duration in seconds, required for type="short" (must be ≤27s) */
  duration?: number;
  /** Attribution source (e.g., "Internet Archive") */
  source?: string;
}

/**
 * Channel queue state for multi-channel navigation
 */
export interface ChannelQueue {
  /** Current channel index */
  currentIndex: number;
  /** All available channels */
  channels: CommunityChannel[];
  /** ISO timestamp for thumbnail rotation tracking */
  lastRotation: string;
}

/**
 * Validate short-form duration (must be ≤27 seconds)
 */
export function isValidShortDuration(channel: CommunityChannel): boolean {
  if (channel.type !== "short") return true;
  return typeof channel.duration === "number" && channel.duration <= 27;
}

/**
 * Convert legacy weekly-film.json format to new channel schema
 */
export function convertLegacyFilm(
  weekOf: string,
  itemId: string
): CommunityChannel {
  return {
    id: `legacy-${itemId}`,
    title: "Weekly Film",
    type: "loop",
    url: `https://archive.org/embed/${itemId}`,
    thumbnails: [`https://archive.org/services/img/${itemId}`],
    captions: false,
    genreTags: ["#Classic", "#Film"],
    description: `Week of ${weekOf} community film.`,
    autoplay: false,
    muteStart: true,
    source: "Internet Archive",
  };
}

/**
 * Get thumbnail index based on 6-hour rotation
 */
export function getThumbnailIndex(
  thumbnails: string[],
  lastRotation: string
): number {
  if (thumbnails.length <= 1) return 0;

  const rotationTime = new Date(lastRotation).getTime();
  const now = Date.now();
  const hoursSinceRotation = (now - rotationTime) / (1000 * 60 * 60);
  const rotationPeriods = Math.floor(hoursSinceRotation / 6);

  return rotationPeriods % thumbnails.length;
}

/**
 * Starter channel list
 * 14 channels total: 8 live/loop + 6 shorts
 */
export const COMMUNITY_CHANNELS: CommunityChannel[] = [
  // === LIVE CHANNELS ===
  {
    id: "nasa-iss",
    title: "NASA TV – ISS Live",
    type: "live",
    url: "https://www.youtube.com/embed/xRPTBhmcyXY?autoplay=1&mute=1",
    thumbnails: [
      "https://img.youtube.com/vi/xRPTBhmcyXY/maxresdefault.jpg",
    ],
    captions: false,
    genreTags: ["#Space", "#Live"],
    description: "Live view from the International Space Station.",
    autoplay: true,
    muteStart: true,
    source: "NASA",
  },
  {
    id: "lofi-beats",
    title: "Lofi Girl Radio",
    type: "live",
    url: "https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&mute=1",
    thumbnails: [
      "https://img.youtube.com/vi/jfKfPfyJRdk/maxresdefault.jpg",
    ],
    captions: false,
    genreTags: ["#Music", "#Chill"],
    description: "24/7 lofi hip hop beats to relax/study to.",
    autoplay: true,
    muteStart: true,
    source: "Lofi Girl",
  },

  // === LOOP CHANNELS (Archive.org films) ===
  {
    id: "house-haunted-hill",
    title: "House on Haunted Hill (1959)",
    type: "loop",
    url: "https://archive.org/embed/House_On_Haunted_Hill.avi",
    thumbnails: [
      "https://archive.org/services/img/House_On_Haunted_Hill.avi",
    ],
    captions: false,
    genreTags: ["#Horror", "#Classic"],
    description: "Vincent Price hosts a haunted house party. Classic horror.",
    autoplay: false,
    muteStart: true,
    source: "Internet Archive",
  },
  {
    id: "night-living-dead",
    title: "Night of the Living Dead (1968)",
    type: "loop",
    url: "https://archive.org/embed/night_of_the_living_dead",
    thumbnails: [
      "https://archive.org/services/img/night_of_the_living_dead",
    ],
    captions: false,
    genreTags: ["#Horror", "#Zombie"],
    description: "George Romero's genre-defining zombie classic.",
    autoplay: false,
    muteStart: true,
    source: "Internet Archive",
  },
  {
    id: "the-general",
    title: "The General (1926)",
    type: "loop",
    url: "https://archive.org/embed/TheGeneral",
    thumbnails: [
      "https://archive.org/services/img/TheGeneral",
    ],
    captions: false,
    genreTags: ["#Comedy", "#Silent"],
    description: "Buster Keaton's Civil War train chase masterpiece.",
    autoplay: false,
    muteStart: true,
    source: "Internet Archive",
  },
  {
    id: "his-girl-friday",
    title: "His Girl Friday (1940)",
    type: "loop",
    url: "https://archive.org/embed/HisGirlFriday1940",
    thumbnails: [
      "https://archive.org/services/img/HisGirlFriday1940",
    ],
    captions: false,
    genreTags: ["#Comedy", "#Romance"],
    description: "Rapid-fire dialogue and screwball comedy at its best.",
    autoplay: false,
    muteStart: true,
    source: "Internet Archive",
  },
  {
    id: "carnival-of-souls",
    title: "Carnival of Souls (1962)",
    type: "loop",
    url: "https://archive.org/embed/carnival_of_souls",
    thumbnails: [
      "https://archive.org/services/img/carnival_of_souls",
    ],
    captions: false,
    genreTags: ["#Horror", "#Atmospheric"],
    description: "Eerie, dreamlike horror about a woman drawn to the dead.",
    autoplay: false,
    muteStart: true,
    source: "Internet Archive",
  },
  {
    id: "detour",
    title: "Detour (1945)",
    type: "loop",
    url: "https://archive.org/embed/Detour",
    thumbnails: [
      "https://archive.org/services/img/Detour",
    ],
    captions: false,
    genreTags: ["#Noir", "#Crime"],
    description: "A hitchhiking pianist's road trip goes very wrong.",
    autoplay: false,
    muteStart: true,
    source: "Internet Archive",
  },

  // === SHORT-FORM CLIPS (≤27 seconds) ===
  // NOTE: Shorts use Archive.org embed format for reliability
  // To add custom shorts, find items at archive.org/details/movies and use embed URL
  {
    id: "short-lets-go-movies",
    title: "Let's Go to the Movies!",
    type: "short",
    url: "https://archive.org/embed/Lets_All_Go_To_The_Lobby",
    thumbnails: [
      "https://archive.org/services/img/Lets_All_Go_To_The_Lobby",
    ],
    captions: false,
    genreTags: ["#Vintage", "#Nostalgia"],
    description: "Classic 'Let's all go to the lobby' intermission reel.",
    duration: 27,
    autoplay: true,
    muteStart: true,
    source: "Internet Archive",
  },
  {
    id: "short-countdown-academy",
    title: "Academy Leader Countdown",
    type: "short",
    url: "https://archive.org/embed/academy_leader_countdown",
    thumbnails: [
      "https://archive.org/services/img/academy_leader_countdown",
    ],
    captions: false,
    genreTags: ["#Cinema", "#Nostalgic"],
    description: "The classic film countdown leader.",
    duration: 15,
    autoplay: true,
    muteStart: true,
    source: "Internet Archive",
  },
  {
    id: "short-duck-and-cover",
    title: "Duck and Cover",
    type: "short",
    url: "https://archive.org/embed/DuckandC1951",
    thumbnails: [
      "https://archive.org/services/img/DuckandC1951",
    ],
    captions: false,
    genreTags: ["#Educational", "#Retro"],
    description: "Bert the Turtle teaches Cold War safety.",
    duration: 27,
    autoplay: true,
    muteStart: true,
    source: "Internet Archive",
  },
  {
    id: "short-color-bars",
    title: "SMPTE Color Bars",
    type: "short",
    url: "https://archive.org/embed/SMPTEColorBars",
    thumbnails: [
      "https://archive.org/services/img/SMPTEColorBars",
    ],
    captions: false,
    genreTags: ["#Vintage", "#Aesthetic"],
    description: "Classic broadcast color calibration bars.",
    duration: 15,
    autoplay: true,
    muteStart: true,
    source: "Internet Archive",
  },
  {
    id: "short-popeye",
    title: "Popeye: A Date to Skate",
    type: "short",
    url: "https://archive.org/embed/Popeye_A_Date_To_Skate",
    thumbnails: [
      "https://archive.org/services/img/Popeye_A_Date_To_Skate",
    ],
    captions: false,
    genreTags: ["#Animation", "#Classic"],
    description: "Classic Popeye cartoon from 1938.",
    duration: 27,
    autoplay: true,
    muteStart: true,
    source: "Internet Archive",
  },
  {
    id: "short-betty-boop",
    title: "Betty Boop: Minnie the Moocher",
    type: "short",
    url: "https://archive.org/embed/Betty_Boop_Minnie_the_Moocher",
    thumbnails: [
      "https://archive.org/services/img/Betty_Boop_Minnie_the_Moocher",
    ],
    captions: false,
    genreTags: ["#Animation", "#Classic"],
    description: "Betty Boop meets Cab Calloway in this 1932 classic.",
    duration: 27,
    autoplay: true,
    muteStart: true,
    source: "Internet Archive",
  },
];

/**
 * Get channels filtered by type
 */
export function getChannelsByType(type: ChannelType): CommunityChannel[] {
  return COMMUNITY_CHANNELS.filter((c) => c.type === type);
}

/**
 * Get valid short-form channels (≤27s duration)
 */
export function getValidShorts(): CommunityChannel[] {
  return COMMUNITY_CHANNELS.filter(
    (c) => c.type === "short" && isValidShortDuration(c)
  );
}

/**
 * Create initial channel queue
 */
export function createChannelQueue(
  channels: CommunityChannel[] = COMMUNITY_CHANNELS
): ChannelQueue {
  return {
    currentIndex: 0,
    channels,
    lastRotation: new Date().toISOString(),
  };
}

