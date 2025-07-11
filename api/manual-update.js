const Stripe = require('stripe');
const { db, initialized: firebaseInitialized } = require('./firebase-admin');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });

/**
 * Manually update Firebase subscription data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const manualUpdate = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  // Check if Firebase is available
  if (!db || !firebaseInitialized) {
    return res.status(503).json({ 
      error: 'Firebase service unavailable',
      details: 'Firebase credentials not configured. Please check your .env file or serviceAccountKey.json.'
    });
  }

  try {
    console.log('🔧 Manually updating subscription for session:', sessionId);

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer']
    });

    const firebaseUid = session.metadata?.firebaseUid;
    if (!firebaseUid) {
      return res.status(400).json({ 
        error: 'No firebaseUid in session metadata',
        session: {
          id: session.id,
          payment_status: session.payment_status,
          status: session.status,
          metadata: session.metadata
        }
      });
    }

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ 
        error: 'Payment not completed',
        details: 'The payment session has not been completed yet.',
        session: {
          id: session.id,
          payment_status: session.payment_status,
          status: session.status
        }
      });
    }

    // Update Firebase with subscription data
    const userRef = db.collection('users').doc(firebaseUid);
    
    const subscriptionData = {
      subscription: {
        active: true,
        status: 'active',
        priceId: session.metadata?.priceId,
        stripeCustomerId: session.customer,
        stripeSubscriptionId: session.subscription,
        current_period_start: session.current_period_start,
        current_period_end: session.current_period_end,
        created_at: new Date(),
        updated_at: new Date(),
        manually_updated: true
      }
    };

    await userRef.set(subscriptionData, { merge: true });

    console.log(`✅ Manually updated subscription for user: ${firebaseUid}`);

    return res.status(200).json({
      success: true,
      message: 'Subscription updated successfully',
      user: firebaseUid,
      subscription: subscriptionData.subscription
    });

  } catch (error) {
    console.error('Manual update error:', error);
    return res.status(500).json({ 
      error: 'Failed to update subscription',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = manualUpdate; 