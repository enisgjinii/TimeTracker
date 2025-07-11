const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-06-30.basil' });
const { db, initialized: firebaseInitialized } = require('./firebase-admin');

/**
 * Cancel user subscription
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const cancelSubscription = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { firebaseUid } = req.body;

  // Validate required fields
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
    // Get user subscription details from Firebase
    const userDoc = await db.collection('users').doc(firebaseUid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    const userData = userDoc.data();
    const subscription = userData?.subscription;

    if (!subscription || !subscription.stripeSubscriptionId) {
      return res.status(400).json({ 
        error: 'No active subscription found' 
      });
    }

    // Cancel subscription in Stripe
    const canceledSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        cancel_at_period_end: true
      }
    );

    // Update Firebase with cancellation
    await db.collection('users').doc(firebaseUid).set({
      subscription: {
        ...subscription,
        active: false,
        status: 'canceled',
        canceled_at: new Date(),
        updated_at: new Date(),
        cancel_at_period_end: true
      }
    }, { merge: true });

    res.status(200).json({ 
      message: 'Subscription will be canceled at the end of the current period',
      subscription: {
        id: canceledSubscription.id,
        status: canceledSubscription.status,
        cancel_at_period_end: canceledSubscription.cancel_at_period_end,
        current_period_end: new Date(canceledSubscription.current_period_end * 1000).toISOString()
      }
    });
  } catch (err) {
    console.error('Error canceling subscription:', err);
    
    // Handle specific Stripe errors
    if (err.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ 
        error: 'Invalid subscription ID' 
      });
    }
    
    if (err.type === 'StripeAuthenticationError') {
      return res.status(500).json({ 
        error: 'Payment service configuration error' 
      });
    }

    res.status(500).json({ 
      error: 'Failed to cancel subscription',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

module.exports = cancelSubscription; 