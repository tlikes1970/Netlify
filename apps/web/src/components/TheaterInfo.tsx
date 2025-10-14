import React, { useState } from 'react';
import { useTranslations } from '../lib/language';
import { useLocation, useTheaters } from '../hooks/useLocation';
import { Theater } from '../lib/tmdb';

export default function TheaterInfo() {
  const translations = useTranslations();
  const { location, locationPermission, requestLocationPermission, isLoading } = useLocation();
  const { data: theaters, isLoading: theatersLoading } = useTheaters();
  const [showTheaters, setShowTheaters] = useState(false);

  if (isLoading) {
    return (
      <div className="mb-3 flex flex-col gap-1">
        <div className="text-sm font-medium text-neutral-200">{translations.inTheatersNearYou}</div>
        <div className="text-xs text-neutral-400">📍 {translations.detectingLocation || 'Detecting your location...'}</div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="mb-3 flex flex-col gap-1">
        <div className="text-sm font-medium text-neutral-200">{translations.inTheatersNearYou}</div>
        <div className="text-xs text-neutral-400">
          <span className="font-medium">📍 {translations.locationUnavailable || 'Location unavailable'}</span>
          {locationPermission === 'denied' && (
            <button 
              onClick={requestLocationPermission}
              className="ml-2 text-blue-400 hover:text-blue-300 underline"
            >
              {translations.enableLocation || 'Enable location'}
            </button>
          )}
        </div>
      </div>
    );
  }

  const handleFindShowtimes = () => {
    setShowTheaters(!showTheaters);
  };

  return (
    <div className="mb-3 flex flex-col gap-2">
      <div className="text-sm font-medium text-neutral-200">{translations.inTheatersNearYou}</div>
      
      <div className="text-xs text-neutral-400">
        <span className="font-medium">📍 {location.city}, {location.region}</span>
        <button 
          onClick={handleFindShowtimes}
          className="ml-2 text-blue-400 hover:text-blue-300 underline"
        >
          {showTheaters ? (translations.hideShowtimes || 'Hide') : (translations.findShowtimes || 'Find')} Showtimes
        </button>
      </div>

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
