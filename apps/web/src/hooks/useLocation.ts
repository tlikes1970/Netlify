import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getTheatersNearLocation,
  getLocationFromIP,
  Theater,
} from "@/lib/tmdb";
import { makeGeoResolver } from "@/utils/geoClient";
import { getOnboardingCompleted } from "@/lib/onboarding";

export interface LocationData {
  latitude: number;
  longitude: number;
  city: string;
  region: string;
  country: string;
  isManual?: boolean; // True if user manually set location
}

// Storage key for persisted manual location
const MANUAL_LOCATION_KEY = 'flicklet:manualLocation';

export function useLocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationPermission, setLocationPermission] = useState<
    "granted" | "denied" | "prompt" | "loading"
  >("loading");
  const geoResolverRef = useRef<(() => Promise<any>) | null>(null);
  const [detectionTimedOut, setDetectionTimedOut] = useState(false);

  // Load persisted manual location on mount
  useEffect(() => {
    try {
      const savedLocation = localStorage.getItem(MANUAL_LOCATION_KEY);
      if (savedLocation) {
        const parsed = JSON.parse(savedLocation) as LocationData;
        setLocation({ ...parsed, isManual: true });
        setLocationPermission("granted");
        console.log("📍 Loaded saved manual location:", parsed.city, parsed.region);
        return; // Skip auto-detection if manual location is set
      }
    } catch (e) {
      console.warn("Failed to load saved location:", e);
    }
    
    // No saved location, proceed with auto-detection
    let eventHandler: (() => void) | null = null;
    let fallbackTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let detectionTimeoutId: ReturnType<typeof setTimeout> | null = null;

    const requestLocation = () => {
      // Set a timeout for detection - if it takes too long, show fallback UI
      detectionTimeoutId = setTimeout(() => {
        if (locationPermission === "loading") {
          console.log("📍 Location detection timed out, showing manual entry");
          setDetectionTimedOut(true);
          setLocationPermission("denied");
        }
      }, 8000); // 8 seconds timeout
      
      try {
        // Try to get precise location first
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              if (detectionTimeoutId) clearTimeout(detectionTimeoutId);
              const { latitude, longitude } = position.coords;

              // Get city info from coordinates (reverse geocoding) - single-flight + cache
              try {
                // Create resolver once per session for these coordinates
                if (!geoResolverRef.current) {
                  geoResolverRef.current = makeGeoResolver(latitude, longitude);
                }
                const data = await geoResolverRef.current();

                if (data) {
                  setLocation({
                    latitude,
                    longitude,
                    city: data.city || "Unknown",
                    region: data.principalSubdivision || "Unknown",
                    country: data.countryName || "Unknown",
                  });
                  setLocationPermission("granted");
                } else {
                  // Fallback to IP-based location
                  const ipLocation = await getLocationFromIP();
                  setLocation(ipLocation);
                  setLocationPermission("granted");
                }
              } catch (error) {
                console.error("Failed to get city info:", error);
                // Fallback to IP-based location
                const ipLocation = await getLocationFromIP();
                setLocation(ipLocation);
                setLocationPermission("granted");
              }
            },
            (error) => {
              if (detectionTimeoutId) clearTimeout(detectionTimeoutId);
              console.log("Geolocation denied or failed:", error);
              setLocationPermission("denied");

              // Fallback to IP-based location
              getLocationFromIP()
                .then((ipLocation) => {
                  setLocation(ipLocation);
                })
                .catch((ipError) => {
                  console.error("Failed to get IP location:", ipError);
                  setLocation(null);
                });
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 300000, // 5 minutes
            }
          );
        } else {
          // Browser doesn't support geolocation, use IP
          if (detectionTimeoutId) clearTimeout(detectionTimeoutId);
          getLocationFromIP()
            .then((ipLocation) => {
              setLocation(ipLocation);
              setLocationPermission("granted");
            })
            .catch((error) => {
              console.error("Failed to get IP location:", error);
              setLocation(null);
              setLocationPermission("denied");
            });
        }
      } catch (error) {
        if (detectionTimeoutId) clearTimeout(detectionTimeoutId);
        console.error("Location setup failed:", error);
        setLocationPermission("denied");
      }
    };

    // Wait for onboarding to complete before requesting location permission
    // If onboarding is already completed, proceed immediately
    if (getOnboardingCompleted()) {
      requestLocation();
    } else {
      // Otherwise, wait for onboarding completion event
      eventHandler = () => {
        requestLocation();
        if (eventHandler) {
          window.removeEventListener("onboarding:completed", eventHandler);
        }
        if (fallbackTimeoutId) {
          clearTimeout(fallbackTimeoutId);
        }
      };

      window.addEventListener("onboarding:completed", eventHandler);

      // Fallback: if onboarding doesn't complete within 3 minutes, proceed anyway
      // This gives users plenty of time to complete the onboarding flow
      fallbackTimeoutId = setTimeout(() => {
        if (eventHandler) {
          window.removeEventListener("onboarding:completed", eventHandler);
        }
        requestLocation();
      }, 180000); // 3 minutes
    }

    // Cleanup
    return () => {
      if (eventHandler) {
        window.removeEventListener("onboarding:completed", eventHandler);
      }
      if (fallbackTimeoutId) {
        clearTimeout(fallbackTimeoutId);
      }
      if (detectionTimeoutId) {
        clearTimeout(detectionTimeoutId);
      }
    };
  }, []);

  const requestLocationPermission = () => {
    setLocationPermission("prompt");
    // This will trigger the geolocation prompt again
    window.location.reload();
  };

  // Set manual location (city/region input)
  const setManualLocation = useCallback((city: string, region: string, country: string = "US") => {
    // Use a simple geocoding approximation or default coordinates
    // For now, we'll set placeholder coords - the theater API can still work with city/region
    const manualLoc: LocationData = {
      latitude: 0, // Will be refined by theater API
      longitude: 0,
      city: city.trim(),
      region: region.trim(),
      country,
      isManual: true,
    };
    
    setLocation(manualLoc);
    setLocationPermission("granted");
    setDetectionTimedOut(false);
    
    // Persist for future visits
    try {
      localStorage.setItem(MANUAL_LOCATION_KEY, JSON.stringify(manualLoc));
      console.log("📍 Saved manual location:", city, region);
    } catch (e) {
      console.warn("Failed to save location:", e);
    }
  }, []);
  
  // Clear manual location and re-detect
  const clearManualLocation = useCallback(() => {
    try {
      localStorage.removeItem(MANUAL_LOCATION_KEY);
    } catch (e) {
      // Ignore
    }
    setLocation(null);
    setLocationPermission("loading");
    setDetectionTimedOut(false);
    // Trigger re-detection by reloading
    window.location.reload();
  }, []);

  return {
    location,
    locationPermission,
    requestLocationPermission,
    setManualLocation,
    clearManualLocation,
    isLoading: locationPermission === "loading",
    detectionTimedOut,
  };
}

export function useTheaters(radius: number = 10) {
  const { location } = useLocation();

  return useQuery<Theater[]>({
    queryKey: ["theaters", location?.latitude, location?.longitude, radius],
    queryFn: () => {
      if (!location) return [];
      return getTheatersNearLocation(
        location.latitude,
        location.longitude,
        radius
      );
    },
    enabled: !!location,
    staleTime: 300_000, // 5 minutes
    retry: 2,
  });
}
