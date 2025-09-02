// Firebase configuration
const firebaseConfig = {
  // Add your Firebase config here
  // For now, using placeholder values
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

// Initialize Firebase
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
  
  // Make Firebase available globally
  window.db = firebase.firestore();
  window.auth = firebase.auth();
  
  // Initialize Firebase function for app.js
  window.initializeFirebase = function() {
    console.log('🔥 Firebase initialized successfully');
    return true;
  };
} else {
  console.warn('⚠️ Firebase not loaded - authentication features will be disabled');
  
  // Provide fallback function
  window.initializeFirebase = function() {
    console.log('⚠️ Firebase not available - using fallback');
    return false;
  };
}