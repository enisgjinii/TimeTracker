// Firebase configuration and initialization
const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');
const { getFirestore } = require('firebase/firestore');

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
const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

module.exports = { auth, db, app }; 