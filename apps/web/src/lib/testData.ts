import { Library } from './storage';
import type { MediaItem } from '../components/cards/card.types';
import { fetchNextAirDate } from '../tmdb/tv';

// Test data for development
const TEST_MOVIES: MediaItem[] = [
  {
    id: '550',
    mediaType: 'movie',
    title: 'Fight Club',
    year: '1999',
    posterUrl: 'https://image.tmdb.org/t/p/w342/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
    voteAverage: 8.4,
    synopsis: 'A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy. Their concept catches on, with underground "fight clubs" forming in every town, until an eccentric gets in the way and ignites an out-of-control spiral toward oblivion.'
  },
  {
    id: '13',
    mediaType: 'movie',
    title: 'Forrest Gump',
    year: '1994',
    posterUrl: 'https://image.tmdb.org/t/p/w342/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg',
    voteAverage: 8.5,
    synopsis: 'A man with a low IQ has accomplished great things in his life and been present during significant historic events—in each case, far exceeding what anyone imagined he could do. But despite all he has achieved, his one true love eludes him.'
  },
  {
    id: '238',
    mediaType: 'movie',
    title: 'The Godfather',
    year: '1972',
    posterUrl: 'https://image.tmdb.org/t/p/w342/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
    voteAverage: 8.7,
    synopsis: 'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son. Spanning the years 1945 to 1955, a chronicle of the fictional Italian-American Corleone crime family.'
  }
];

const TEST_TV_SHOWS: MediaItem[] = [
  {
    id: '1399',
    mediaType: 'tv',
    title: 'Game of Thrones',
    year: '2011',
    posterUrl: 'https://image.tmdb.org/t/p/w342/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg',
    voteAverage: 8.3,
    synopsis: 'Seven noble families fight for control of the mythical land of Westeros. Friction between the houses leads to full-scale war. All while a very ancient evil awakens in the farthest north. Amidst the war, a neglected military order of misfits, the Night\'s Watch, is all that stands between the realms of men and icy horrors beyond.'
  },
  {
    id: '1396',
    mediaType: 'tv',
    title: 'Breaking Bad',
    year: '2008',
    posterUrl: 'https://image.tmdb.org/t/p/w342/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
    voteAverage: 8.9,
    synopsis: 'A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine in order to secure his family\'s future. As he descends deeper into the criminal underworld, Walter White\'s transformation from mild-mannered teacher to ruthless drug kingpin becomes increasingly complex.'
  },
  {
    id: '1398',
    mediaType: 'tv',
    title: 'The Sopranos',
    year: '1999',
    posterUrl: 'https://image.tmdb.org/t/p/w342/rTc7ZXdroqjkKivFPvCPX0Ru7uw.jpg',
    voteAverage: 8.5,
    synopsis: 'New Jersey mob boss Tony Soprano deals with personal and professional issues in his home and business life. As he struggles to balance the demands of his crime family with those of his nuclear family, Tony begins seeing a psychiatrist to help him deal with his panic attacks and anxiety.'
  },
  // Currently airing shows with next air dates
  {
    id: '82856',
    mediaType: 'tv',
    title: 'The Mandalorian',
    year: '2019',
    posterUrl: 'https://image.tmdb.org/t/p/w342/eU1i6eHXlzMOlEq0ku1Rzq7Y4wA.jpg',
    voteAverage: 8.5,
    synopsis: 'The travels of a lone bounty hunter in the outer reaches of the galaxy, far from the authority of the New Republic.',
    nextAirDate: '2024-12-18' // Mock upcoming episode date
  },
  {
    id: '94997',
    mediaType: 'tv',
    title: 'House of the Dragon',
    year: '2022',
    posterUrl: 'https://image.tmdb.org/t/p/w342/z2yahl2uefxDCl0nogcRBstwruJ.jpg',
    voteAverage: 8.4,
    synopsis: 'The Targaryen dynasty is at the absolute apex of its power, with more than 15 dragons under their yoke.',
    nextAirDate: '2024-12-25' // Mock upcoming episode date
  }
];

export function addTestData() {
  console.log('🎬 Adding test data to Library...');
  
  // Add some movies to wishlist
  TEST_MOVIES.forEach(movie => {
    Library.upsert(movie, 'wishlist');
  });
  
  // Add some TV shows to watching
  TEST_TV_SHOWS.forEach(show => {
    Library.upsert(show, 'watching');
  });
  
  // Add one movie to watched
  Library.upsert(TEST_MOVIES[0], 'watched');
  
  console.log('✅ Test data added successfully!');
  console.log('📊 Current Library state:', {
    watching: Library.getByList('watching').length,
    wishlist: Library.getByList('wishlist').length,
    watched: Library.getByList('watched').length,
    not: Library.getByList('not').length
  });
}

export function clearTestData() {
  console.log('🗑️ Clearing test data from Library...');
  
  // Clear all lists
  ['watching', 'wishlist', 'watched', 'not'].forEach(list => {
    const items = Library.getByList(list as any);
    items.forEach(item => {
      Library.remove(item.id, item.mediaType);
    });
  });
  
  console.log('✅ Test data cleared successfully!');
}

export async function populateNextAirDates() {
  console.log('📺 Populating next air dates for TV shows...');
  
  const watching = Library.getByList('watching');
  const tvShows = watching.filter(item => item.mediaType === 'tv');
  
  console.log(`Found ${tvShows.length} TV shows to update`);
  
  for (const show of tvShows) {
    try {
      console.log(`🔍 Fetching next air date for: ${show.title} (current: ${show.nextAirDate || 'none'})`);
      const nextAirDate = await fetchNextAirDate(Number(show.id));
      if (nextAirDate) {
        // Update the show with next air date
        const updatedShow = { ...show, nextAirDate };
        Library.upsert(updatedShow, 'watching');
        
        // Verify the update worked
        const verifyShow = Library.getByList('watching').find(item => item.id === show.id);
        console.log(`✅ Updated ${show.title} with next air date: ${nextAirDate}`);
        console.log(`🔍 Verification - Show in Library:`, verifyShow?.nextAirDate);
        
        // Small delay to ensure React processes the update
        await new Promise(resolve => setTimeout(resolve, 100));
      } else {
        console.log(`⚠️ No upcoming episodes for ${show.title}`);
      }
    } catch (error) {
      console.log(`❌ Failed to fetch next air date for ${show.title}:`, error);
    }
  }
  
  console.log('✅ Next air dates population complete!');
  
  // Force a re-render by dispatching a custom event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('library:updated'));
    
    // Additional force refresh for stubborn components
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('force-refresh'));
    }, 200);
  }
}

// Manual refresh function for testing
export function forceRefreshUpNext() {
  console.log('🔄 Manually forcing UpNext refresh...');
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('force-refresh'));
  }
}

// Make it available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).populateNextAirDates = populateNextAirDates;
  (window as any).Library = Library;
  (window as any).forceRefreshUpNext = forceRefreshUpNext;
}
