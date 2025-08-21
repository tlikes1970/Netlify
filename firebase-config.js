// firebase-config.js
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBrfDgu-YImPbxtdbQXCw1wmdK4p86WEcw",
  authDomain: "tv-movie-tracker-db228.firebaseapp.com",
  projectId: "tv-movie-tracker-db228",
  storageBucket: "tv-movie-tracker-db228.firebasestorage.app",
  messagingSenderId: "408433828326",
  appId: "1:408433828326:web:01c9037a117b4f5e587627",
  measurementId: "G-8S8VJXMWYX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;