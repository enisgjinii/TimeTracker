/**
 * Debug environment variables
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const debugEnv = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? 'SET' : 'NOT SET',
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? 'SET' : 'NOT SET',
      FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? 'SET' : 'NOT SET',
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'SET' : 'NOT SET',
      STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY ? 'SET' : 'NOT SET',
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ? 'SET' : 'NOT SET'
    };

    return res.status(200).json({
      success: true,
      environment: envVars,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Debug env error:', error);
    return res.status(500).json({ 
      error: 'Debug env failed',
      details: error.message
    });
  }
};

module.exports = debugEnv; 