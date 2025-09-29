# Flicklet TV Tracker - Complete User's Guide

## Welcome to Flicklet! 🎬

Flicklet is your personal TV and movie tracking companion. This guide will walk you through every feature, from setting up your username to mastering advanced Pro features.

---

## Getting Started

### 1. First Time Setup - Username

When you first sign in to Flicklet, you'll be prompted to set up your username:

**What happens:**
- After signing in with Google, Apple, or Email, you'll see a prompt asking for your username
- This username appears in the left sidebar (snark area) and helps personalize your experience
- You can change it later in Settings

**Username Tips:**
- Choose something memorable and fun
- It will be displayed publicly in your profile
- Keep it appropriate for sharing with friends

**Where to find it:**
- Look for your username in the left sidebar below the navigation
- It appears as a personalized message or "snark"

---

## Search System 🔍

### How to Search

**Desktop:**
- Click the search icon in the top navigation
- Type your query in the search box
- Results appear instantly as you type

**Mobile:**
- Tap the search icon
- Use the mobile-optimized search interface
- Swipe to browse results

### Search Options & Features

**What you can search for:**
- **Movies**: "The Matrix", "Inception", "Avengers"
- **TV Shows**: "Breaking Bad", "The Office", "Stranger Things"
- **Actors**: "Tom Hanks", "Meryl Streep"
- **Directors**: "Christopher Nolan", "Quentin Tarantino"
- **Genres**: "Action", "Comedy", "Horror"

**Search Results Display:**
- **Poster**: High-quality movie/TV show poster
- **Title**: Full title with year
- **Type**: Movie or TV Show badge
- **Genres**: Up to 2 genre tags
- **Description**: 2-3 line overview
- **Rating**: Interactive 1-5 star rating
- **Actions**: Add to lists, mark not interested

**Search Actions:**
- **Add to Want**: Adds to your wishlist
- **Not Interested**: Removes from search results
- **Details**: Opens TMDB page for more info
- **Pro Preview**: Shows Pro features (Pro users only)

---

## Home Page Overview 🏠

### Navigation Tabs

The main navigation consists of 6 tabs:

**1. Home Tab** 🏠
- **Purpose**: Your personalized dashboard
- **Content**: Recently added items, recommendations, quick stats
- **Features**: Overview of your watching activity

**2. Watching Tab** 👀
- **Purpose**: Shows you're currently watching
- **Content**: TV shows and movies in progress
- **Features**: Episode tracking, move to other lists
- **Pro Features**: Smart Notifications, Viewing Journey

**3. Wishlist Tab** 📝
- **Purpose**: Things you want to watch
- **Content**: Movies and shows you've saved for later
- **Features**: Move to watching, mark not interested
- **Pro Features**: Advanced Customization

**4. Watched Tab** ✅
- **Purpose**: Shows you've completed
- **Content**: Finished movies and TV series
- **Features**: Move back to wishlist, rate shows
- **Pro Features**: Extra Trivia content

**5. Discover Tab** 🔍
- **Purpose**: Find new content
- **Content**: Search results, recommendations, trending
- **Features**: Add to lists, explore new shows
- **Pro Features**: Pro Preview toggle

**6. Settings Tab** ⚙️
- **Purpose**: Customize your experience
- **Content**: Account, preferences, Pro features
- **Features**: Theme, language, notifications, Pro upgrade

---

## Card System Explained 🎴

### Card Layout

Each card displays information in a consistent format:

**Desktop Layout (Horizontal):**
```
┌─────────────────────────────────────────────────────────────┐
│ [Poster 180x270]  Title: The Fantastic 4: First Steps     │
│                   Year: 2004                               │
│                   [Movie] [Action] [Adventure]             │
│                                                             │
│                   Description text here, clamped to       │
│                   2-3 lines maximum for consistency...      │
│                                                             │
│                   ★ ★ ★ ★ ☆ (Interactive Rating)          │
│                                                             │
│                   [▶ Want to Watch] [🚫 Not Interested]    │
│                   [📺 Episode Tracking] [🔒 Smart Notifications] │
│                                                             │
│                   Poster opens TMDB                         │
└─────────────────────────────────────────────────────────────┘
```

**Mobile Layout (Vertical):**
```
┌─────────────────────────────────────────┐
│ [Poster - Full Width]                   │
│                                         │
│ Title: The Fantastic 4: First Steps    │
│ Year: 2004                              │
│ [Movie] [Action] [Adventure]            │
│                                         │
│ Description text here, clamped to       │
│ 2-3 lines maximum for consistency...    │
│                                         │
│ ★ ★ ★ ★ ☆ (Interactive Rating)          │
│                                         │
│ [▶ Want to Watch] [🚫 Not Interested]   │
│ [📺 Episode Tracking] [⋯]               │
│                                         │
│ Poster opens TMDB                       │
└─────────────────────────────────────────┘
```

### Card Components

**1. Poster Image**
- **Size**: 180px × 270px (2:3 aspect ratio)
- **Behavior**: Clickable, opens TMDB page
- **Loading**: Lazy-loaded for performance
- **Fallback**: Shows placeholder if image fails

**2. Title**
- **Font**: Bold, 16px
- **Clamp**: Maximum 2 lines
- **Fallback**: Uses localized title, falls back to original title

**3. Year & Type**
- **Year**: Extracted from release_date or first_air_date
- **Type**: "Movie" or "TV Show" based on media_type
- **Display**: Year followed by type badge

**4. Genres**
- **Format**: Pill-shaped badges
- **Limit**: Shows first 2 genres
- **Source**: From TMDB genre data

**5. Description**
- **Font**: 14px, gray-600 color
- **Clamp**: 2-3 lines maximum
- **Source**: TMDB overview field
- **Fallback**: "No description available"

**6. Interactive Rating**
- **Range**: 1-5 stars
- **Behavior**: Click to rate, persists immediately
- **Visual**: Amber stars for rated, gray for unrated
- **Event**: Emits `app:rating:updated` for Discover logic

### Card Actions by Tab

**Watching Tab Actions:**
- **Primary**: Want to Watch, Not Interested
- **Secondary**: Details, Episode Tracking
- **Pro**: Smart Notifications, Viewing Journey

**Wishlist Tab Actions:**
- **Primary**: Move to Watching, Not Interested
- **Secondary**: Details
- **Pro**: Advanced Customization

**Watched Tab Actions:**
- **Primary**: Back to Want, Not Interested
- **Secondary**: Details
- **Pro**: Extra Trivia

**Discover Tab Actions:**
- **Primary**: Add to Want, Not Interested
- **Secondary**: Details
- **Pro**: Pro Preview

---

## Settings Page Deep Dive ⚙️

### Account Settings

**Profile Information:**
- **Username**: Change your display name
- **Email**: View your account email
- **Photo**: Update your profile picture
- **Pro Status**: View your subscription level

**Authentication:**
- **Google Sign-In**: Primary login method
- **Apple Sign-In**: Alternative login
- **Email/Password**: Backup login option

### Display Preferences

**Theme Settings:**
- **Light Theme**: Default bright interface
- **Dark Theme**: Dark mode for low-light viewing
- **Auto Theme**: Follows system preference
- **Pro Customization**: Advanced color schemes (Pro only)

**Language Settings:**
- **English**: Default language
- **Auto-Detect**: Uses browser language
- **Manual Selection**: Choose specific language

### Notification Settings

**Smart Notifications (Pro Feature):**
- **Episode Alerts**: Get notified of new episodes
- **Custom Lead Times**: Set how far in advance to notify
- **List Monitoring**: Choose which lists to monitor
- **Notification Types**: Email, push, or both

**Free Notifications:**
- **Basic Alerts**: Limited notification options
- **Upgrade Prompt**: Encourages Pro upgrade

### Pro Features Section

**Available Pro Features:**

**🔔 Smart Notifications**
- Set custom lead times for new episodes
- Choose which lists to monitor
- Never miss your favorite shows again

**📊 Your Viewing Journey**
- Discover your watching habits
- Beautiful charts showing favorite genres
- Binge patterns and viewing trends over time

**🎨 Advanced Customization**
- Unlock premium color schemes
- Custom accent colors
- Advanced layout options

**🧠 Extra Trivia**
- Access additional trivia questions
- Behind-the-scenes content
- Enhanced show information

**⭐ Pro Preview**
- Toggle Pro features on/off
- See what's available without purchasing
- Test premium functionality

### Data Management

**Export Options (Pro Feature):**
- **Watchlist Export**: Download your lists
- **Rating Export**: Export your ratings
- **Custom Reports**: Generate viewing reports

**Import Options:**
- **CSV Import**: Import from other services
- **Bulk Add**: Add multiple items at once

**Sync Settings:**
- **Cloud Sync**: Automatic data backup
- **Offline Mode**: Work without internet
- **Conflict Resolution**: Handle sync conflicts

---

## Pro Features Explained 💎

### What is Flicklet Pro?

Flicklet Pro unlocks advanced features and premium content to enhance your TV and movie tracking experience.

### Pro vs Free Comparison

**Free Features:**
- ✅ Basic list management (Watching, Wishlist, Watched)
- ✅ Search and discover content
- ✅ Rate movies and shows
- ✅ Basic notifications
- ✅ Standard themes
- ✅ Episode tracking

**Pro Features:**
- 🔒 Smart Notifications with custom timing
- 🔒 Advanced Analytics and Viewing Journey
- 🔒 Premium Themes and Customization
- 🔒 Extra Trivia Content
- 🔒 Pro Preview Mode
- 🔒 Priority Support
- 🔒 Advanced Export Options

### How to Upgrade to Pro

**Upgrade Process:**
1. Go to Settings → Pro Features
2. Click "Upgrade to Pro" button
3. Choose your subscription plan
4. Complete payment process
5. Enjoy Pro features immediately

**Pro Benefits:**
- **Enhanced Experience**: More customization options
- **Better Organization**: Advanced list management
- **Insights**: Understand your viewing habits
- **Convenience**: Smart notifications and automation
- **Support**: Priority customer support

---

## Tips & Best Practices 💡

### Getting the Most Out of Flicklet

**List Management:**
- Keep your Watching list current
- Use Wishlist for future viewing
- Rate shows to improve recommendations
- Mark not interested to refine suggestions

**Search Tips:**
- Use specific titles for best results
- Try different spellings if no results
- Use genre searches to discover new content
- Check TMDB details for more information

**Pro Features:**
- Set up Smart Notifications for favorite shows
- Explore your Viewing Journey for insights
- Customize themes to match your preferences
- Use Extra Trivia to learn more about shows

### Troubleshooting

**Common Issues:**

**Cards Not Loading:**
- Check internet connection
- Refresh the page
- Clear browser cache
- Check console for errors

**Search Not Working:**
- Verify TMDB API key
- Check search query spelling
- Try different search terms
- Check network connectivity

**Pro Features Not Showing:**
- Verify Pro subscription status
- Check Settings → Pro Features
- Refresh page after upgrade
- Contact support if issues persist

**Rating Not Saving:**
- Check internet connection
- Verify user authentication
- Try rating again
- Check console for errors

---

## Advanced Features 🚀

### Keyboard Shortcuts

**Navigation:**
- `Tab` - Navigate between elements
- `Enter` - Activate buttons/links
- `Escape` - Close modals/menus
- `Space` - Toggle checkboxes/buttons

**Search:**
- `Ctrl+F` / `Cmd+F` - Focus search
- `Enter` - Execute search
- `Escape` - Clear search

### Accessibility Features

**Screen Reader Support:**
- All interactive elements have proper labels
- ARIA attributes for complex components
- Keyboard navigation support
- High contrast mode support

**Visual Accessibility:**
- Adjustable text sizes
- High contrast themes
- Focus indicators
- Color-blind friendly design

### Mobile Optimization

**Touch Gestures:**
- Swipe navigation for carousels
- Tap to select items
- Long press for context menus
- Pinch to zoom (where applicable)

**Mobile-Specific Features:**
- Responsive design for all screen sizes
- Touch-friendly button sizes
- Optimized layouts for small screens
- Offline functionality

---

## Support & Help 🆘

### Getting Help

**Documentation:**
- This user guide covers all features
- In-app tooltips and hints
- Contextual help messages
- FAQ section in settings

**Community:**
- User forums for tips and tricks
- Feature request submissions
- Bug report system
- Community-driven content

**Contact Support:**
- Email support for technical issues
- Priority support for Pro users
- Response time: 24-48 hours
- Live chat during business hours

### Feature Requests

**How to Request Features:**
1. Go to Settings → Help & Support
2. Click "Feature Request"
3. Describe your idea
4. Submit for review

**Pro User Benefits:**
- Priority consideration for requests
- Direct communication with developers
- Beta access to new features
- Influence on product roadmap

---

## Conclusion 🎉

Flicklet is designed to be your complete TV and movie tracking solution. Whether you're a casual viewer or a serious cinephile, Flicklet adapts to your needs.

**Key Takeaways:**
- Start with username setup and basic list management
- Use search to discover new content
- Explore Pro features for enhanced experience
- Customize settings to match your preferences
- Take advantage of mobile optimization

**Next Steps:**
- Set up your first lists
- Explore the Discover tab
- Try rating some shows
- Consider upgrading to Pro for advanced features

Welcome to the Flicklet community! 🎬✨
