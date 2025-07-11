const { db, initialized: firebaseInitialized } = require('./firebase-admin');

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

  // Check if Firebase is properly initialized
  if (!db || !firebaseInitialized) {
    return res.status(503).json({ 
      error: 'Firebase service unavailable',
      details: process.env.NODE_ENV === 'development' ? 
        'Firebase credentials not configured. Please check your .env file or serviceAccountKey.json.' : undefined
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