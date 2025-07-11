const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { db, initialized: firebaseInitialized } = require('./firebase-admin');

/**
 * Create Stripe customer portal session
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createPortalSession = async (req, res) => {
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

    if (!subscription || !subscription.stripeCustomerId) {
      return res.status(400).json({ 
        error: 'No active subscription found' 
      });
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${process.env.APP_URL || 'http://localhost:3000'}/settings`,
    });

    res.status(200).json({ 
      url: session.url 
    });
  } catch (err) {
    console.error('Error creating portal session:', err);
    
    // Handle specific Stripe errors
    if (err.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ 
        error: 'Invalid customer ID' 
      });
    }
    
    if (err.type === 'StripeAuthenticationError') {
      return res.status(500).json({ 
        error: 'Payment service configuration error' 
      });
    }

    res.status(500).json({ 
      error: 'Failed to create portal session',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

module.exports = createPortalSession; 