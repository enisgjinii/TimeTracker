const { db, initialized: firebaseInitialized } = require('./firebase-admin');
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-06-30.basil' });

/**
 * Verify user subscription status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const verifySubscription = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { firebaseUid, sessionId } = req.query;

  // Check if Firebase is properly initialized
  if (!db || !firebaseInitialized) {
    console.error('Firebase not initialized for subscription verification');
    console.error('Firebase status:', { db: !!db, initialized: firebaseInitialized });
    return res.status(503).json({ 
      error: 'Firebase service unavailable',
      details: process.env.NODE_ENV === 'development' ? 
        'Firebase credentials not configured. Please check your .env file or serviceAccountKey.json.' : undefined,
      firebaseStatus: { db: !!db, initialized: firebaseInitialized }
    });
  }

  try {
    let userFirebaseUid = firebaseUid;

    // If sessionId is provided, verify with Stripe first
    if (sessionId && !firebaseUid) {
      try {
        console.log('🔍 Verifying session with Stripe:', sessionId);
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        
        if (session.payment_status === 'paid') {
          userFirebaseUid = session.metadata?.firebaseUid;
          console.log('✅ Session verified, firebaseUid:', userFirebaseUid);
        } else {
          console.log('❌ Session not paid:', session.payment_status);
          return res.status(400).json({ 
            error: 'Payment not completed',
            details: 'The payment session has not been completed yet.'
          });
        }
      } catch (stripeError) {
        console.error('Stripe session verification error:', stripeError);
        return res.status(400).json({ 
          error: 'Invalid session',
          details: 'Unable to verify the payment session with Stripe.'
        });
      }
    }

    // Validate required parameters
    if (!userFirebaseUid) {
      return res.status(400).json({ 
        error: 'firebaseUid is required or sessionId must be provided' 
      });
    }

    const userDoc = await db.collection('users').doc(userFirebaseUid).get();
    
    if (!userDoc.exists) {
      return res.status(200).json({
        active: false,
        status: 'no_subscription',
        subscription: null
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