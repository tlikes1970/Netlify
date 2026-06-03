# Theater Data Integration Guide - TMDB Only

## Overview
The "In Theaters Near You" feature uses **TMDB data only** to create a realistic theater experience without requiring paid APIs. This approach generates realistic theaters and showtimes based on current movie data.

## Current Implementation (TMDB Only)

### ✅ What's Included:
- **Real Movie Data**: Current movies from TMDB's `/movie/now_playing` endpoint
- **Realistic Theater Names**: Common theater chains (AMC, Regal, Cinemark, etc.)
- **Real Addresses**: Uses reverse geocoding to generate addresses in user's actual city/region
- **Real Theater Websites**: Links to actual theater chain websites (AMC.com, RegMovies.com, etc.)
- **Contact Information**: Phone numbers and website links for each theater
- **Smart Showtime Generation**: Based on movie popularity and ratings
- **Realistic Availability**: Evening shows more likely sold out, matinees more available
- **Location-Based Distances**: Calculated distances from user location
- **"Real Showtimes" Links**: Direct links to theater websites for accurate showtimes

### 🎯 How It Works:

1. **Theater Generation**:
   - Creates 3-6 realistic theaters near user location
   - Uses real theater chain names with common suffixes (Downtown, Mall, Plaza, etc.)
   - Generates realistic street addresses in user's actual city/region using reverse geocoding
   - Includes real theater websites (AMC.com, RegMovies.com, Cinemark.com, etc.)
   - Adds contact phone numbers for each theater
   - Calculates distances based on user location

2. **Showtime Generation**:
   - Gets current movies from TMDB
   - More popular movies get more showtimes
   - Higher-rated movies get more showtimes
   - Realistic time slots (11 AM - 11 PM)
   - Multiple formats (2D, 3D, IMAX, Dolby Cinema)

3. **Smart Availability**:
   - Morning shows: 95% available
   - Afternoon shows: 85% available  
   - Evening shows: 75% available
   - Popular movies more likely sold out in evening

## Required API Keys

### 1. TMDB API (Only Required)
**Purpose**: Get current movies playing and movie details
**Setup**: Already configured in the app
**Cost**: Free
**Rate Limit**: 40 requests per 10 seconds

## Environment Setup

No additional environment variables needed! The TMDB API key is already configured.

## Testing

The system works immediately with just the TMDB API:
- **Location Detection**: Browser geolocation or IP-based fallback
- **Theater Generation**: Creates realistic theaters near user location
- **Showtime Generation**: Based on current TMDB movies
- **No External Dependencies**: Works without any paid APIs

## Cost Considerations

- **TMDB API**: Completely free
- **No Additional Costs**: No paid APIs required
- **Future Upgrade Path**: Can add Google Places API later for real theater locations

## Privacy & Security

- User location is only used for distance calculations
- No location data is stored or transmitted to our servers
- All API calls are made directly from the browser
- Only TMDB API key required (already configured)

## Future Upgrade Path

When subscriptions support it, you can upgrade to real theater data by adding:

### Google Places API (Optional Upgrade)
**Purpose**: Find real movie theaters near user location
**Setup**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the "Places API" 
3. Create credentials (API Key)
4. Add to environment variables:
   ```
   REACT_APP_GOOGLE_PLACES_API_KEY=your_api_key_here
   ```

### Real Showtime APIs (Optional Upgrade)
- **Fandango API**: Real showtimes from Fandango
- **MovieTickets API**: Alternative showtime source
- **Theater Chain APIs**: AMC, Regal, Cinemark specific APIs

## Benefits of Current Approach

✅ **Zero Cost**: No paid APIs required
✅ **Immediate Functionality**: Works right out of the box
✅ **Realistic Experience**: Feels like real theater data
✅ **Real Addresses**: Uses user's actual city/region for addresses
✅ **Real Theater Websites**: Links to actual theater chain websites
✅ **Contact Information**: Phone numbers and website links
✅ **"Real Showtimes" Links**: Direct access to accurate showtimes
✅ **Scalable**: Can upgrade to real APIs later
✅ **Privacy Focused**: Minimal data collection
