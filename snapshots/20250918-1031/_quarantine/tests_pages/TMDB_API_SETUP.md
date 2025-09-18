# TMDB API Setup Instructions

## Getting Your Free TMDB API Key

1. **Visit TMDB Website**
   - Go to: https://www.themoviedb.org/
   - Create a free account or sign in

2. **Request API Key**
   - Go to: https://www.themoviedb.org/settings/api
   - Click "Request an API Key"
   - Fill out the form:
     - **Application Name**: Flicklet TV & Movie Tracker
     - **Application Summary**: Personal TV and movie tracking application
     - **Application URL**: http://localhost:8000 (for development)
   - Accept the terms and submit

3. **Get Your API Key**
   - Once approved (usually instant), you'll see your API key
   - Copy the "API Key (v3 auth)" value

4. **Configure the Application**
   - Open `www/tmdb-config.js`
   - Replace `YOUR_TMDB_API_KEY_HERE` with your actual API key:
   ```javascript
   const TMDB_CONFIG = {
     apiKey: "your_actual_api_key_here", // Replace this
     baseUrl: "https://api.themoviedb.org/3",
     imageBaseUrl: "https://image.tmdb.org/t/p",
     language: "en-US"
   };
   ```

5. **Test the Configuration**
   - Refresh the application
   - Try searching for a movie or TV show
   - You should see real results instead of mock data

## API Limits
- **Free tier**: 1,000 requests per day
- **Rate limit**: 40 requests per 10 seconds
- **No authentication required** for basic search and genre data

## Troubleshooting
- If you see "401 Unauthorized" errors, check your API key
- If you see "429 Too Many Requests", you've hit the rate limit
- Make sure there are no extra spaces in your API key

## Security Note
- Never commit your API key to version control
- Consider using environment variables for production
- The current setup is fine for local development

