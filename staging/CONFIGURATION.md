# Configuration Guide

## Required Environment Variables

### TMDB API Key
The application requires a TMDB (The Movie Database) API key for fetching movie and TV show data.

**How to get your API key:**
1. Visit [TMDB Settings](https://www.themoviedb.org/settings/api)
2. Create a free account
3. Request an API key
4. Copy the API key

**How to configure:**
1. **Option 1 (Recommended):** Set the `TMDB_API_KEY` environment variable
2. **Option 2:** Update the meta tag in `index.html`:
   ```html
   <meta name="tmdb-api-key" content="your_actual_api_key_here" />
   ```
3. **Option 3:** Set `window.TMDB_API_KEY` in your JavaScript

### Firebase Configuration
Firebase is used for user authentication and data synchronization.

**Configuration methods:**
1. **Option 1 (Recommended):** Set environment variables:
   - `FIREBASE_API_KEY`
   - `FIREBASE_AUTH_DOMAIN`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_STORAGE_BUCKET`
   - `FIREBASE_MESSAGING_SENDER_ID`
   - `FIREBASE_APP_ID`
   - `FIREBASE_MEASUREMENT_ID`

2. **Option 2:** Update the `FIREBASE_CONFIG` object in `index.html`

## Security Notes

- Never commit API keys to version control
- Use environment variables for production deployments
- The fallback API key in the code is for development only
- Consider using a proxy server for production to hide API keys

## Development vs Production

**Development:**
- Uses fallback API keys for quick setup
- Console warnings when using fallback keys
- More permissive CORS settings

**Production:**
- Requires proper environment variable configuration
- No fallback keys should be used
- Stricter security policies


