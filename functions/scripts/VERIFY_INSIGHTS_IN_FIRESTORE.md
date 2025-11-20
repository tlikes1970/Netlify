# How to Verify Insights in Firebase Console

## Quick Verification Steps

### Step 1: Open Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `flicklet-71dff`
3. Navigate to **Firestore Database**

### Step 2: Check the `insights` Collection
1. In the left sidebar, click on **Firestore Database**
2. Look for the **`insights`** collection
3. Click on it to see all documents

### Step 3: Verify a Specific Title
Each document in `insights` collection:
- **Document ID**: The TMDB ID (as a string, e.g., "550" for Fight Club)
- **Fields**:
  - `tmdbId`: The TMDB ID (string)
  - `source`: Should be "auto"
  - `lastUpdated`: ISO timestamp string
  - `updatedAt`: Firestore Timestamp
  - `items`: Array of insight objects

### Step 4: Check Document Structure
Click on any document to see its fields. You should see:
```json
{
  "tmdbId": "550",
  "source": "auto",
  "lastUpdated": "2025-11-20T...",
  "updatedAt": Timestamp(...),
  "items": [
    {
      "id": "insight-comedy-550-...",
      "kind": "insight",
      "type": "style",
      "text": "...",
      "subtlety": "blink"
    },
    // ... more items
  ]
}
```

### Step 5: Verify `titles` Collection Updated
1. Navigate to **`titles`** collection
2. Find a document (document ID = TMDB ID)
3. Check if it has `lastIngestedAt` field (Firestore Timestamp)

## Finding a Specific Title to Check

### Option 1: Use a Known TMDB ID
If you know a specific show/movie that was ingested:
- Example: Fight Club = TMDB ID 550
- Look for document ID "550" in `insights` collection

### Option 2: Check Recent Titles
1. Go to `titles` collection
2. Look for documents with `lastIngestedAt` field
3. Pick one and note its TMDB ID
4. Check `insights` collection for that same ID

### Option 3: Query for Recent Updates
In Firestore Console:
1. Go to `insights` collection
2. Use the filter/search to find documents
3. Sort by `updatedAt` (descending) to see most recent

## Expected Results

After successful bulk ingestion:
- ✅ `insights` collection should have ~319 documents (one per title)
- ✅ Each document should have `items` array with 3-8 insight objects
- ✅ `titles` collection documents should have `lastIngestedAt` timestamps

## Troubleshooting

### If `insights` collection is empty:
- Check Netlify function logs for errors
- Verify Firestore write permissions
- Check if `FIREBASE_SERVICE_ACCOUNT_JSON` is set in Netlify

### If documents exist but `items` array is empty:
- Check Netlify function logs
- Verify metadata was passed correctly
- Check `buildInsightsForTitle` function logic

### If frontend still shows nothing:
- Check browser console for errors
- Verify Firestore security rules allow reads
- Check `goofsStore.ts` is fetching from correct collection

## Quick Test Query

To quickly find a document that was just ingested:
1. Go to `insights` collection
2. Look for documents with recent `updatedAt` timestamps
3. Click on one to verify it has `items` array with content

