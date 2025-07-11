const { buffer } = require('micro');
const Stripe = require('stripe');
const { db, initialized: firebaseInitialized } = require('./firebase-admin');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-06-30.basil' });

/**
 * Advanced log helper
 */
function advLog(...args) {
  const ts = new Date().toISOString();
  console.log(`[${ts}]`, ...args);
}

/**
 * Handle Stripe webhook events (Vercel-friendly, advanced logging)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const stripeWebhook = async (req, res) => {
  advLog('--- Stripe Webhook Received ---');
  advLog('Headers:', JSON.stringify(req.headers, null, 2));
  advLog('Method:', req.method);

  res.setHeader('X-Webhook-Source', 'stripe-webhook-v2');

  if (req.method !== 'POST') {
    advLog('❌ Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Log environment variables (mask secrets)
  advLog('ENV:', {
    NODE_ENV: process.env.NODE_ENV,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'SET' : 'NOT SET',
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ? 'SET' : 'NOT SET',
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? 'SET' : 'NOT SET',
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? 'SET' : 'NOT SET',
  });

  let buf, sig, event;
  try {
    buf = await buffer(req);
    advLog('Raw body buffer length:', buf.length);
    sig = req.headers['stripe-signature'];
    if (!sig) {
      advLog('❌ Missing Stripe signature header');
      return res.status(400).json({ error: 'Missing Stripe signature header' });
    }
    advLog('Stripe signature:', sig);
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
    advLog('✅ Webhook signature verified');
  } catch (err) {
    advLog('❌ Webhook signature verification failed:', err.message);
    advLog('Stack:', err.stack);
    return res.status(400).json({ error: 'Webhook signature verification failed', details: err.message });
  }

  advLog('Received webhook event:', event.type);
  advLog('Event payload:', JSON.stringify(event.data.object, null, 2));

  try {
    // Check if Firebase is available
    if (!db || !firebaseInitialized) {
      advLog('❌ Firebase not initialized, cannot process webhook');
      advLog('Firebase status:', { db: !!db, initialized: firebaseInitialized });
      return res.status(503).json({ error: 'Firebase service unavailable' });
    }

    switch (event.type) {
      case 'checkout.session.completed':
        advLog('Handling checkout.session.completed');
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      case 'customer.subscription.created':
        advLog('Handling customer.subscription.created');
        await handleSubscriptionCreated(event.data.object);
        break;
      case 'customer.subscription.updated':
        advLog('Handling customer.subscription.updated');
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        advLog('Handling customer.subscription.deleted');
        await handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        advLog('Handling invoice.payment_succeeded');
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        advLog('Handling invoice.payment_failed');
        await handleInvoicePaymentFailed(event.data.object);
        break;
      case 'customer.subscription.trial_will_end':
        advLog('Handling customer.subscription.trial_will_end');
        await handleTrialWillEnd(event.data.object);
        break;
      default:
        advLog(`Unhandled event type: ${event.type}`);
    }

    advLog('✅ Webhook event processed successfully');
    res.json({ received: true, event: event.type });
  } catch (error) {
    advLog('❌ Webhook handler error:', error.message);
    advLog('Stack:', error.stack);
    res.status(500).json({ error: 'Webhook handler failed', details: error.message });
  }
};

/**
 * Handle checkout session completion
 * @param {Object} session - Stripe checkout session
 */
async function handleCheckoutSessionCompleted(session) {
  advLog('handleCheckoutSessionCompleted called with:', JSON.stringify(session, null, 2));
  const firebaseUid = session.metadata?.firebaseUid;
  if (!firebaseUid) {
    advLog('❌ No firebaseUid in session metadata');
    return;
  }

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
      webhook_source: 'stripe-webhook-v2',
      event_type: 'checkout.session.completed',
    }
  };
  Object.keys(subscriptionData.subscription).forEach(key => {
    if (subscriptionData.subscription[key] === null || subscriptionData.subscription[key] === undefined) {
      delete subscriptionData.subscription[key];
    }
  });
  try {
    await userRef.set(subscriptionData, { merge: true });
    advLog(`✅ Subscription activated for user: ${firebaseUid}`, subscriptionData);
  } catch (err) {
    advLog('❌ Error updating Firestore in handleCheckoutSessionCompleted:', err.message);
    advLog('Stack:', err.stack);
  }
}

/**
 * Handle subscription creation
 * @param {Object} subscription - Stripe subscription
 */
async function handleSubscriptionCreated(subscription) {
  advLog('handleSubscriptionCreated called with:', JSON.stringify(subscription, null, 2));
  const firebaseUid = subscription.metadata?.firebaseUid;
  if (!firebaseUid) {
    advLog('❌ No firebaseUid in subscription metadata');
    return;
  }

  const userRef = db.collection('users').doc(firebaseUid);
  
  // Filter out undefined values to prevent Firestore errors
  const subscriptionData = {
    subscription: {
      active: subscription.status === 'active',
      status: subscription.status,
      stripeCustomerId: subscription.customer || null,
      stripeSubscriptionId: subscription.id || null,
      current_period_start: subscription.current_period_start || null,
      current_period_end: subscription.current_period_end || null,
      created_at: new Date(),
      updated_at: new Date(),
      webhook_source: 'stripe-webhook-v2',
      event_type: 'customer.subscription.created',
    }
  };

  // Remove null/undefined values to prevent Firestore errors
  Object.keys(subscriptionData.subscription).forEach(key => {
    if (subscriptionData.subscription[key] === null || subscriptionData.subscription[key] === undefined) {
      delete subscriptionData.subscription[key];
    }
  });

  try {
    await userRef.set(subscriptionData, { merge: true });
    advLog(`✅ Subscription created for user: ${firebaseUid}`, subscriptionData);
  } catch (err) {
    advLog('❌ Error updating Firestore in handleSubscriptionCreated:', err.message);
    advLog('Stack:', err.stack);
  }
}

/**
 * Handle subscription updates
 * @param {Object} subscription - Stripe subscription
 */
async function handleSubscriptionUpdated(subscription) {
  advLog('handleSubscriptionUpdated called with:', JSON.stringify(subscription, null, 2));
  const firebaseUid = subscription.metadata?.firebaseUid;
  if (!firebaseUid) {
    advLog('❌ No firebaseUid in subscription metadata');
    return;
  }

  const userRef = db.collection('users').doc(firebaseUid);
  
  // Filter out undefined values to prevent Firestore errors
  const subscriptionData = {
    subscription: {
      active: subscription.status === 'active',
      status: subscription.status,
      stripeCustomerId: subscription.customer || null,
      stripeSubscriptionId: subscription.id || null,
      current_period_start: subscription.current_period_start || null,
      current_period_end: subscription.current_period_end || null,
      updated_at: new Date(),
      webhook_source: 'stripe-webhook-v2',
      event_type: 'customer.subscription.updated',
    }
  };

  // Remove null/undefined values to prevent Firestore errors
  Object.keys(subscriptionData.subscription).forEach(key => {
    if (subscriptionData.subscription[key] === null || subscriptionData.subscription[key] === undefined) {
      delete subscriptionData.subscription[key];
    }
  });

  try {
    await userRef.set(subscriptionData, { merge: true });
    advLog(`✅ Subscription updated for user: ${firebaseUid}`, subscriptionData);
  } catch (err) {
    advLog('❌ Error updating Firestore in handleSubscriptionUpdated:', err.message);
    advLog('Stack:', err.stack);
  }
}

/**
 * Handle subscription deletion
 * @param {Object} subscription - Stripe subscription
 */
async function handleSubscriptionDeleted(subscription) {
  advLog('handleSubscriptionDeleted called with:', JSON.stringify(subscription, null, 2));
  const firebaseUid = subscription.metadata?.firebaseUid;
  if (!firebaseUid) {
    advLog('❌ No firebaseUid in subscription metadata');
    return;
  }

  const userRef = db.collection('users').doc(firebaseUid);
  
  // Filter out undefined values to prevent Firestore errors
  const subscriptionData = {
    subscription: {
      active: false,
      status: 'canceled',
      stripeCustomerId: subscription.customer || null,
      stripeSubscriptionId: subscription.id || null,
      canceled_at: new Date(),
      updated_at: new Date(),
      webhook_source: 'stripe-webhook-v2',
      event_type: 'customer.subscription.deleted',
    }
  };

  // Remove null/undefined values to prevent Firestore errors
  Object.keys(subscriptionData.subscription).forEach(key => {
    if (subscriptionData.subscription[key] === null || subscriptionData.subscription[key] === undefined) {
      delete subscriptionData.subscription[key];
    }
  });

  try {
    await userRef.set(subscriptionData, { merge: true });
    advLog(`✅ Subscription canceled for user: ${firebaseUid}`, subscriptionData);
  } catch (err) {
    advLog('❌ Error updating Firestore in handleSubscriptionDeleted:', err.message);
    advLog('Stack:', err.stack);
  }
}

/**
 * Handle successful invoice payment
 * @param {Object} invoice - Stripe invoice
 */
async function handleInvoicePaymentSucceeded(invoice) {
  advLog('handleInvoicePaymentSucceeded called with:', JSON.stringify(invoice, null, 2));
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const firebaseUid = subscription.metadata?.firebaseUid;
    
    if (firebaseUid) {
      const userRef = db.collection('users').doc(firebaseUid);
      try {
        await userRef.set({
          subscription: {
            active: true,
            status: 'active',
            last_payment_date: new Date(),
            updated_at: new Date(),
            webhook_source: 'stripe-webhook-v2',
            event_type: 'invoice.payment_succeeded',
          }
        }, { merge: true });
        advLog(`✅ Payment succeeded for user: ${firebaseUid}`);
      } catch (err) {
        advLog('❌ Error updating Firestore in handleInvoicePaymentSucceeded:', err.message);
        advLog('Stack:', err.stack);
      }
    } else {
      advLog('❌ No firebaseUid in subscription metadata for invoice.payment_succeeded');
    }
  }
}

/**
 * Handle failed invoice payment
 * @param {Object} invoice - Stripe invoice
 */
async function handleInvoicePaymentFailed(invoice) {
  advLog('handleInvoicePaymentFailed called with:', JSON.stringify(invoice, null, 2));
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const firebaseUid = subscription.metadata?.firebaseUid;
    
    if (firebaseUid) {
      const userRef = db.collection('users').doc(firebaseUid);
      try {
        await userRef.set({
          subscription: {
            active: false,
            status: 'past_due',
            last_payment_failed: new Date(),
            updated_at: new Date(),
            webhook_source: 'stripe-webhook-v2',
            event_type: 'invoice.payment_failed',
          }
        }, { merge: true });
        advLog(`✅ Payment failed for user: ${firebaseUid}`);
      } catch (err) {
        advLog('❌ Error updating Firestore in handleInvoicePaymentFailed:', err.message);
        advLog('Stack:', err.stack);
      }
    } else {
      advLog('❌ No firebaseUid in subscription metadata for invoice.payment_failed');
    }
  }
}

/**
 * Handle trial ending soon
 * @param {Object} subscription - Stripe subscription
 */
async function handleTrialWillEnd(subscription) {
  advLog('handleTrialWillEnd called with:', JSON.stringify(subscription, null, 2));
  // You could send an email notification here
}

module.exports = stripeWebhook; 