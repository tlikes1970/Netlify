# Trivia Game Implementation Rules

## Overview
This document outlines the specific implementation rules for the Trivia game to ensure consistent behavior and easy recreation if needed.

## Core Gameplay Rules

### 1. Stats Display
- **Simple Counter Only**: Display only "X/5" (Basic) or "X/50" (Pro) in top left corner
- **No Full Stats Panel**: Do not show detailed stats (Games, Won, Lost, Streak, etc.) during gameplay
- **Position**: Absolute positioned in top left corner with dark background and white text
- **Format**: `{current}/{limit}` (e.g., "3/5", "12/50")

### 2. Question Advancement
- **All Answers Count**: Both correct AND incorrect answers must advance to next question
- **Auto-Advance**: Automatically move to next question after 2 seconds
- **Daily Limit Tracking**: Every answer (correct or incorrect) counts toward daily limit
- **No Manual Next Button**: Remove any "Next Question" buttons

### 3. Daily Limits
- **Basic Users**: 5 questions per day
- **Pro Users**: 50 questions per day
- **Counter Updates**: Daily count increments for every answer in `updateTriviaStats()` function
- **Limit Reached**: Show message when daily limit is reached, stop game progression

### 4. Question System
- **Deterministic Daily Questions**: All users get same questions each day using UTC seeding
- **API Integration**: Use OpenTrivia API with seed parameter for consistency
- **Fallback Pool**: Use hardcoded questions if API fails
- **Question Selection**: Use seeded random selection for consistent daily sets

### 5. Technical Implementation

#### Modal System
- **Iframe Sandbox**: Use `allow-scripts allow-same-origin` for localStorage access
- **Modal Module**: Create dedicated `trivia-modal.js` module
- **Integration**: Add to HTML and initialize in `app.js`

#### Stats Tracking
- **Data Format**: Use `flicklet-data` format for consistency with FlickWord
- **Storage Keys**: 
  - `flicklet:trivia:daily:{date}` for daily count
  - `flicklet:trivia:v1:streak` for current streak
  - `flicklet:trivia:v1:best` for best streak
- **Stats Structure**: Track games, wins, losses, streak, maxStreak, win percentage

#### CSS Styling
```css
.trivia-stats {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 10;
}

.daily-counter {
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  min-width: 60px;
}
```

### 6. User Experience Flow
1. Click Trivia tile → Modal opens
2. See simple "X/5" counter in top left
3. Answer question → Brief feedback (2 seconds)
4. Auto-advance to next question
5. Counter updates to "X+1/5"
6. Repeat until daily limit reached
7. Show limit reached message when done

### 7. Error Handling
- **API Failures**: Fallback to hardcoded question pool
- **Missing Elements**: Graceful degradation with console warnings
- **localStorage Issues**: Handle missing data with defaults
- **Modal Issues**: Proper cleanup and error reporting

### 8. Integration Points
- **Home Page**: Trivia tile triggers modal
- **Trivia Tab**: Stats panel shows detailed stats (separate from gameplay)
- **App Initialization**: Trivia modal module loaded in `app.js`
- **Message Passing**: Send stats updates to parent window

## Files Modified
- `www/features/trivia-safe.js` - Main game logic
- `www/features/trivia.html` - Game interface and styling
- `www/scripts/modules/trivia-modal.js` - Modal control
- `www/js/app.js` - Integration and event handling
- `www/index.html` - Script loading

## Key Functions
- `updateTriviaStats(isCorrect)` - Updates all stats and daily count
- `renderStats()` - Shows simple counter display
- `choose(choiceIdx)` - Handles answer selection and auto-advance
- `nextQuestion()` - Loads next question or shows limit message

This implementation ensures a clean, focused trivia experience that matches the user's requirements for simplicity and proper progression tracking.

