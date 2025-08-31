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
  apiKey: "AIzaSyDEiqf8cxQJ11URcQeE8jqq5EMa5M6zAXM",
  authDomain: "flicklet-71dff.firebaseapp.com",
  projectId: "flicklet-71dff",
  storageBucket: "flicklet-71dff.firebasestorage.app",
  messagingSenderId: "1034923556763",
  appId: "1:1034923556763:web:bba5489cd1d9412c9c2b3e",
  measurementId: "G-YL4TJ4FHJC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;