import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTheatersNearLocation, getLocationFromIP, Theater } from '@/lib/tmdb';

export interface LocationData {
  latitude: number;
  longitude: number;
  city: string;
  region: string;
  country: string;
}

export function useLocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt' | 'loading'>('loading');

  useEffect(() => {
    const getLocation = async () => {
      try {
        // Try to get precise location first
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              
              // Get city info from coordinates (reverse geocoding)
              try {
                const response = await fetch(
                  `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
                );
                const data = await response.json();
                
                setLocation({
                  latitude,
                  longitude,
                  city: data.city || 'Unknown',
                  region: data.principalSubdivision || 'Unknown',
                  country: data.countryName || 'Unknown'
                });
                setLocationPermission('granted');
              } catch (error) {
                console.error('Failed to get city info:', error);
                // Fallback to IP-based location
                const ipLocation = await getLocationFromIP();
                setLocation(ipLocation);
                setLocationPermission('granted');
              }
            },
            async (error) => {
              console.log('Geolocation denied or failed:', error);
              setLocationPermission('denied');
              
              // Fallback to IP-based location
              try {
                const ipLocation = await getLocationFromIP();
                setLocation(ipLocation);
              } catch (ipError) {
                console.error('Failed to get IP location:', ipError);
                setLocation(null);
              }
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 300000 // 5 minutes
            }
          );
        } else {
          // Browser doesn't support geolocation, use IP
          try {
            const ipLocation = await getLocationFromIP();
            setLocation(ipLocation);
            setLocationPermission('granted');
          } catch (error) {
            console.error('Failed to get IP location:', error);
            setLocation(null);
            setLocationPermission('denied');
          }
        }
      } catch (error) {
        console.error('Location setup failed:', error);
        setLocationPermission('denied');
      }
    };

    getLocation();
  }, []);

  const requestLocationPermission = () => {
    setLocationPermission('prompt');
    // This will trigger the geolocation prompt again
    window.location.reload();
  };

  return {
    location,
    locationPermission,
    requestLocationPermission,
    isLoading: locationPermission === 'loading'
  };
}

export function useTheaters(radius: number = 10) {
  const { location } = useLocation();
  
  return useQuery<Theater[]>({
    queryKey: ['theaters', location?.latitude, location?.longitude, radius],
    queryFn: () => {
      if (!location) return [];
      return getTheatersNearLocation(location.latitude, location.longitude, radius);
    },
    enabled: !!location,
    staleTime: 300_000, // 5 minutes
    retry: 2
  });
}
