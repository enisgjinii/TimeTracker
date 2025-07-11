/**
 * Get available subscription plans
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getSubscriptionPlans = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Define subscription plans
    const plans = [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        priceId: null,
        interval: null,
        features: [
          'Basic time tracking',
          'Daily activity view',
          'Basic productivity insights',
          'Manual time entry',
          '7 days of history'
        ],
        limitations: [
          'Limited to 7 days of history',
          'No advanced analytics',
          'No team features',
          'No export functionality'
        ],
        popular: false
      },
      {
        id: 'pro',
        name: 'Pro',
        price: 9.99,
        priceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly',
        interval: 'month',
        features: [
          'Unlimited time tracking',
          'Advanced analytics & insights',
          'Productivity scoring',
          'Custom categories & tags',
          'Export data (CSV, JSON)',
          'Email reports',
          'Priority support',
          'Unlimited history'
        ],
        limitations: [],
        popular: true
      },
      {
        id: 'business',
        name: 'Business',
        price: 29.99,
        priceId: process.env.STRIPE_BUSINESS_PRICE_ID || 'price_business_monthly',
        interval: 'month',
        features: [
          'All Pro features',
          'Team management',
          'Team productivity insights',
          'Advanced reporting',
          'API access',
          'Custom integrations',
          'Dedicated support',
          'Team analytics'
        ],
        limitations: [],
        popular: false
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: null,
        priceId: null,
        interval: null,
        features: [
          'All Business features',
          'Custom deployment',
          'Advanced security',
          'SLA guarantees',
          'Custom integrations',
          'Dedicated account manager',
          'Training & onboarding',
          'White-label options'
        ],
        limitations: [],
        popular: false,
        custom: true
      }
    ];

    // Add Stripe price IDs if available
    if (process.env.STRIPE_PRO_PRICE_ID) {
      const proPlan = plans.find(p => p.id === 'pro');
      if (proPlan) {
        proPlan.priceId = process.env.STRIPE_PRO_PRICE_ID;
      }
    }

    if (process.env.STRIPE_BUSINESS_PRICE_ID) {
      const businessPlan = plans.find(p => p.id === 'business');
      if (businessPlan) {
        businessPlan.priceId = process.env.STRIPE_BUSINESS_PRICE_ID;
      }
    }

    res.status(200).json({ 
      plans,
      currency: 'USD',
      billing_cycle: 'monthly'
    });
  } catch (error) {
    console.error('Error getting subscription plans:', error);
    return res.status(500).json({ 
      error: 'Failed to get subscription plans',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = getSubscriptionPlans; 