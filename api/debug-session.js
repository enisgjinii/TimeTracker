const Stripe = require('stripe');
const { db, initialized: firebaseInitialized } = require('./firebase-admin');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });

/**
 * Debug session and subscription status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const debugSession = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sessionId } = req.query;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  try {
    console.log('🔍 Debugging session:', sessionId);

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer']
    });

    console.log('📋 Session details:', {
      id: session.id,
      payment_status: session.payment_status,
      status: session.status,
      firebaseUid: session.metadata?.firebaseUid,
      customer: session.customer,
      subscription: session.subscription
    });

    // Check if Firebase is available
    if (!db || !firebaseInitialized) {
      return res.status(503).json({ 
        error: 'Firebase service unavailable',
        session: {
          id: session.id,
          payment_status: session.payment_status,
          status: session.status,
          firebaseUid: session.metadata?.firebaseUid
        }
      });
    }

    // Check Firebase for user data
    const firebaseUid = session.metadata?.firebaseUid;
    let firebaseData = null;

    if (firebaseUid) {
      try {
        const userDoc = await db.collection('users').doc(firebaseUid).get();
        if (userDoc.exists) {
          firebaseData = userDoc.data();
        }
      } catch (firebaseError) {
        console.error('Firebase query error:', firebaseError);
      }
    }

    // Check webhook configuration
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const webhookConfigured = webhookSecret && webhookSecret !== 'whsec_placeholder';

    return res.status(200).json({
      session: {
        id: session.id,
        payment_status: session.payment_status,
        status: session.status,
        firebaseUid: session.metadata?.firebaseUid,
        customer: session.customer,
        subscription: session.subscription,
        metadata: session.metadata
      },
      firebase: {
        available: firebaseInitialized,
        userExists: firebaseData !== null,
        userData: firebaseData
      },
      webhook: {
        configured: webhookConfigured,
        secret: webhookConfigured ? '***configured***' : 'not configured'
      },
      recommendations: []
    });

  } catch (error) {
    console.error('Debug session error:', error);
    return res.status(500).json({ 
      error: 'Failed to debug session',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = debugSession; 