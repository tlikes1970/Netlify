# Backend Server Test Instructions

## Issue: 404 on POST /api/v1/tags

The backend server is running on port 4000, but the POST route might not be loaded.

## Solution: Restart the Backend Server

1. **Stop the current server** (Ctrl+C in the terminal where it's running)
2. **Restart it**:
   ```bash
   cd server
   npm run dev
   ```
   OR if using a different command:
   ```bash
   node server/src/index.js
   ```

## Verify It's Working

After restarting, test the endpoint:

**GET tags** (should work):
- Browser: `http://localhost:4000/api/v1/tags`
- Should return JSON array of tags

**POST tags** (should work after restart):
- Use browser console or Postman
- URL: `http://localhost:4000/api/v1/tags`
- Method: POST
- Headers: `Content-Type: application/json`
- Body: `{"tagNames": ["test"]}`
- Should return: `{"tags": [{"slug": "test", "name": "test"}]}`

## What to Check

1. **Server console** should show: `Server running on port 4000`
2. **No errors** about missing routes
3. **CORS** should allow `http://localhost:8888` (already configured)

## If Still Getting 404

Check server console for:
- Route registration errors
- Import errors for `createOrGetTags`
- Any middleware blocking the request


