// Firebase configuration and initialization
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBLwJc9xKEA1tn2ZVQRhtQ2Qv6e2pCq6bQ",
    authDomain: "timetracker-7da41.firebaseapp.com",
    projectId: "timetracker-7da41",
    storageBucket: "timetracker-7da41.firebasestorage.app",
    messagingSenderId: "207495478283",
    appId: "1:207495478283:web:e84d72f7fd24b18f815b0e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app; 