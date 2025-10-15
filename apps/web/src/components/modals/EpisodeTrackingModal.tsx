import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface Episode {
  id: number;
  name: string;
  episode_number: number;
  season_number: number;
  air_date: string;
  overview: string;
  watched: boolean;
}

interface Season {
  season_number: number;
  episode_count: number;
  episodes: Episode[];
}

interface EpisodeTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  show: {
    id: number;
    name: string;
    number_of_seasons: number;
    number_of_episodes: number;
  };
}

export function EpisodeTrackingModal({ isOpen, onClose, show }: EpisodeTrackingModalProps) {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load episode data when modal opens
  useEffect(() => {
    if (isOpen && show.id) {
      loadEpisodeData();
    }
  }, [isOpen, show.id]);

  const loadEpisodeData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get saved episode progress from localStorage
      const savedProgress = getSavedEpisodeProgress(show.id);
      
      // For now, create mock data - in real implementation, this would fetch from TMDB API
      const mockSeasons: Season[] = [];
      
      for (let seasonNum = 1; seasonNum <= Math.min(show.number_of_seasons, 5); seasonNum++) {
        const episodeCount = seasonNum === 1 ? 10 : 8; // Mock episode counts
        const episodes: Episode[] = [];
        
        for (let epNum = 1; epNum <= episodeCount; epNum++) {
          episodes.push({
            id: seasonNum * 1000 + epNum,
            name: `Episode ${epNum}`,
            episode_number: epNum,
            season_number: seasonNum,
            air_date: '2024-01-01',
            overview: `Episode ${epNum} of Season ${seasonNum}`,
            watched: savedProgress[`S${seasonNum}E${epNum}`] || false
          });
        }
        
        mockSeasons.push({
          season_number: seasonNum,
          episode_count: episodeCount,
          episodes
        });
      }
      
      setSeasons(mockSeasons);
    } catch (err) {
      setError('Failed to load episode data');
      console.error('Episode loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSavedEpisodeProgress = (showId: number): Record<string, boolean> => {
    try {
      const saved = localStorage.getItem(`episode-progress-${showId}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  };

  const saveEpisodeProgress = (showId: number, progress: Record<string, boolean>) => {
    try {
      localStorage.setItem(`episode-progress-${showId}`, JSON.stringify(progress));
    } catch (err) {
      console.error('Failed to save episode progress:', err);
    }
  };

  const toggleEpisodeWatched = (seasonNum: number, episodeNum: number) => {
    const episodeKey = `S${seasonNum}E${episodeNum}`;
    const currentProgress = getSavedEpisodeProgress(show.id);
    const newProgress = {
      ...currentProgress,
      [episodeKey]: !currentProgress[episodeKey]
    };
    
    saveEpisodeProgress(show.id, newProgress);
    
    // Update local state
    setSeasons(prevSeasons => 
      prevSeasons.map(season => 
        season.season_number === seasonNum
          ? {
              ...season,
              episodes: season.episodes.map(ep => 
                ep.episode_number === episodeNum
                  ? { ...ep, watched: !ep.watched }
                  : ep
              )
            }
          : season
      )
    );
  };

  const toggleSeasonWatched = (seasonNum: number) => {
    const season = seasons.find(s => s.season_number === seasonNum);
    if (!season) return;
    
    const allWatched = season.episodes.every(ep => ep.watched);
    const newWatchedState = !allWatched;
    
    const currentProgress = getSavedEpisodeProgress(show.id);
    const newProgress = { ...currentProgress };
    
    season.episodes.forEach(ep => {
      const episodeKey = `S${seasonNum}E${ep.episode_number}`;
      newProgress[episodeKey] = newWatchedState;
    });
    
    saveEpisodeProgress(show.id, newProgress);
    
    // Update local state
    setSeasons(prevSeasons => 
      prevSeasons.map(s => 
        s.season_number === seasonNum
          ? {
              ...s,
              episodes: s.episodes.map(ep => ({ ...ep, watched: newWatchedState }))
            }
          : s
      )
    );
  };

  const getTotalWatchedCount = () => {
    return seasons.reduce((total, season) => 
      total + season.episodes.filter(ep => ep.watched).length, 0
    );
  };

  const getTotalEpisodeCount = () => {
    return seasons.reduce((total, season) => total + season.episodes.length, 0);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden"
        style={{ backgroundColor: 'var(--card)', color: 'var(--text)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--line)' }}>
          <div>
            <h2 className="text-xl font-bold">{show.name}</h2>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Episode Progress: {getTotalWatchedCount()}/{getTotalEpisodeCount()} watched
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl hover:opacity-70 transition-opacity"
            style={{ color: 'var(--muted)' }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-lg" style={{ color: 'var(--muted)' }}>Loading episodes...</div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-lg text-red-500">{error}</div>
              <button 
                onClick={loadEpisodeData}
                className="mt-4 px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {seasons.map(season => {
                const watchedCount = season.episodes.filter(ep => ep.watched).length;
                const allWatched = watchedCount === season.episodes.length;
                const someWatched = watchedCount > 0;
                
                return (
                  <div key={season.season_number} className="border rounded-lg p-4" style={{ borderColor: 'var(--line)' }}>
                    {/* Season Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">Season {season.season_number}</h3>
                        <span className="text-sm" style={{ color: 'var(--muted)' }}>
                          ({watchedCount}/{season.episodes.length} watched)
                        </span>
                      </div>
                      <button
                        onClick={() => toggleSeasonWatched(season.season_number)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          allWatched 
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : someWatched
                            ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {allWatched ? 'All Watched' : someWatched ? 'Mark All' : 'Mark All'}
                      </button>
                    </div>

                    {/* Episodes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {season.episodes.map(episode => (
                        <label 
                          key={episode.id}
                          className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer transition-colors"
                          style={{ backgroundColor: 'var(--bg)' }}
                        >
                          <input
                            type="checkbox"
                            checked={episode.watched}
                            onChange={() => toggleEpisodeWatched(episode.season_number, episode.episode_number)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">
                              S{episode.season_number}E{episode.episode_number}: {episode.name}
                            </div>
                            {episode.overview && (
                              <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                                {episode.overview}
                              </div>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t" style={{ borderColor: 'var(--line)' }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded border transition-colors"
            style={{ 
              backgroundColor: 'var(--btn)', 
              color: 'var(--text)', 
              borderColor: 'var(--line)' 
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
