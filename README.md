# Flicklet TV Tracker

A secure, modern TV and movie tracking application built with vanilla JavaScript, Firebase, and TMDB API.

## 🔒 Security Features

- **API Key Protection**: All API keys are managed through environment variables
- **Input Sanitization**: All user inputs are sanitized to prevent XSS attacks
- **CORS Protection**: Strict CORS policies prevent unauthorized access
- **Error Handling**: Comprehensive error handling and logging system
- **Rate Limiting**: Built-in rate limiting for API calls

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ 
- npm or yarn
- TMDB API key
- Firebase project

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/flicklet-tv-tracker.git
   cd flicklet-tv-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your actual values:
   ```env
   TMDB_API_KEY=your_tmdb_api_key_here
   FIREBASE_API_KEY=your_firebase_api_key_here
   FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   FIREBASE_APP_ID=your_app_id
   FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

4. **Build the application**
   ```bash
   npm run build
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 🏗️ Architecture

### Module System

The application uses a custom module system to eliminate global namespace pollution:

```javascript
// Define a module
define('my-module', ['dependency'], function(dependency) {
  return {
    // module implementation
  };
});

// Use a module
const myModule = require('my-module');
```

### Core Modules

- **ThemeManager**: Centralized theme management
- **SearchManager**: Search functionality with caching
- **DataManager**: Data persistence and management
- **PerformanceMonitor**: Performance monitoring and optimization
- **LoadingStates**: Loading states and skeleton screens
- **Accessibility**: Accessibility enhancements

### Security

- **Input Sanitization**: All user inputs are sanitized using `SecurityUtils`
- **API Key Management**: Secure API key handling through `AppConfig`
- **Error Handling**: Centralized error handling with `ErrorHandler`
- **CORS Protection**: Strict CORS policies in Netlify functions

## 📁 Project Structure

```
flicklet-tv-tracker/
├── www/                          # Web application
│   ├── js/                       # JavaScript modules
│   │   ├── modules/              # Core modules
│   │   ├── config.js             # Configuration management
│   │   ├── security.js           # Security utilities
│   │   └── error-handler.js      # Error handling
│   ├── styles/                   # CSS files
│   ├── scripts/                  # Legacy scripts
│   └── index.html                # Main HTML file
├── netlify/                      # Netlify functions
│   └── functions/                # Serverless functions
├── scripts/                      # Build scripts
├── env.example                   # Environment variables template
├── package.json                  # Dependencies and scripts
└── README.md                     # This file
```

## 🔧 Development

### Available Scripts

- `npm run build` - Build configuration with environment variables
- `npm run dev` - Start development server
- `npm start` - Start production server
- `npm run security-audit` - Run security audit
- `npm run clean` - Clean dependencies

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `TMDB_API_KEY` | TMDB API key | Yes |
| `FIREBASE_API_KEY` | Firebase API key | Yes |
| `FIREBASE_AUTH_DOMAIN` | Firebase auth domain | Yes |
| `FIREBASE_PROJECT_ID` | Firebase project ID | Yes |
| `FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | Yes |
| `FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | Yes |
| `FIREBASE_APP_ID` | Firebase app ID | Yes |
| `FIREBASE_MEASUREMENT_ID` | Firebase measurement ID | No |

## 🚀 Deployment

### Netlify

1. **Connect your repository** to Netlify
2. **Set environment variables** in Netlify dashboard
3. **Deploy** - Netlify will automatically build and deploy

### Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy the `www` folder** to your hosting provider

## 🔒 Security Considerations

### API Keys

- **Never commit API keys** to version control
- **Use environment variables** for all sensitive data
- **Rotate API keys** regularly
- **Monitor API usage** for unusual activity

### Input Validation

- **All user inputs** are sanitized before processing
- **HTML content** is escaped to prevent XSS
- **File uploads** are validated and restricted

### CORS

- **Strict origin policies** prevent unauthorized access
- **Only allowed domains** can access the API
- **Preflight requests** are properly handled

## 🐛 Troubleshooting

### Common Issues

1. **API Key Errors**
   - Check that environment variables are set correctly
   - Verify API keys are valid and have proper permissions

2. **CORS Errors**
   - Ensure your domain is in the allowed origins list
   - Check that Netlify functions are deployed correctly

3. **Build Errors**
   - Make sure all dependencies are installed
   - Check that Node.js version is 16+

### Debug Mode

Enable debug mode by setting `DEBUG=true` in your environment variables.

## 📊 Performance

### Monitoring

The application includes built-in performance monitoring:

- **Page Load Time**: Monitors initial page load
- **Web Vitals**: Tracks Core Web Vitals metrics
- **Memory Usage**: Monitors JavaScript heap usage
- **Long Tasks**: Detects tasks that block the main thread

### Optimization

- **Lazy Loading**: Images and non-critical resources are loaded on demand
- **Caching**: API responses are cached to reduce requests
- **Minification**: CSS and JavaScript are minified in production
- **Compression**: Assets are compressed for faster loading

## ♿ Accessibility

### Features

- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Support**: ARIA labels and live regions
- **High Contrast Mode**: Support for high contrast preferences
- **Reduced Motion**: Respects user motion preferences
- **Focus Management**: Proper focus handling in modals

### Testing

- **Automated Testing**: Run accessibility tests with `npm test`
- **Manual Testing**: Use screen readers and keyboard navigation
- **WCAG Compliance**: Follows WCAG 2.1 AA guidelines

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Add tests** for new functionality
5. **Submit a pull request**

### Code Style

- **ES6+** JavaScript features
- **Module system** for organization
- **Error handling** for all functions
- **Documentation** for public APIs

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: Report bugs and request features on GitHub
- **Documentation**: Check this README and inline code comments
- **Security**: Report security issues privately to security@flicklet.com

## 🔄 Changelog

### Version 12.1.0 (Current)
- ✅ **Security**: Implemented secure API key management
- ✅ **Architecture**: Added module system to eliminate global namespace pollution
- ✅ **Performance**: Added performance monitoring and optimization
- ✅ **Accessibility**: Enhanced accessibility features
- ✅ **Error Handling**: Comprehensive error handling system
- ✅ **Input Sanitization**: XSS protection for all user inputs

### Version 12.0.0
- 🔧 **Refactoring**: Major code architecture improvements
- 🔒 **Security**: Fixed critical security vulnerabilities
- 📦 **Modules**: Implemented module system
- 🚀 **Performance**: Performance optimizations

---

**Made with ❤️ by the Flicklet Team**