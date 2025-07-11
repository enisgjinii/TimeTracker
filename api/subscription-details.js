const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized and credentials are valid
if (!admin.apps.length && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_PRIVATE_KEY !== '-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\\n-----END PRIVATE KEY-----\\n') {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.warn('Firebase initialization failed:', error.message);
  }
}

const db = admin.apps.length > 0 ? admin.firestore() : null;

/**
 * Get detailed subscription information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getSubscriptionDetails = async (req, res) => {
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
        subscription: null,
        hasSubscription: false
      });
    }

    // Format subscription data
    const formattedSubscription = {
      ...subscription,
      current_period_end: subscription.current_period_end ? 
        new Date(subscription.current_period_end * 1000).toISOString() : null,
      current_period_start: subscription.current_period_start ? 
        new Date(subscription.current_period_start * 1000).toISOString() : null,
      created_at: subscription.created_at?.toDate?.() || subscription.created_at,
      updated_at: subscription.updated_at?.toDate?.() || subscription.updated_at,
      canceled_at: subscription.canceled_at?.toDate?.() || subscription.canceled_at,
      last_payment_date: subscription.last_payment_date?.toDate?.() || subscription.last_payment_date,
      last_payment_failed: subscription.last_payment_failed?.toDate?.() || subscription.last_payment_failed
    };

    return res.status(200).json({
      subscription: formattedSubscription,
      hasSubscription: true
    });

  } catch (error) {
    console.error('Error getting subscription details:', error);
    return res.status(500).json({ 
      error: 'Failed to get subscription details',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = getSubscriptionDetails; 