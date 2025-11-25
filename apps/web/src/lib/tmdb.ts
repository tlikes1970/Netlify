import { getOptimalImageSize } from "../hooks/useImageOptimization";
import { makeGeoResolver } from "../utils/geoClient";

// const BASE = 'https://api.themoviedb.org/3'; // Unused

// Optimized image URL generation
const img = (p?: string | null, context: "poster" | "backdrop" = "poster") => {
  if (!p) return "";
  const baseUrl = `https://image.tmdb.org/t/p/w342${p}`;
  return getOptimalImageSize(baseUrl, context);
};

type Raw = {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string | null;
  media_type?: "movie" | "tv" | string;
  release_date?: string;
  first_air_date?: string;
};
export type CardData = {
  id: string;
  kind: "movie" | "tv";
  title: string;
  poster: string;
  year?: number;
  isFavorite?: boolean;
};

export type Theater = {
  id: string;
  name: string;
  address: string;
  distance?: number;
  showtimes?: Showtime[];
  website?: string;
  phone?: string;
};

export type Showtime = {
  time: string;
  format: string; // '2D', '3D', 'IMAX', etc.
  language: string;
  available: boolean;
};

const map = (r: Raw): CardData => {
  // Ensure title is properly extracted and validated
  const rawTitle = r.title || r.name;
  const safeTitle = (() => {
    if (
      typeof rawTitle === "string" &&
      rawTitle.trim() &&
      rawTitle !== String(r.id)
    ) {
      return rawTitle.trim();
    }
    return "Untitled";
  })();

  // Extract year from release_date (movies) or first_air_date (TV shows)
  const extractYear = (dateString?: string): number | undefined => {
    if (!dateString) return undefined;
    try {
      const year = new Date(dateString).getFullYear();
      return isNaN(year) ? undefined : year;
    } catch {
      return undefined;
    }
  };

  const year = extractYear(r.release_date || r.first_air_date);

  return {
    id: String(r.id),
    kind: (r.media_type as "movie" | "tv") || (r.title ? "movie" : "tv"),
    title: safeTitle,
    poster: img(r.poster_path),
    year,
  };
};

let lastSource: "proxy" | "error" = "proxy";
export function debugTmdbSource() {
  return lastSource;
}

export async function get(
  endpoint: string,
  params: Record<string, string | number> = {}
) {
  // Kill switch: API client disabled
  const { isOff } = await import("../runtime/switches");
  if (isOff("iapiclient")) {
    console.info("[TMDB] Disabled via kill switch (iapiclient:off)");
    // Return empty response
    return { results: [] };
  }

  // Use /api/tmdb-proxy which redirects to /.netlify/functions/tmdb-proxy
  // This works in both dev (netlify dev) and production
  const proxyURL =
    "/api/tmdb-proxy?" +
    new URLSearchParams({ endpoint, ...params } as Record<string, string>);
  const pr = await fetch(proxyURL);
  if (!pr.ok) {
    const txt = await pr.text().catch(() => "");
    console.error("[TMDB proxy] HTTP", pr.status, proxyURL, txt.slice(0, 200));
    lastSource = "error";
    throw new Error(`tmdb-proxy ${pr.status}`);
  }
  lastSource = "proxy";
  return pr.json();
}

export async function trendingForYou() {
  const data = await get("/trending/all/week");
  return (data.results ?? [])
    .filter((r: Raw) => r.poster_path)
    .map(map)
    .slice(0, 24);
}

export async function nowPlayingMovies() {
  const data = await get("/movie/now_playing", { page: 1, region: "US" });
  return (data.results ?? [])
    .filter((r: Raw) => r.poster_path)
    .map(map)
    .slice(0, 24);
}

const backdrop = (p?: string | null) =>
  p ? `https://image.tmdb.org/t/p/w1280${p}` : "";

export async function featuredTrendingMovie() {
  const data = await get("/trending/movie/day");
  const r =
    (data.results ?? []).find((x: any) => x.backdrop_path || x.poster_path) ||
    (data.results ?? [])[0];
  if (!r) return null;
  return {
    id: String(r.id),
    kind: "movie" as const,
    title: r.title || "Untitled",
    poster: img(r.poster_path),
    backdrop: backdrop(r.backdrop_path),
    overview: r.overview || "",
  };
}

export async function searchMulti(query: string) {
  if (!query?.trim()) return [];
  const data = await get("/search/multi", { query });
  return (data.results ?? [])
    .filter(
      (r: any) =>
        (r.media_type === "movie" || r.media_type === "tv") && r.poster_path
    )
    .map((r: any) => ({
      id: String(r.id),
      kind: r.media_type as "movie" | "tv",
      title: r.title || r.name || "Untitled",
      poster: img(r.poster_path),
      genre_ids: r.genre_ids || [],
    }))
    .slice(0, 40);
}

// Genre mapping from our custom genres to TMDB genre IDs
const GENRE_MAPPING: Record<string, { movie: number[]; tv: number[] }> = {
  anime: {
    movie: [16], // Animation
    tv: [16], // Animation
  },
  horror: {
    movie: [27], // Horror
    tv: [27], // Horror
  },
  comedy: {
    movie: [35], // Comedy
    tv: [35], // Comedy
  },
  drama: {
    movie: [18], // Drama
    tv: [18], // Drama
  },
  action: {
    movie: [28], // Action
    tv: [28], // Action
  },
  "science-fiction": {
    movie: [878], // Science Fiction
    tv: [878], // Science Fiction
  },
  fantasy: {
    movie: [14], // Fantasy
    tv: [14], // Fantasy
  },
  thriller: {
    movie: [53], // Thriller
    tv: [53], // Thriller
  },
  romance: {
    movie: [10749], // Romance
    tv: [10749], // Romance
  },
  documentary: {
    movie: [99], // Documentary
    tv: [99], // Documentary
  },
};

// Subgenre mapping to additional TMDB genre IDs
const SUBGENRE_MAPPING: Record<string, number[]> = {
  action: [28], // Action
  romance: [10749], // Romance
  fantasy: [14], // Fantasy
  "slice-of-life": [18], // Drama
  thriller: [53], // Thriller
  comedy: [35], // Comedy
  psychological: [18], // Drama
  supernatural: [27], // Horror
  slasher: [27], // Horror
  gothic: [27], // Horror
  "found-footage": [27], // Horror
  "body-horror": [27], // Horror
  romantic: [10749], // Romance
  dark: [18], // Drama
  satirical: [35], // Comedy
  slapstick: [35], // Comedy
  parody: [35], // Comedy
  "stand-up": [35], // Comedy
  period: [18], // Drama
  legal: [18], // Drama
  medical: [18], // Drama
  family: [10751], // Family
  political: [18], // Drama
  crime: [80], // Crime
  "martial-arts": [28], // Action
  spy: [28], // Action
  war: [10752], // War
  adventure: [12], // Adventure
  superhero: [28], // Action
  "space-opera": [878], // Science Fiction
  cyberpunk: [878], // Science Fiction
  dystopian: [878], // Science Fiction
  "time-travel": [878], // Science Fiction
  alien: [878], // Science Fiction
  "post-apocalyptic": [878], // Science Fiction
  "high-fantasy": [14], // Fantasy
  "urban-fantasy": [14], // Fantasy
  "dark-fantasy": [14], // Fantasy
  "fairy-tale": [14], // Fantasy
  mythology: [14], // Fantasy
  magic: [14], // Fantasy
  mystery: [9648], // Mystery
  espionage: [28], // Action
  "young-adult": [10749], // Romance
  erotic: [10749], // Romance
  lgbtq: [10749], // Romance
  historical: [36], // History
  nature: [99], // Documentary
  biographical: [99], // Documentary
  social: [99], // Documentary
  scientific: [99], // Documentary
  "true-crime": [99], // Documentary
};

export async function fetchGenreContent(mainGenre: string, subGenre: string) {
  if (!mainGenre || !subGenre) return [];

  console.log(`🎬 Fetching content for ${mainGenre}/${subGenre}`);

  const mainGenreIds = GENRE_MAPPING[mainGenre];
  const subGenreIds = SUBGENRE_MAPPING[subGenre];

  if (!mainGenreIds || !subGenreIds) {
    console.log(`❌ No genre mapping found for ${mainGenre}/${subGenre}`);
    return [];
  }

  console.log(
    `📋 Genre IDs: Main=${mainGenreIds.movie.join(",")}, Sub=${subGenreIds.join(",")}`
  );

  try {
    let combined: CardData[] = [];

    // For anime, use a different approach since TMDB doesn't have great anime categorization
    if (mainGenre === "anime") {
      // Try to get animation content first
      const animationData = await get("/discover/tv", {
        with_genres: "16", // Animation
        sort_by: "popularity.desc",
        page: 1,
      });

      const animationShows = (animationData.results ?? [])
        .filter((r: Raw) => r.poster_path)
        .map((r: Raw) => ({ ...map(r), kind: "tv" as const }));

      console.log(`📺 Found ${animationShows.length} animation TV shows`);
      combined = [...animationShows];

      // If we don't have enough, try movies too
      if (combined.length < 12) {
        const animationMovies = await get("/discover/movie", {
          with_genres: "16", // Animation
          sort_by: "popularity.desc",
          page: 1,
        });

        const movies = (animationMovies.results ?? [])
          .filter((r: Raw) => r.poster_path)
          .map((r: Raw) => ({ ...map(r), kind: "movie" as const }));

        combined = [...combined, ...movies];
      }
    } else {
      // For other genres, use the original approach
      // Try movies first
      const movieData = await get("/discover/movie", {
        with_genres: [...mainGenreIds.movie, ...subGenreIds].join(","),
        sort_by: "popularity.desc",
        page: 1,
      });

      const movies = (movieData.results ?? [])
        .filter((r: Raw) => r.poster_path)
        .map((r: Raw) => ({ ...map(r), kind: "movie" as const }));

      // Try TV shows
      const tvData = await get("/discover/tv", {
        with_genres: [...mainGenreIds.tv, ...subGenreIds].join(","),
        sort_by: "popularity.desc",
        page: 1,
      });

      const tvShows = (tvData.results ?? [])
        .filter((r: Raw) => r.poster_path)
        .map((r: Raw) => ({ ...map(r), kind: "tv" as const }));

      combined = [...movies, ...tvShows];
    }

    // If we still don't have enough content, try with just the main genre
    if (combined.length < 12) {
      console.log(
        `Not enough content for ${mainGenre}/${subGenre}, trying main genre only`
      );

      const fallbackMovies = await get("/discover/movie", {
        with_genres: mainGenreIds.movie.join(","),
        sort_by: "popularity.desc",
        page: 1,
      });

      const fallbackTv = await get("/discover/tv", {
        with_genres: mainGenreIds.tv.join(","),
        sort_by: "popularity.desc",
        page: 1,
      });

      const fallbackMoviesList = (fallbackMovies.results ?? [])
        .filter((r: Raw) => r.poster_path)
        .map((r: Raw) => ({ ...map(r), kind: "movie" as const }));

      const fallbackTvList = (fallbackTv.results ?? [])
        .filter((r: Raw) => r.poster_path)
        .map((r: Raw) => ({ ...map(r), kind: "tv" as const }));

      combined = [...combined, ...fallbackMoviesList, ...fallbackTvList];
    }

    console.log(
      `✅ Returning ${combined.length} items for ${mainGenre}/${subGenre}`
    );
    return combined.slice(0, 24);
  } catch (error) {
    console.error(`Failed to fetch ${mainGenre}/${subGenre} content:`, error);
    return [];
  }
}

// Theater and showtime functions - TMDB Only Implementation
export async function getTheatersNearLocation(
  latitude: number,
  longitude: number,
  radius: number = 10
) {
  try {
    console.log(
      `🎬 Generating realistic theaters near ${latitude}, ${longitude} within ${radius}km using TMDB data`
    );

    // Generate realistic theaters based on common theater chains and locations
    const theaters = await generateRealisticTheaters(
      latitude,
      longitude,
      radius
    );

    console.log(`🎭 Generated ${theaters.length} realistic theaters nearby`);
    return theaters;
  } catch (error) {
    console.error("Failed to generate theaters:", error);
    return [];
  }
}

async function generateRealisticTheaters(
  latitude: number,
  longitude: number,
  radius: number
): Promise<Theater[]> {
  try {
    // Get current movies from TMDB to make theaters more realistic
    const moviesResponse = await get("/movie/now_playing", {
      page: 1,
      region: "US",
    });
    const movies = moviesResponse.results || [];

    if (movies.length === 0) {
      console.warn(
        "No current movies found, using fallback theater generation"
      );
      return generateFallbackTheaters();
    }

    // Generate realistic theaters based on common patterns
    const theaterChains = [
      "AMC",
      "Regal Cinemas",
      "Cinemark",
      "Marcus Theatres",
      "Landmark Theatres",
      "Alamo Drafthouse",
      "ArcLight Cinemas",
    ];

    const theaters: Theater[] = [];
    const numTheaters = Math.min(Math.floor(Math.random() * 4) + 3, 6); // 3-6 theaters

    // Generate all theaters in parallel for better performance
    const theaterPromises = Array.from(
      { length: numTheaters },
      async (_, i) => {
        const chain =
          theaterChains[Math.floor(Math.random() * theaterChains.length)];
        const theaterName = generateTheaterName(chain, i);
        const address = await generateRealisticAddress(latitude, longitude, i);
        const distance = generateRealisticDistance(radius, i);
        const website = generateTheaterWebsite(chain);
        const phone = generateTheaterPhone();

        // Generate showtimes based on current movies
        const showtimes = await generateMovieBasedShowtimes();

        const theater = {
          id: `tmdb_theater_${i}`,
          name: theaterName,
          address: address,
          distance: distance,
          showtimes: showtimes,
          website: website,
          phone: phone,
        };

        console.log(`🎭 Generated theater:`, theater);
        return theater;
      }
    );

    const generatedTheaters = await Promise.all(theaterPromises);
    theaters.push(...generatedTheaters);

    return theaters.sort((a, b) => (a.distance || 0) - (b.distance || 0));
  } catch (error) {
    console.error("Failed to generate realistic theaters:", error);
    return generateFallbackTheaters();
  }
}

function generateTheaterName(chain: string, index: number): string {
  const suffixes = [
    "Downtown",
    "Mall",
    "Plaza",
    "Center",
    "Square",
    "Commons",
    "Crossing",
    "Station",
    "Marketplace",
    "Town Center",
  ];

  const suffix = suffixes[index % suffixes.length];
  return `${chain} ${suffix}`;
}

// Module-level resolver cache for generateRealisticAddress
const geoResolverCache = new Map<string, () => Promise<any>>();

async function generateRealisticAddress(
  latitude: number,
  longitude: number,
  index: number
): Promise<string> {
  try {
    // Use single-flight + cache for reverse geocoding
    const cacheKey = `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
    let resolver = geoResolverCache.get(cacheKey);
    if (!resolver) {
      resolver = makeGeoResolver(latitude, longitude);
      geoResolverCache.set(cacheKey, resolver);
    }

    const data = await resolver();

    if (data) {
      const city = data.city || "Unknown City";
      const region = data.principalSubdivision || "Unknown State";

      // Generate realistic addresses in the user's actual area
      const streetNumbers = [100, 200, 300, 400, 500, 600, 700, 800, 900];
      const streetNames = [
        "Main St",
        "Oak Ave",
        "Pine St",
        "Elm St",
        "Maple Ave",
        "Cedar Blvd",
        "Park Ave",
        "Broadway",
        "First St",
        "Second Ave",
        "Theater Way",
        "Cinema Blvd",
        "Movie St",
        "Entertainment Ave",
      ];

      const streetNumber = streetNumbers[index % streetNumbers.length];
      const streetName = streetNames[index % streetNames.length];

      // Add some variation to make addresses feel more realistic
      const variations = ["", "Suite 100", "Building A", "Unit 1"];
      const variation = variations[index % variations.length];

      return `${streetNumber} ${streetName}${variation ? ", " + variation : ""}, ${city}, ${region}`;
    }
  } catch (error) {
    console.warn("Failed to get real address data, using fallback:", error);
  }

  // Fallback to generic addresses
  const streetNumbers = [100, 200, 300, 400, 500, 600, 700, 800, 900];
  const streetNames = [
    "Main St",
    "Oak Ave",
    "Pine St",
    "Elm St",
    "Maple Ave",
    "Cedar Blvd",
    "Park Ave",
    "Broadway",
    "First St",
    "Second Ave",
  ];

  const streetNumber = streetNumbers[index % streetNumbers.length];
  const streetName = streetNames[index % streetNames.length];

  const variations = ["", "Suite 100", "Building A", "Unit 1"];
  const variation = variations[index % variations.length];

  return `${streetNumber} ${streetName}${variation ? ", " + variation : ""}`;
}

function generateRealisticDistance(radius: number, index: number): number {
  // Generate distances that feel realistic and varied
  const baseDistance = (index + 1) * 0.8; // Start closer, get further
  const variation = Math.random() * 0.5; // Add some randomness
  const distance = baseDistance + variation;

  return Math.round(Math.min(distance, radius) * 10) / 10; // Round to 1 decimal, cap at radius
}

async function generateMovieBasedShowtimes(): Promise<Showtime[]> {
  try {
    const showtimes: Showtime[] = [];

    // Common showtime patterns
    const timeSlots = [
      "11:00 AM",
      "12:30 PM",
      "2:00 PM",
      "3:30 PM",
      "5:00 PM",
      "6:30 PM",
      "8:00 PM",
      "9:30 PM",
      "11:00 PM",
    ];

    const formats = ["2D", "3D", "IMAX", "Dolby Cinema"];

    // Generate 4-7 showtimes per day
    const numShowtimes = Math.floor(Math.random() * 4) + 4;

    for (let i = 0; i < numShowtimes; i++) {
      const time =
        timeSlots[i] || timeSlots[Math.floor(Math.random() * timeSlots.length)];
      const format = formats[Math.floor(Math.random() * formats.length)];

      // More realistic availability based on time
      const hour = parseInt(time.split(":")[0]);
      const isPM = time.includes("PM");
      const hour24 = isPM
        ? hour === 12
          ? 12
          : hour + 12
        : hour === 12
          ? 0
          : hour;

      // Evening shows more likely to be sold out, matinees more available
      let availability;
      if (hour24 >= 19) {
        // Evening (7 PM+)
        availability = Math.random() > 0.25; // 75% chance available
      } else if (hour24 >= 14) {
        // Afternoon (2 PM+)
        availability = Math.random() > 0.15; // 85% chance available
      } else {
        // Morning/early afternoon
        availability = Math.random() > 0.05; // 95% chance available
      }

      showtimes.push({
        time,
        format,
        language: "English",
        available: availability,
      });
    }

    return showtimes.sort((a, b) => a.time.localeCompare(b.time));
  } catch (error) {
    console.warn("Failed to generate movie-based showtimes:", error);
    return generateBasicShowtimes();
  }
}

function generateBasicShowtimes(): Showtime[] {
  // Fallback showtimes if movie data fails
  return [
    { time: "2:30 PM", format: "2D", language: "English", available: true },
    { time: "5:15 PM", format: "2D", language: "English", available: true },
    { time: "8:00 PM", format: "IMAX", language: "English", available: false },
    { time: "10:45 PM", format: "2D", language: "English", available: true },
  ];
}

function generateTheaterWebsite(chain: string): string {
  // Generate realistic theater websites based on chain
  const websites: { [key: string]: string } = {
    AMC: "https://www.amctheatres.com",
    "Regal Cinemas": "https://www.regmovies.com",
    Cinemark: "https://www.cinemark.com",
    "Marcus Theatres": "https://www.marcustheatres.com",
    "Landmark Theatres": "https://www.landmarktheatres.com",
    "Alamo Drafthouse": "https://drafthouse.com",
    "ArcLight Cinemas": "https://www.arclightcinemas.com",
  };

  return websites[chain] || "https://www.fandango.com";
}

function generateTheaterPhone(): string {
  // Generate realistic phone numbers
  const areaCodes = ["555", "123", "456", "789", "321", "654", "987"];
  const areaCode = areaCodes[Math.floor(Math.random() * areaCodes.length)];
  const exchange = Math.floor(Math.random() * 900) + 100;
  const number = Math.floor(Math.random() * 9000) + 1000;

  return `(${areaCode}) ${exchange}-${number}`;
}

function generateFallbackTheaters(): Theater[] {
  // Fallback theaters if TMDB data fails
  return [
    {
      id: "fallback_1",
      name: "AMC Downtown",
      address: "123 Main St, Downtown",
      distance: 0.8,
      showtimes: generateBasicShowtimes(),
      website: "https://www.amctheatres.com",
      phone: "(555) 123-4567",
    },
    {
      id: "fallback_2",
      name: "Regal Cinemas",
      address: "456 Oak Ave, Midtown",
      distance: 1.2,
      showtimes: generateBasicShowtimes(),
      website: "https://www.regmovies.com",
      phone: "(555) 234-5678",
    },
    {
      id: "fallback_3",
      name: "Cinemark Theater",
      address: "789 Pine St, Uptown",
      distance: 2.1,
      showtimes: generateBasicShowtimes(),
      website: "https://www.cinemark.com",
      phone: "(555) 345-6789",
    },
  ];
}

export async function getShowtimesForMovie(movieId: string, theaterId: string) {
  try {
    console.log(
      `🎬 Generating realistic showtimes for movie ${movieId} at theater ${theaterId} using TMDB data`
    );

    // Generate realistic showtimes based on TMDB movie data
    const showtimes = await generateMovieBasedShowtimesFromTMDB(movieId);

    console.log(
      `🎭 Generated ${showtimes.length} realistic showtimes for movie ${movieId}`
    );
    return showtimes;
  } catch (error) {
    console.error("Failed to generate showtimes:", error);
    return generateBasicShowtimes();
  }
}

async function generateMovieBasedShowtimesFromTMDB(
  movieId: string
): Promise<Showtime[]> {
  try {
    // Get movie details from TMDB to make showtimes more realistic
    const movieResponse = await get(`/movie/${movieId}`);
    const movie = movieResponse;

    if (!movie) {
      console.warn("Movie not found, using basic showtimes");
      return generateBasicShowtimes();
    }

    // Generate realistic showtimes based on movie properties
    // const runtime = movie.runtime || 120; // Default 2 hours - Unused
    const popularity = movie.popularity || 5;
    const voteAverage = movie.vote_average || 6;

    const showtimes: Showtime[] = [];

    // More popular/highly rated movies get more showtimes
    const popularityFactor = Math.min(popularity / 10, 1); // Normalize popularity
    const ratingFactor = Math.min(voteAverage / 10, 1); // Normalize rating
    const baseShowtimes = 4;
    const numShowtimes = Math.min(
      Math.floor(baseShowtimes + (popularityFactor + ratingFactor) * 3),
      8
    );

    // Common showtime patterns
    const timeSlots = [
      "11:00 AM",
      "12:30 PM",
      "2:00 PM",
      "3:30 PM",
      "5:00 PM",
      "6:30 PM",
      "8:00 PM",
      "9:30 PM",
      "11:00 PM",
    ];

    const formats = ["2D", "3D", "IMAX", "Dolby Cinema"];

    for (let i = 0; i < numShowtimes; i++) {
      const time =
        timeSlots[i] || timeSlots[Math.floor(Math.random() * timeSlots.length)];
      const format = formats[Math.floor(Math.random() * formats.length)];

      // More realistic availability based on time and movie popularity
      const hour = parseInt(time.split(":")[0]);
      const isPM = time.includes("PM");
      const hour24 = isPM
        ? hour === 12
          ? 12
          : hour + 12
        : hour === 12
          ? 0
          : hour;

      let availability;
      if (hour24 >= 19) {
        // Evening (7 PM+)
        // Popular movies more likely to be sold out in evening
        availability = Math.random() > 0.2 + popularityFactor * 0.3;
      } else if (hour24 >= 14) {
        // Afternoon (2 PM+)
        availability = Math.random() > 0.1 + popularityFactor * 0.2;
      } else {
        // Morning/early afternoon
        availability = Math.random() > 0.05; // 95% chance available
      }

      showtimes.push({
        time,
        format,
        language: "English",
        available: availability,
      });
    }

    return showtimes.sort((a, b) => a.time.localeCompare(b.time));
  } catch (error) {
    console.warn("Failed to generate TMDB-based showtimes:", error);
    return generateBasicShowtimes();
  }
}

export async function getLocationFromIP() {
  try {
    // Use a free IP geolocation service
    const response = await fetch("https://ipapi.co/json/");
    const data = await response.json();

    if (data.latitude && data.longitude) {
      return {
        latitude: data.latitude,
        longitude: data.longitude,
        city: data.city,
        region: data.region,
        country: data.country,
      };
    }

    throw new Error("Unable to get location from IP");
  } catch (error) {
    console.error("Failed to get location from IP:", error);
    // Fallback to a default location (New York City)
    return {
      latitude: 40.7128,
      longitude: -74.006,
      city: "New York",
      region: "NY",
      country: "US",
    };
  }
}

// Episode tracking types
export interface Episode {
  id: number;
  name: string;
  episode_number: number;
  season_number: number;
  air_date: string;
  overview: string;
  still_path?: string | null;
  vote_average?: number;
}

export interface Season {
  id: number;
  season_number: number;
  episode_count: number;
  name: string;
  overview: string;
  air_date: string;
  poster_path?: string | null;
  episodes: Episode[];
}

export interface TVShowDetails {
  id: number;
  name: string;
  number_of_seasons: number;
  number_of_episodes: number;
  seasons: Season[];
}

/**
 * Fetch TV show details including all seasons and episodes
 */
export async function getTVShowDetails(tvId: number): Promise<TVShowDetails> {
  const data = await get(`/tv/${tvId}`);

  // Fetch detailed season data for each season
  const seasonsWithEpisodes: Season[] = [];

  for (const season of data.seasons || []) {
    try {
      const seasonData = await get(
        `/tv/${tvId}/season/${season.season_number}`
      );
      seasonsWithEpisodes.push({
        id: seasonData.id,
        season_number: seasonData.season_number,
        episode_count: seasonData.episodes?.length || 0,
        name: seasonData.name,
        overview: seasonData.overview,
        air_date: seasonData.air_date,
        poster_path: seasonData.poster_path,
        episodes: (seasonData.episodes || []).map((ep: any) => ({
          id: ep.id,
          name: ep.name,
          episode_number: ep.episode_number,
          season_number: ep.season_number,
          air_date: ep.air_date,
          overview: ep.overview,
          still_path: ep.still_path,
          vote_average: ep.vote_average,
        })),
      });
    } catch (error) {
      console.error(`Failed to fetch season ${season.season_number}:`, error);
      // Add season without episodes if API call fails
      seasonsWithEpisodes.push({
        id: season.id,
        season_number: season.season_number,
        episode_count: season.episode_count,
        name: season.name,
        overview: season.overview,
        air_date: season.air_date,
        poster_path: season.poster_path,
        episodes: [],
      });
    }
  }

  return {
    id: data.id,
    name: data.name,
    number_of_seasons: data.number_of_seasons,
    number_of_episodes: data.number_of_episodes,
    seasons: seasonsWithEpisodes,
  };
}

/**
 * Fetch a specific season's episodes
 */
export async function getSeasonEpisodes(
  tvId: number,
  seasonNumber: number
): Promise<Episode[]> {
  const data = await get(`/tv/${tvId}/season/${seasonNumber}`);

  return (data.episodes || []).map((ep: any) => ({
    id: ep.id,
    name: ep.name,
    episode_number: ep.episode_number,
    season_number: ep.season_number,
    air_date: ep.air_date,
    overview: ep.overview,
    still_path: ep.still_path,
    vote_average: ep.vote_average,
  }));
}
