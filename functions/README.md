# Firebase Cloud Functions - Vote Aggregation

This directory contains the Firebase Cloud Function that automatically aggregates votes when users vote on posts.

## Setup

1. Install dependencies:
```bash
cd functions
npm install
```

2. Build TypeScript:
```bash
npm run build
```

## Deployment

### Option 1: Using Firebase CLI (Recommended)

1. Initialize Firebase in the project root (if not already done):
```bash
firebase init functions
```

2. Deploy the function:
```bash
npm run deploy
# or
firebase deploy --only functions:aggregateVotes
```

### Option 2: Manual Deployment via Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Navigate to Functions
3. Create a new function with the source code from `src/index.ts`

## How It Works

- **Trigger**: Automatically fires when a document is written to `posts/{postId}/votes/{userId}`
- **Action**: Aggregates all votes for the post and updates the parent post document with:
  - `score`: Sum of all vote values (+1 for upvotes, -1 for downvotes)
  - `voteCount`: Total number of votes

## Testing Locally

```bash
npm run serve
```

This starts the Firebase emulators. Test vote operations in your app and watch the function trigger in the emulator logs.

## Netlify Function Alternative

If you prefer not to use Firebase Cloud Functions, there's also a Netlify Function at `netlify/functions/aggregateVotes.cjs` that can be called manually via HTTP POST with `{ "postId": "..." }`.






















