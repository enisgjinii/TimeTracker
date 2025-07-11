const { db, initialized: firebaseInitialized } = require('./firebase-admin');
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });

/**
 * Test webhook manually
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const testWebhook = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sessionId, firebaseUid } = req.body;

  if (!sessionId || !firebaseUid) {
    return res.status(400).json({ 
      error: 'sessionId and firebaseUid are required' 
    });
  }

  try {
    console.log('🧪 Testing webhook manually for session:', sessionId);

    // Check Firebase status
    if (!db || !firebaseInitialized) {
      return res.status(503).json({ 
        error: 'Firebase service unavailable',
        firebaseStatus: { db: !!db, initialized: firebaseInitialized }
      });
    }

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer']
    });

    console.log('📋 Session details:', {
      id: session.id,
      payment_status: session.payment_status,
      status: session.status,
      firebaseUid: session.metadata?.firebaseUid
    });

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ 
        error: 'Payment not completed',
        session: {
          id: session.id,
          payment_status: session.payment_status,
          status: session.status
        }
      });
    }

    // Simulate webhook event
    const webhookEvent = {
      type: 'checkout.session.completed',
      data: {
        object: session
      }
    };

    console.log('🔄 Simulating webhook event:', webhookEvent.type);

    // Update Firebase directly (same as webhook handler)
    const userRef = db.collection('users').doc(firebaseUid);
    
    const subscriptionData = {
      subscription: {
        active: true,
        status: 'active',
        priceId: session.metadata?.priceId || null,
        stripeCustomerId: session.customer || null,
        stripeSubscriptionId: session.subscription || null,
        current_period_start: session.current_period_start || null,
        current_period_end: session.current_period_end || null,
        created_at: new Date(),
        updated_at: new Date(),
        manually_triggered: true
      }
    };

    // Remove null/undefined values
    Object.keys(subscriptionData.subscription).forEach(key => {
      if (subscriptionData.subscription[key] === null || subscriptionData.subscription[key] === undefined) {
        delete subscriptionData.subscription[key];
      }
    });

    await userRef.set(subscriptionData, { merge: true });

    console.log(`✅ Webhook test successful for user: ${firebaseUid}`);

    return res.status(200).json({
      success: true,
      message: 'Webhook test completed successfully',
      user: firebaseUid,
      subscription: subscriptionData.subscription
    });

  } catch (error) {
    console.error('Webhook test error:', error);
    return res.status(500).json({ 
      error: 'Webhook test failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = testWebhook; 