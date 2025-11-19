# Games Implementation Plan

**Status:** In Progress  
**Date:** 2025-01-XX

## Completed ✅

1. **Fix FlickWord Pro Feature**
   - Changed MAX_GAMES_FREE from 3 to 1
   - Updated all logic to properly check Pro status
   - Fixed win/loss screen buttons to show correct limits
   - Regular users now get 1 game/day, Pro users get 3 games/day

2. **Analytics Functions Added**
   - Added comprehensive game analytics tracking functions
   - Functions ready for integration into game components

## In Progress 🔄

3. **Add Analytics Tracking Calls**
   - Need to add track calls to FlickWordGame.tsx
   - Need to add track calls to TriviaGame.tsx
   - Track game start, completion, guesses, errors

4. **Add "Come Back Tomorrow" Messaging**
   - Show message when free users complete their 1 game
   - Show message when Pro users complete all 3 games
   - Display in completion screens

5. **Add Game Review Mode**
   - Store completed game results
   - Allow users to review past games
   - Free users: review their 1 game
   - Pro users: review all 3 games

6. **Enhance Share Functionality**
   - Share individual game results
   - Pro users: share all 3 games together
   - Update share modal with options

## Pending ⏳

7. **Cloud Sync for Stats**
   - Integrate with FirebaseSyncManager
   - Sync game stats to Firestore
   - Load stats on sign-in

8. **Fix Race Conditions**
   - Improve async handling in FlickWord submit
   - Add proper request cancellation
   - Fix state consistency issues

9. **Fix Trivia Deduplication**
   - Improve question deduplication logic
   - Prevent potential infinite loops
   - Better error handling

10. **Mobile Layout Fixes**
    - Resolve tile sizing conflicts
    - Test on various screen sizes
    - Improve touch targets

---

## Implementation Notes

### Analytics Integration Points

**FlickWordGame.tsx:**
- `loadTodaysWord()` - Track game start
- `handleSubmit()` - Track guess submission
- Game completion - Track win/loss
- `handleShare()` - Track share events

**TriviaGame.tsx:**
- Question loading - Track game start
- `handleAnswerSelect()` - Track answer selection
- Game completion - Track score and percentage
- Share functionality - Track share events

### Review Mode Data Structure

```typescript
interface CompletedGame {
  date: string;
  gameNumber: number;
  gameType: 'flickword' | 'trivia';
  result: {
    // FlickWord
    won: boolean;
    guesses: string[];
    target: string;
    // Trivia
    score?: number;
    total?: number;
    percentage?: number;
  };
}
```

### Share Enhancement

- Single game share: Current functionality
- All games share (Pro only): Combine all 3 games into one share
- Format: Show all 3 grids/questions in sequence

---

## Next Steps

1. Add analytics calls to both games
2. Implement review mode storage and display
3. Enhance share functionality
4. Add "come back tomorrow" messaging
5. Integrate cloud sync
6. Fix remaining bugs


