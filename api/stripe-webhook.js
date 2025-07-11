const { buffer } = require('micro');
const Stripe = require('stripe');
const { db, initialized: firebaseInitialized } = require('./firebase-admin');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });

/**
 * Handle Stripe webhook events
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const stripeWebhook = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const buf = await buffer(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('Received webhook event:', event.type);

  try {
    // Check if Firebase is available
    if (!db || !firebaseInitialized) {
      console.error('Firebase not initialized, cannot process webhook');
      return res.status(503).json({ error: 'Firebase service unavailable' });
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
};

/**
 * Handle checkout session completion
 * @param {Object} session - Stripe checkout session
 */
async function handleCheckoutSessionCompleted(session) {
  const firebaseUid = session.metadata?.firebaseUid;
  if (!firebaseUid) {
    console.error('No firebaseUid in session metadata');
    return;
  }

  const userRef = db.collection('users').doc(firebaseUid);
  
  // Filter out undefined values to prevent Firestore errors
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
      updated_at: new Date()
    }
  };

  // Remove null/undefined values to prevent Firestore errors
  Object.keys(subscriptionData.subscription).forEach(key => {
    if (subscriptionData.subscription[key] === null || subscriptionData.subscription[key] === undefined) {
      delete subscriptionData.subscription[key];
    }
  });

  await userRef.set(subscriptionData, { merge: true });

  console.log(`Subscription activated for user: ${firebaseUid}`);
}

/**
 * Handle subscription creation
 * @param {Object} subscription - Stripe subscription
 */
async function handleSubscriptionCreated(subscription) {
  const firebaseUid = subscription.metadata?.firebaseUid;
  if (!firebaseUid) {
    console.error('No firebaseUid in subscription metadata');
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
      updated_at: new Date()
    }
  };

  // Remove null/undefined values to prevent Firestore errors
  Object.keys(subscriptionData.subscription).forEach(key => {
    if (subscriptionData.subscription[key] === null || subscriptionData.subscription[key] === undefined) {
      delete subscriptionData.subscription[key];
    }
  });

  await userRef.set(subscriptionData, { merge: true });

  console.log(`Subscription created for user: ${firebaseUid}`);
}

/**
 * Handle subscription updates
 * @param {Object} subscription - Stripe subscription
 */
async function handleSubscriptionUpdated(subscription) {
  const firebaseUid = subscription.metadata?.firebaseUid;
  if (!firebaseUid) {
    console.error('No firebaseUid in subscription metadata');
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
      updated_at: new Date()
    }
  };

  // Remove null/undefined values to prevent Firestore errors
  Object.keys(subscriptionData.subscription).forEach(key => {
    if (subscriptionData.subscription[key] === null || subscriptionData.subscription[key] === undefined) {
      delete subscriptionData.subscription[key];
    }
  });

  await userRef.set(subscriptionData, { merge: true });

  console.log(`Subscription updated for user: ${firebaseUid}`);
}

/**
 * Handle subscription deletion
 * @param {Object} subscription - Stripe subscription
 */
async function handleSubscriptionDeleted(subscription) {
  const firebaseUid = subscription.metadata?.firebaseUid;
  if (!firebaseUid) {
    console.error('No firebaseUid in subscription metadata');
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
      updated_at: new Date()
    }
  };

  // Remove null/undefined values to prevent Firestore errors
  Object.keys(subscriptionData.subscription).forEach(key => {
    if (subscriptionData.subscription[key] === null || subscriptionData.subscription[key] === undefined) {
      delete subscriptionData.subscription[key];
    }
  });

  await userRef.set(subscriptionData, { merge: true });

  console.log(`Subscription canceled for user: ${firebaseUid}`);
}

/**
 * Handle successful invoice payment
 * @param {Object} invoice - Stripe invoice
 */
async function handleInvoicePaymentSucceeded(invoice) {
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const firebaseUid = subscription.metadata?.firebaseUid;
    
    if (firebaseUid) {
      const userRef = db.collection('users').doc(firebaseUid);
      await userRef.set({
        subscription: {
          active: true,
          status: 'active',
          last_payment_date: new Date(),
          updated_at: new Date()
        }
      }, { merge: true });
      
      console.log(`Payment succeeded for user: ${firebaseUid}`);
    }
  }
}

/**
 * Handle failed invoice payment
 * @param {Object} invoice - Stripe invoice
 */
async function handleInvoicePaymentFailed(invoice) {
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const firebaseUid = subscription.metadata?.firebaseUid;
    
    if (firebaseUid) {
      const userRef = db.collection('users').doc(firebaseUid);
      await userRef.set({
        subscription: {
          active: false,
          status: 'past_due',
          last_payment_failed: new Date(),
          updated_at: new Date()
        }
      }, { merge: true });
      
      console.log(`Payment failed for user: ${firebaseUid}`);
    }
  }
}

/**
 * Handle trial ending soon
 * @param {Object} subscription - Stripe subscription
 */
async function handleTrialWillEnd(subscription) {
  const firebaseUid = subscription.metadata?.firebaseUid;
  if (firebaseUid) {
    console.log(`Trial ending soon for user: ${firebaseUid}`);
    // You could send an email notification here
  }
}

module.exports = stripeWebhook; 