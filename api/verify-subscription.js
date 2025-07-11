const admin = require('firebase-admin');

let db = null;
let firebaseInitialized = false;

// Initialize Firebase Admin if not already initialized and credentials are valid
const initializeFirebase = () => {
  if (firebaseInitialized) return;
  
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;
  
  // Check if we have valid Firebase credentials (not placeholders)
  if (!FIREBASE_PROJECT_ID || 
      !FIREBASE_CLIENT_EMAIL || 
      !FIREBASE_PRIVATE_KEY ||
      FIREBASE_PROJECT_ID === 'test-project' ||
      FIREBASE_CLIENT_EMAIL === 'test@test.com' ||
      FIREBASE_PRIVATE_KEY.includes('placeholder') ||
      FIREBASE_PRIVATE_KEY.includes('MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...')) {
    console.warn('⚠️  Firebase credentials not configured or are placeholders');
    return;
  }

  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: FIREBASE_PROJECT_ID,
          clientEmail: FIREBASE_CLIENT_EMAIL,
          privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    }
    db = admin.firestore();
    firebaseInitialized = true;
    console.log('✅ Firebase initialized successfully');
  } catch (error) {
    console.warn('Firebase initialization failed:', error.message);
  }
};

// Try to initialize Firebase
initializeFirebase();

/**
 * Verify user subscription status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const verifySubscription = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { firebaseUid } = req.query;

  // Validate required parameters
  if (!firebaseUid) {
    return res.status(400).json({ 
      error: 'firebaseUid is required' 
    });
  }

  // Check if Firebase is properly initialized
  if (!db || !firebaseInitialized) {
    return res.status(503).json({ 
      error: 'Firebase service unavailable',
      details: process.env.NODE_ENV === 'development' ? 
        'Firebase credentials not configured. Please check your .env file.' : undefined
    });
  }

  try {
    const userDoc = await db.collection('users').doc(firebaseUid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    const userData = userDoc.data();
    const subscription = userData?.subscription;

    if (!subscription) {
      return res.status(200).json({
        active: false,
        status: 'no_subscription',
        subscription: null
      });
    }

    // Check if subscription is active and not expired
    const now = new Date();
    const isActive = subscription.active && 
                    subscription.status === 'active' &&
                    (!subscription.current_period_end || 
                     new Date(subscription.current_period_end * 1000) > now);

    return res.status(200).json({
      active: isActive,
      status: subscription.status || 'unknown',
      subscription: {
        ...subscription,
        current_period_end: subscription.current_period_end ? 
          new Date(subscription.current_period_end * 1000).toISOString() : null,
        current_period_start: subscription.current_period_start ? 
          new Date(subscription.current_period_start * 1000).toISOString() : null,
        created_at: subscription.created_at?.toDate?.() || subscription.created_at,
        updated_at: subscription.updated_at?.toDate?.() || subscription.updated_at,
        canceled_at: subscription.canceled_at?.toDate?.() || subscription.canceled_at
      }
    });

  } catch (error) {
    console.error('Error verifying subscription:', error);
    return res.status(500).json({ 
      error: 'Failed to verify subscription',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = verifySubscription; 