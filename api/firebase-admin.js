const admin = require('firebase-admin');
const path = require('path');

let db = null;
let firebaseInitialized = false;

/**
 * Initialize Firebase Admin SDK
 * Supports both service account key file and environment variables
 */
const initializeFirebase = () => {
  console.log('🚀 Starting Firebase initialization...');
  console.log('📍 Current working directory:', process.cwd());
  console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
  
  if (firebaseInitialized) {
    console.log('✅ Firebase already initialized, returning existing instance');
    return { db, admin };
  }

  try {
    console.log('🔍 Checking for existing Firebase apps...');
    console.log('📊 Number of existing apps:', admin.apps.length);
    
    if (!admin.apps.length) {
      console.log('📁 No existing Firebase apps found, initializing new app...');
      
      // Try to use service account key file first
      try {
        console.log('📄 Attempting to load service account key file...');
        const serviceAccountPath = path.join(process.cwd(), 'config', 'serviceAccountKey.json');
        console.log('📂 Service account path:', serviceAccountPath);
        
        const serviceAccount = require(serviceAccountPath);
        console.log('📄 Service account file loaded successfully');

        console.log('📄 Service account details:', {
          project_id: serviceAccount.project_id,
          client_email: serviceAccount.client_email,
          has_private_key: !!serviceAccount.private_key,
          private_key_length: serviceAccount.private_key ? serviceAccount.private_key.length : 0,
          private_key_starts_with: serviceAccount.private_key ? serviceAccount.private_key.substring(0, 50) + '...' : 'N/A'
        });

        // Check if this is a real service account key or just a template
        console.log('🔍 Validating service account key...');
        console.log('🔍 Private key contains "YOUR_PRIVATE_KEY_HERE":', serviceAccount.private_key?.includes('YOUR_PRIVATE_KEY_HERE'));
        console.log('🔍 Private key contains "BEGIN PRIVATE KEY":', serviceAccount.private_key?.includes('BEGIN PRIVATE KEY'));
        
        if (serviceAccount.private_key &&
          !serviceAccount.private_key.includes('YOUR_PRIVATE_KEY_HERE') &&
          serviceAccount.private_key.includes('BEGIN PRIVATE KEY')) {

          console.log('✅ Service account key appears valid, initializing Firebase...');
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
          });

          console.log('✅ Firebase initialized with service account key file');
        } else {
          throw new Error('Service account key file contains placeholder values or invalid format');
        }
      } catch (fileError) {
        console.log('📄 Service account key file not found or invalid, trying environment variables...');
        console.log('📄 File error details:', fileError.message);
        console.log('📄 File error stack:', fileError.stack);

        // Fallback to environment variables
        console.log('🔧 Attempting to use environment variables...');
        const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;

        console.log('🔧 Environment variables status:', {
          has_project_id: !!FIREBASE_PROJECT_ID,
          has_client_email: !!FIREBASE_CLIENT_EMAIL,
          has_private_key: !!FIREBASE_PRIVATE_KEY,
          project_id: FIREBASE_PROJECT_ID,
          client_email: FIREBASE_CLIENT_EMAIL ? FIREBASE_CLIENT_EMAIL.substring(0, 20) + '...' : 'NOT SET',
          private_key_length: FIREBASE_PRIVATE_KEY ? FIREBASE_PRIVATE_KEY.length : 0,
          private_key_starts_with: FIREBASE_PRIVATE_KEY ? FIREBASE_PRIVATE_KEY.substring(0, 50) + '...' : 'NOT SET'
        });

        // Check if we have valid Firebase credentials (not placeholders)
        console.log('🔍 Validating environment variables...');
        console.log('🔍 Project ID is placeholder:', FIREBASE_PROJECT_ID === 'test-project');
        console.log('🔍 Client email is placeholder:', FIREBASE_CLIENT_EMAIL === 'test@test.com');
        console.log('🔍 Private key contains "placeholder":', FIREBASE_PRIVATE_KEY?.includes('placeholder'));
        console.log('🔍 Private key contains "YOUR_ACTUAL_PRIVATE_KEY_HERE":', FIREBASE_PRIVATE_KEY?.includes('YOUR_ACTUAL_PRIVATE_KEY_HERE'));
        console.log('🔍 Private key contains "MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...":', FIREBASE_PRIVATE_KEY?.includes('MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...'));
        
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

        console.log('✅ Environment variables appear valid, initializing Firebase...');
        console.log('🔧 Processing private key (replacing \\n with actual newlines)...');
        
        const processedPrivateKey = FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
        console.log('🔧 Private key processed, length:', processedPrivateKey.length);
        console.log('🔧 Private key starts with:', processedPrivateKey.substring(0, 50) + '...');

        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: FIREBASE_PROJECT_ID,
            clientEmail: FIREBASE_CLIENT_EMAIL,
            privateKey: processedPrivateKey,
          })
        });

        console.log('✅ Firebase initialized with environment variables');
      }
    } else {
      console.log('✅ Firebase app already exists, skipping initialization');
    }

    console.log('🔍 Initializing Firestore database...');
    db = admin.firestore();
    console.log('✅ Firestore database object created');
    
    firebaseInitialized = true;
    console.log('✅ Firebase initialization completed successfully');
    console.log('📊 Final status:', { db: !!db, initialized: firebaseInitialized });

  } catch (error) {
    console.error('❌ Firebase initialization failed:', error.message);
    console.error('❌ Error details:', error);
    console.error('❌ Error stack:', error.stack);
    console.warn('⚠️  Firebase-dependent features will be unavailable');
    console.warn('📋 To fix this:');
    console.warn('   1. Download your Firebase service account key');
    console.warn('   2. Save it as "serviceAccountKey.json" in the config directory');
    console.warn('   3. Or set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables');
    console.warn('   4. Make sure Firestore API is enabled in your Firebase project');
    console.warn('   5. For Vercel deployment, add these environment variables in the Vercel dashboard');
  }

  return { db, admin, initialized: firebaseInitialized };
};

// Initialize Firebase when this module is loaded
const firebase = initializeFirebase();

module.exports = firebase; 