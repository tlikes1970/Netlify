import { useState, useEffect, useRef } from "react";
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
}

export function useLocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationPermission, setLocationPermission] = useState<
    "granted" | "denied" | "prompt" | "loading"
  >("loading");
  const geoResolverRef = useRef<(() => Promise<any>) | null>(null);

  useEffect(() => {
    let eventHandler: (() => void) | null = null;
    let fallbackTimeoutId: ReturnType<typeof setTimeout> | null = null;

    const requestLocation = () => {
      try {
        // Try to get precise location first
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
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
    };
  }, []);

  const requestLocationPermission = () => {
    setLocationPermission("prompt");
    // This will trigger the geolocation prompt again
    window.location.reload();
  };

  return {
    location,
    locationPermission,
    requestLocationPermission,
    isLoading: locationPermission === "loading",
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
