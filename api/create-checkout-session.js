// Check if we have a valid Stripe key
const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey || stripeKey.includes('placeholder')) {
  console.warn('⚠️  Stripe secret key not configured or is placeholder');
}

const stripe = stripeKey && !stripeKey.includes('placeholder') ? 
  require('stripe')(stripeKey) : null;

/**
 * Create Stripe checkout session for subscription
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createCheckoutSession = async (req, res) => {
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

  const { priceId, firebaseUid } = req.body;

  // Validate required fields
  if (!priceId || !firebaseUid) {
    return res.status(400).json({ 
      error: 'Missing required fields: priceId and firebaseUid are required' 
    });
  }

  try {
    console.log('🔧 Creating checkout session for:', { priceId, firebaseUid });
    
    // Validate price ID format
    if (!priceId.startsWith('price_')) {
      return res.status(400).json({ error: 'Invalid price ID format' });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ 
        price: priceId, 
        quantity: 1 
      }],
      mode: 'subscription',
      success_url: `${process.env.APP_URL || 'http://localhost:3001'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL || 'http://localhost:3001'}/cancel`,
      metadata: { 
        firebaseUid,
        priceId 
      },
      customer_email: req.body.email, // Optional: pre-fill email
      billing_address_collection: 'required',
      allow_promotion_codes: true,
      subscription_data: {
        metadata: {
          firebaseUid
        }
      },
      // Disable client-side Stripe.js to prevent API key issues
      client_reference_id: firebaseUid,
      // Ensure the session doesn't require client-side initialization
      payment_method_collection: 'always'
    });

    console.log('🔧 Checkout session created successfully:', { sessionId: session.id, url: session.url });
    res.status(200).json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (err) {
    console.error('Stripe checkout session error:', err);
    
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
      error: 'Failed to create checkout session',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

module.exports = createCheckoutSession; 