/**
 * Create Stripe payment intent for subscription
 * This avoids client-side Stripe.js initialization issues
 */

// Check if we have a valid Stripe key
const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey || stripeKey.includes('placeholder')) {
  console.warn('⚠️  Stripe secret key not configured or is placeholder');
}

const stripe = stripeKey && !stripeKey.includes('placeholder') ? 
  require('stripe')(stripeKey, { apiVersion: '2025-06-30.basil' }) : null;

/**
 * Create Stripe payment intent for subscription
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createPaymentIntent = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if Stripe is configured
  if (!stripe) {
    return res.status(503).json({ 
      error: 'Payment service not configured',
      details: 'Stripe credentials not configured. Please check your environment variables.'
    });
  }

  const { priceId, firebaseUid, amount } = req.body;

  // Validate required fields
  if (!priceId || !firebaseUid || !amount) {
    return res.status(400).json({ 
      error: 'Missing required fields: priceId, firebaseUid, and amount are required' 
    });
  }

  try {
    console.log('🔧 Creating payment intent for:', { priceId, firebaseUid, amount });
    
    // Validate price ID format
    if (!priceId.startsWith('price_')) {
      return res.status(400).json({ error: 'Invalid price ID format' });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Amount in cents
      currency: 'usd',
      metadata: { 
        firebaseUid,
        priceId 
      },
      customer_email: req.body.email, // Optional: pre-fill email
      receipt_email: req.body.email,
      description: `Subscription payment for ${priceId}`,
      // For subscriptions, we'll create the subscription after successful payment
      setup_future_usage: 'off_session'
    });

    console.log('🔧 Payment intent created successfully:', { 
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id 
    });

    res.status(200).json({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (err) {
    console.error('Stripe payment intent error:', err);
    
    // Handle specific Stripe errors
    if (err.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ 
        error: 'Invalid request parameters' 
      });
    }
    
    if (err.type === 'StripeAuthenticationError') {
      return res.status(500).json({ 
        error: 'Payment service configuration error' 
      });
    }

    res.status(500).json({ 
      error: 'Failed to create payment intent',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

module.exports = createPaymentIntent; 