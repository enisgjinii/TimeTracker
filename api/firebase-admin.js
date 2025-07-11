const admin = require('firebase-admin');
const path = require('path');

let db = null;
let firebaseInitialized = false;

/**
 * Initialize Firebase Admin SDK
 * Supports both service account key file and environment variables
 */
const initializeFirebase = () => {
  if (firebaseInitialized) return { db, admin };
  
  try {
    if (!admin.apps.length) {
      // Try to use service account key file first
      try {
        const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
        const serviceAccount = require(serviceAccountPath);
        
        // Check if this is a real service account key or just a template
        if (serviceAccount.private_key && 
            !serviceAccount.private_key.includes('YOUR_PRIVATE_KEY_HERE') &&
            serviceAccount.private_key.includes('BEGIN PRIVATE KEY')) {
          
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://timetracker-7da41-default-rtdb.europe-west1.firebasedatabase.app"
          });
          
          console.log('✅ Firebase initialized with service account key file');
        } else {
          throw new Error('Service account key file contains placeholder values');
        }
      } catch (fileError) {
        console.log('📄 Service account key file not found or invalid, trying environment variables...');
        
        // Fallback to environment variables
        const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;
        
        // Check if we have valid Firebase credentials (not placeholders)
        if (!FIREBASE_PROJECT_ID || 
            !FIREBASE_CLIENT_EMAIL || 
            !FIREBASE_PRIVATE_KEY ||
            FIREBASE_PROJECT_ID === 'test-project' ||
            FIREBASE_CLIENT_EMAIL === 'test@test.com' ||
            FIREBASE_PRIVATE_KEY.includes('placeholder') ||
            FIREBASE_PRIVATE_KEY.includes('YOUR_ACTUAL_PRIVATE_KEY_HERE') ||
            FIREBASE_PRIVATE_KEY.includes('MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...')) {
          throw new Error('Firebase credentials not configured or contain placeholder values');
        }

        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: FIREBASE_PROJECT_ID,
            clientEmail: FIREBASE_CLIENT_EMAIL,
            privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          }),
          databaseURL: "https://timetracker-7da41-default-rtdb.europe-west1.firebasedatabase.app"
        });
        
        console.log('✅ Firebase initialized with environment variables');
      }
    }
    
    db = admin.firestore();
    firebaseInitialized = true;
    
  } catch (error) {
    console.warn('⚠️  Firebase initialization failed:', error.message);
    console.warn('⚠️  Firebase-dependent features will be unavailable');
    console.warn('📋 To fix this:');
    console.warn('   1. Download your Firebase service account key');
    console.warn('   2. Save it as "serviceAccountKey.json" in the project root');
    console.warn('   3. Or update the FIREBASE_PRIVATE_KEY in your .env file');
  }
  
  return { db, admin, initialized: firebaseInitialized };
};

// Initialize Firebase when this module is loaded
const firebase = initializeFirebase();

module.exports = firebase; 