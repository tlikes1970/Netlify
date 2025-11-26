// import { useState, useEffect } from 'react'; // Unused
// import { useTranslations } from '@/lib/language'; // Unused

export interface GenreConfig {
  id: string;
  name: string;
  subgenres: { id: string; name: string }[];
}

export interface ForYouRow {
  id: string;
  mainGenre: string;
  subGenre: string;
  title: string;
}

interface GenreRowConfigProps {
  row: ForYouRow;
  onUpdate: (updatedRow: ForYouRow) => void;
  onRemove: () => void;
  canRemove: boolean;
}

// Available genres with their subgenres
const AVAILABLE_GENRES: GenreConfig[] = [
  {
    id: 'anime',
    name: 'Anime',
    subgenres: [
      { id: 'shonen', name: 'Shōnen' },
      { id: 'shojo', name: 'Shōjo' },
      { id: 'mecha', name: 'Mecha' },
      { id: 'fantasy', name: 'Fantasy' },
      { id: 'romance', name: 'Romance' },
      { id: 'comedy', name: 'Comedy' },
      { id: 'popular', name: 'Popular' },
      { id: 'sports', name: 'Sports' },
      { id: 'horror', name: 'Horror' }
    ]
  },
  {
    id: 'animation',
    name: 'Animation',
    subgenres: [
      { id: 'comedy', name: 'Comedy' },
      { id: 'family', name: 'Family' },
      { id: 'action', name: 'Action' },
      { id: 'adventure', name: 'Adventure' },
      { id: 'fantasy', name: 'Fantasy' },
      { id: 'musical', name: 'Musical' }
    ]
  },
  {
    id: 'horror',
    name: 'Horror',
    subgenres: [
      { id: 'psychological', name: 'Psychological' },
      { id: 'supernatural', name: 'Supernatural' },
      { id: 'slasher', name: 'Slasher' },
      { id: 'gothic', name: 'Gothic' },
      { id: 'found-footage', name: 'Found Footage' },
      { id: 'body-horror', name: 'Body Horror' }
    ]
  },
  {
    id: 'comedy',
    name: 'Comedy',
    subgenres: [
      { id: 'romantic', name: 'Romantic' },
      { id: 'dark', name: 'Dark' },
      { id: 'satirical', name: 'Satirical' },
      { id: 'slapstick', name: 'Slapstick' },
      { id: 'parody', name: 'Parody' },
      { id: 'stand-up', name: 'Stand-up' }
    ]
  },
  {
    id: 'drama',
    name: 'Drama',
    subgenres: [
      { id: 'period', name: 'Period' },
      { id: 'legal', name: 'Legal' },
      { id: 'medical', name: 'Medical' },
      { id: 'family', name: 'Family' },
      { id: 'political', name: 'Political' },
      { id: 'crime', name: 'Crime' }
    ]
  },
  {
    id: 'action',
    name: 'Action',
    subgenres: [
      { id: 'martial-arts', name: 'Martial Arts' },
      { id: 'spy', name: 'Spy' },
      { id: 'war', name: 'War' },
      { id: 'adventure', name: 'Adventure' },
      { id: 'superhero', name: 'Superhero' },
      { id: 'thriller', name: 'Thriller' }
    ]
  },
  {
    id: 'science-fiction',
    name: 'Science Fiction',
    subgenres: [
      { id: 'space-opera', name: 'Space Opera' },
      { id: 'cyberpunk', name: 'Cyberpunk' },
      { id: 'dystopian', name: 'Dystopian' },
      { id: 'time-travel', name: 'Time Travel' },
      { id: 'alien', name: 'Alien' },
      { id: 'post-apocalyptic', name: 'Post-Apocalyptic' }
    ]
  },
  {
    id: 'fantasy',
    name: 'Fantasy',
    subgenres: [
      { id: 'high-fantasy', name: 'High Fantasy' },
      { id: 'urban-fantasy', name: 'Urban Fantasy' },
      { id: 'dark-fantasy', name: 'Dark Fantasy' },
      { id: 'fairy-tale', name: 'Fairy Tale' },
      { id: 'mythology', name: 'Mythology' },
      { id: 'magic', name: 'Magic' }
    ]
  },
  {
    id: 'thriller',
    name: 'Thriller',
    subgenres: [
      { id: 'psychological', name: 'Psychological' },
      { id: 'crime', name: 'Crime' },
      { id: 'mystery', name: 'Mystery' },
      { id: 'espionage', name: 'Espionage' },
      { id: 'legal', name: 'Legal' },
      { id: 'political', name: 'Political' }
    ]
  },
  {
    id: 'romance',
    name: 'Romance',
    subgenres: [
      { id: 'romantic-comedy', name: 'Romantic Comedy' },
      { id: 'period', name: 'Period' },
      { id: 'young-adult', name: 'Young Adult' },
      { id: 'erotic', name: 'Erotic' },
      { id: 'lgbtq', name: 'LGBTQ+' },
      { id: 'historical', name: 'Historical' }
    ]
  },
  {
    id: 'documentary',
    name: 'Documentary',
    subgenres: [
      { id: 'nature', name: 'Nature' },
      { id: 'biographical', name: 'Biographical' },
      { id: 'historical', name: 'Historical' },
      { id: 'social', name: 'Social' },
      { id: 'scientific', name: 'Scientific' },
      { id: 'true-crime', name: 'True Crime' }
    ]
  }
];

export default function GenreRowConfig({ row, onUpdate, onRemove, canRemove }: GenreRowConfigProps) {
  // const translations = useTranslations(); // Unused
  
  const selectedGenre = AVAILABLE_GENRES.find(g => g.id === row.mainGenre);
  const availableSubgenres = selectedGenre?.subgenres || [];

  const handleMainGenreChange = (genreId: string) => {
    const genre = AVAILABLE_GENRES.find(g => g.id === genreId);
    const newRow: ForYouRow = {
      ...row,
      mainGenre: genreId,
      subGenre: genre?.subgenres[0]?.id || '',
      title: genre ? `${genre.name}/${genre.subgenres[0]?.name || ''}` : ''
    };
    onUpdate(newRow);
  };

  const handleSubGenreChange = (subGenreId: string) => {
    const subGenre = availableSubgenres.find(sg => sg.id === subGenreId);
    const mainGenre = AVAILABLE_GENRES.find(g => g.id === row.mainGenre);
    const newRow: ForYouRow = {
      ...row,
      subGenre: subGenreId,
      title: mainGenre && subGenre ? `${mainGenre.name}/${subGenre.name}` : row.title
    };
    onUpdate(newRow);
  };

  return (
    <div 
      id={row.id === '1' ? 'for-you-row-1' : undefined}
      className="p-4 rounded-lg border" 
      style={{ 
        backgroundColor: 'var(--card)', 
        borderColor: 'var(--line)' 
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium" style={{ color: 'var(--text)' }}>
          Row {row.id}
        </h4>
        {canRemove && (
          <button
            onClick={onRemove}
            className="text-sm px-2 py-1 rounded border transition-colors"
            style={{ 
              color: 'var(--muted)', 
              borderColor: 'var(--line)',
              backgroundColor: 'transparent'
            }}
          >
            Remove
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Main Genre Dropdown */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
            Main Genre
          </label>
          <select
            value={row.mainGenre}
            onChange={(e) => handleMainGenreChange(e.target.value)}
            className="w-full px-3 py-2 rounded border text-sm"
            style={{
              backgroundColor: 'var(--btn)',
              color: 'var(--text)',
              borderColor: 'var(--line)'
            }}
          >
            <option value="">Select Genre</option>
            {AVAILABLE_GENRES.map(genre => (
              <option key={genre.id} value={genre.id}>
                {genre.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sub Genre Dropdown */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
            Sub Genre
          </label>
          <select
            value={row.subGenre}
            onChange={(e) => handleSubGenreChange(e.target.value)}
            className="w-full px-3 py-2 rounded border text-sm"
            style={{
              backgroundColor: 'var(--btn)',
              color: 'var(--text)',
              borderColor: 'var(--line)'
            }}
            disabled={!selectedGenre}
          >
            <option value="">Select Sub Genre</option>
            {availableSubgenres.map(subGenre => (
              <option key={subGenre.id} value={subGenre.id}>
                {subGenre.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Preview */}
      {row.title && (
        <div className="mt-3 p-2 rounded text-sm" style={{ 
          backgroundColor: 'var(--btn)',
          color: 'var(--muted)'
        }}>
          <strong>Preview:</strong> "{row.title}" will appear in For You section
        </div>
      )}
    </div>
  );
}

