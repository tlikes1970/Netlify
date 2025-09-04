# Flicklet - TV & Movie Tracker

A modern web application for tracking TV shows and movies with search, watchlists, ratings, and personalized recommendations.

## 📁 Project Structure

```
www/
├── 📄 index.html              # Main HTML file
├── 📁 styles/                 # CSS files
│   ├── 📄 main.css           # Global styles
│   ├── 📄 mobile.css         # Mobile-specific styles
│   └── 📄 components.css     # Component-specific styles
├── 📁 js/                    # JavaScript modules
│   ├── 📄 app.js            # Main application logic (FlickletApp)
│   ├── 📄 i18n.js          # Internationalization (EN/ES)
│   ├── 📄 utils.js         # Utility functions
│   └── 📄 bootstrap.js     # App initialization
├── 📁 features/             # Feature modules
│   └── 📄 flickword.html    # FlickWord game
├── 📁 icons/                # App icons
│   ├── 📄 icon-144.png     # Small icon
│   ├── 📄 icon-192.png     # Medium icon
│   └── 📄 icon-512.png     # Large icon
├── 📄 firebase-config.js    # Firebase configuration
├── 📄 manifest.json         # PWA manifest
└── 📄 README.md            # This file
```

## 🚀 Features

### Core Features
- **Search & Discovery**: Find shows by title, actor, genre, keywords
- **Watchlist Management**: Currently Watching, Wishlist, Watched tabs
- **User Accounts**: Firebase authentication with personalized data
- **Dark Mode**: Theme toggle with Mardi Gras mode
- **Multi-language**: English/Spanish support
- **Data Export/Import**: Backup and restore functionality
- **Feedback System**: Netlify Forms integration
- **Keyboard Shortcuts**: Ctrl+K search, Ctrl+T theme, etc.

### Special Features
- **FlickWord Game**: Daily word challenge game
- **Responsive Design**: Mobile-first design with touch optimization
- **PWA Support**: Installable as a mobile app
- **Offline Capability**: Works without internet connection
- **Real-time Sync**: Firebase Firestore for cross-device sync

## 🛠️ Technical Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Firebase (Authentication, Firestore)
- **Deployment**: Netlify
- **PWA**: Service Worker, Web App Manifest
- **Mobile**: Capacitor for native app generation

## 📱 Mobile Optimization

The app is fully optimized for mobile devices with:
- Responsive design that adapts to screen size
- Touch-friendly interface with proper touch targets
- Mobile-specific search layout
- Floating action buttons
- Sticky search bar
- Optimized performance for mobile networks

## 🌐 Internationalization

Supports multiple languages:
- **English (en)**: Default language
- **Spanish (es)**: Full translation support

Language switching is handled through the `i18n.js` module with automatic translation application.

## 🔧 Development

### File Organization
- **Modular JavaScript**: Separated into logical modules
- **Component-based CSS**: Organized by component and screen size
- **Feature Isolation**: Each feature has its own module
- **Clean Separation**: HTML structure, CSS styling, JS logic

### Key Modules
1. **app.js**: Main application logic and state management
2. **i18n.js**: Internationalization and translation system
3. **utils.js**: Common utility functions and helpers
4. **bootstrap.js**: Application initialization and event setup

### CSS Architecture
- **main.css**: Global styles, variables, and base elements
- **mobile.css**: Mobile-specific responsive design
- **components.css**: Component-specific styling

## 📊 Data Structure

The app uses a centralized data structure managed by the `FlickletApp` object:

```javascript
appData: {
  settings: {
    displayName: '',
    lang: 'en',
    theme: 'light',
    pro: false,
    notif: {}
  },
  lists: {
    watching: [],
    watched: [],
    wishlist: []
  },
  searchCache: [],
  activeTagFilters: new Set()
}
```

## 🔄 State Management

The app uses a centralized state management system:
- **FlickletApp**: Main application object with state and methods
- **Local Storage**: Persistent data storage
- **Firebase**: Cloud synchronization for authenticated users
- **Real-time Updates**: Automatic UI updates when data changes

## 🎯 Performance Optimizations

- **Lazy Loading**: Components load only when needed
- **Debounced Search**: Prevents excessive API calls
- **Cached Results**: Search results cached for faster access
- **Optimized Images**: Responsive image loading
- **Minimal Dependencies**: Lightweight vanilla JS approach

## 🔐 Security

- **Firebase Authentication**: Secure user authentication
- **Data Validation**: Input validation and sanitization
- **CORS Protection**: Proper cross-origin resource sharing
- **XSS Prevention**: Content Security Policy implementation

## 📈 Analytics

The app includes analytics tracking for:
- User engagement metrics
- Feature usage statistics
- Performance monitoring
- Error tracking

## 🚀 Deployment

The app is deployed on Netlify with:
- **Automatic Builds**: Git-based deployment
- **CDN**: Global content delivery
- **HTTPS**: Secure connections
- **PWA Support**: Service worker and manifest

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the documentation
- Review the code comments
- Open an issue on GitHub
- Contact the development team

---

**Flicklet** - Helping you remember what you're supposed to be watching! 📺✨

