/**
 * Stripe Configuration API - Provides Stripe configuration to frontend
 * Returns publishable key and other configuration needed for Stripe.js
 */

/**
 * Get Stripe configuration for frontend
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getStripeConfig = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
    
    if (!publishableKey || publishableKey.includes('placeholder')) {
      return res.status(503).json({ 
        error: 'Stripe configuration not available',
        details: 'Publishable key not configured. Please check your environment variables.'
      });
    }

    res.status(200).json({ 
      publishableKey,
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Error getting Stripe config:', error);
    res.status(500).json({ 
      error: 'Failed to get Stripe configuration',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = getStripeConfig; 