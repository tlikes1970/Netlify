import { useState } from 'react';
import { useTranslations } from '../lib/language';
import { useLocation, useTheaters } from '../hooks/useLocation';
import { Theater } from '../lib/tmdb';

export default function TheaterInfo() {
  const translations = useTranslations();
  const { 
    location, 
    locationPermission, 
    requestLocationPermission, 
    setManualLocation,
    clearManualLocation,
    isLoading,
    detectionTimedOut 
  } = useLocation();
  const { data: theaters, isLoading: theatersLoading } = useTheaters();
  const [showTheaters, setShowTheaters] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualCity, setManualCity] = useState('');
  const [manualRegion, setManualRegion] = useState('');

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCity.trim()) {
      setManualLocation(manualCity.trim(), manualRegion.trim() || manualCity.trim());
      setShowManualEntry(false);
      setManualCity('');
      setManualRegion('');
    }
  };

  // Loading state with timeout fallback
  if (isLoading && !detectionTimedOut) {
    return (
      <div className="mb-3 flex flex-col gap-1">
        <div className="text-sm font-medium text-neutral-200">{translations.inTheatersNearYou}</div>
        <div className="text-xs text-neutral-400 flex items-center gap-2">
          <span className="animate-pulse">📍</span> 
          {translations.detectingLocation || 'Detecting your location...'}
        </div>
      </div>
    );
  }

  // No location - show manual entry option
  if (!location || detectionTimedOut) {
    return (
      <div className="mb-3 flex flex-col gap-2">
        <div className="text-sm font-medium text-neutral-200">{translations.inTheatersNearYou}</div>
        
        {!showManualEntry ? (
          <div className="flex flex-col gap-2">
            <div className="text-xs text-neutral-400">
              <span className="font-medium">📍 {translations.locationUnavailable || 'Location unavailable'}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {locationPermission === 'denied' && (
                <button 
                  onClick={requestLocationPermission}
                  className="text-xs px-2 py-1 rounded border transition-colors"
                  style={{ 
                    color: 'var(--accent)', 
                    borderColor: 'var(--accent)',
                    backgroundColor: 'transparent'
                  }}
                >
                  {translations.enableLocation || 'Try again'}
                </button>
              )}
              <button 
                onClick={() => setShowManualEntry(true)}
                className="text-xs px-2 py-1 rounded border transition-colors"
                style={{ 
                  color: 'var(--text)', 
                  borderColor: 'var(--line)',
                  backgroundColor: 'var(--btn)'
                }}
              >
                Enter location manually
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleManualSubmit} className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="City (e.g., Los Angeles)"
                value={manualCity}
                onChange={(e) => setManualCity(e.target.value)}
                className="flex-1 text-xs px-2 py-1.5 rounded border"
                style={{ 
                  backgroundColor: 'var(--card)', 
                  borderColor: 'var(--line)',
                  color: 'var(--text)'
                }}
                autoFocus
              />
              <input
                type="text"
                placeholder="State/Region"
                value={manualRegion}
                onChange={(e) => setManualRegion(e.target.value)}
                className="w-24 text-xs px-2 py-1.5 rounded border"
                style={{ 
                  backgroundColor: 'var(--card)', 
                  borderColor: 'var(--line)',
                  color: 'var(--text)'
                }}
              />
            </div>
            <div className="flex gap-2">
              <button 
                type="submit"
                disabled={!manualCity.trim()}
                className="text-xs px-3 py-1 rounded transition-colors disabled:opacity-50"
                style={{ 
                  backgroundColor: 'var(--accent)', 
                  color: 'white'
                }}
              >
                Set Location
              </button>
              <button 
                type="button"
                onClick={() => setShowManualEntry(false)}
                className="text-xs px-2 py-1 rounded border transition-colors"
                style={{ 
                  color: 'var(--muted)', 
                  borderColor: 'var(--line)',
                  backgroundColor: 'transparent'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  const handleFindShowtimes = () => {
    setShowTheaters(!showTheaters);
  };

  return (
    <div className="mb-3 flex flex-col gap-2">
      <div className="text-sm font-medium text-neutral-200">{translations.inTheatersNearYou}</div>
      
      <div className="text-xs text-neutral-400 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-medium">
          📍 {location.city}, {location.region}
          {location.isManual && <span className="ml-1 opacity-60">(manual)</span>}
        </span>
        <span className="opacity-50">•</span>
        <button 
          onClick={handleFindShowtimes}
          className="text-blue-400 hover:text-blue-300 underline"
        >
          {showTheaters ? (translations.hideShowtimes || 'Hide') : (translations.findShowtimes || 'Find')} Showtimes
        </button>
        <span className="opacity-50">•</span>
        <button 
          onClick={() => setShowManualEntry(true)}
          className="opacity-70 hover:opacity-100 underline"
          style={{ color: 'var(--muted)' }}
        >
          Change location
        </button>
      </div>
      
      {/* Manual location entry overlay */}
      {showManualEntry && (
        <form onSubmit={handleManualSubmit} className="flex flex-col gap-2 p-2 rounded-lg" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--line)' }}>
          <div className="text-xs font-medium" style={{ color: 'var(--text)' }}>Enter new location:</div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="City"
              value={manualCity}
              onChange={(e) => setManualCity(e.target.value)}
              className="flex-1 text-xs px-2 py-1.5 rounded border"
              style={{ 
                backgroundColor: 'var(--bg)', 
                borderColor: 'var(--line)',
                color: 'var(--text)'
              }}
              autoFocus
            />
            <input
              type="text"
              placeholder="State/Region"
              value={manualRegion}
              onChange={(e) => setManualRegion(e.target.value)}
              className="w-24 text-xs px-2 py-1.5 rounded border"
              style={{ 
                backgroundColor: 'var(--bg)', 
                borderColor: 'var(--line)',
                color: 'var(--text)'
              }}
            />
          </div>
          <div className="flex gap-2">
            <button 
              type="submit"
              disabled={!manualCity.trim()}
              className="text-xs px-3 py-1 rounded transition-colors disabled:opacity-50"
              style={{ 
                backgroundColor: 'var(--accent)', 
                color: 'white'
              }}
            >
              Update
            </button>
            <button 
              type="button"
              onClick={() => { setShowManualEntry(false); setManualCity(''); setManualRegion(''); }}
              className="text-xs px-2 py-1 rounded border transition-colors"
              style={{ 
                color: 'var(--muted)', 
                borderColor: 'var(--line)',
                backgroundColor: 'transparent'
              }}
            >
              Cancel
            </button>
            {location.isManual && (
              <button 
                type="button"
                onClick={() => { clearManualLocation(); }}
                className="text-xs px-2 py-1 rounded transition-colors ml-auto"
                style={{ 
                  color: 'var(--red, #ef4444)', 
                  backgroundColor: 'transparent'
                }}
              >
                Use auto-detect
              </button>
            )}
          </div>
        </form>
      )}

      {showTheaters && (
        <div className="mt-2 space-y-2">
          {theatersLoading ? (
            <div className="text-xs text-neutral-400">{translations.loadingTheaters || 'Loading theaters...'}</div>
          ) : theaters && theaters.length > 0 ? (
            <div className="space-y-2">
              {theaters.map(theater => (
                <TheaterCard key={theater.id} theater={theater} />
              ))}
            </div>
          ) : (
            <div className="text-xs text-neutral-400">
              {translations.noTheatersFound || 'No theaters found nearby. Try expanding your search radius.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TheaterCard({ theater }: { theater: Theater }) {
  const [showShowtimes, setShowShowtimes] = useState(false);
  const translations = useTranslations();
  
  console.log('🎬 TheaterCard rendering:', theater);

  return (
    <div className="p-3 rounded-lg border" style={{ 
      backgroundColor: 'var(--card)', 
      borderColor: 'var(--line)' 
    }}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className="text-sm font-medium" style={{ color: 'var(--text)' }}>
            {theater.name}
          </h4>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            {theater.address}
            {theater.distance && (
              <span className="ml-1">• {theater.distance}{translations.kmAway || 'km away'}</span>
            )}
          </p>
          
          {/* Contact Information */}
          <div className="mt-1 flex flex-wrap gap-2">
            {theater.phone && (
              <span className="text-xs" style={{ color: 'var(--muted)' }}>
                📞 {theater.phone}
              </span>
            )}
            {theater.website && (
              <a
                href={theater.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 underline"
              >
                🌐 Visit Website
              </a>
            )}
          </div>
        </div>
        
        <div className="flex flex-col gap-1 ml-2">
          <button
            onClick={() => setShowShowtimes(!showShowtimes)}
            className="text-xs px-2 py-1 rounded border transition-colors"
            style={{ 
              color: 'var(--accent)', 
              borderColor: 'var(--accent)',
              backgroundColor: 'transparent'
            }}
          >
            {showShowtimes ? (translations.hideTimes || 'Hide') : (translations.showTimes || 'Show')} Times
          </button>
          
          {theater.website && (
            <a
              href={theater.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-2 py-1 rounded border transition-colors text-center"
              style={{ 
                color: 'var(--text)', 
                borderColor: 'var(--line)',
                backgroundColor: 'transparent'
              }}
            >
              Real Showtimes
            </a>
          )}
        </div>
      </div>

      {showShowtimes && theater.showtimes && (
        <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--line)' }}>
          <div className="text-xs font-medium mb-1" style={{ color: 'var(--text)' }}>
            {translations.todaysShowtimes || 'Today\'s Showtimes:'}
          </div>
          <div className="flex flex-wrap gap-1">
            {theater.showtimes.map((showtime, index) => (
              <span
                key={index}
                className={`text-xs px-2 py-1 rounded ${
                  showtime.available 
                    ? 'bg-green-900 text-green-200 border border-green-700' 
                    : 'bg-gray-800 text-gray-400 border border-gray-600'
                }`}
              >
                {showtime.time} {showtime.format}
              </span>
            ))}
          </div>
          
          {/* Disclaimer */}
          <div className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>
            <span className="italic">
              * Estimated showtimes. For accurate showtimes and ticket availability, visit the theater website.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
