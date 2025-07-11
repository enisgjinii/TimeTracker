/**
 * Vercel deployment test endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const vercelTest = async (req, res) => {
  const timestamp = new Date().toISOString();
  
  // Log the request
  console.log(`[${timestamp}] Vercel test endpoint called`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  // Check environment variables
  const envStatus = {
    NODE_ENV: process.env.NODE_ENV,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'SET' : 'NOT SET',
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ? 'SET' : 'NOT SET',
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? 'SET' : 'NOT SET',
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? 'SET' : 'NOT SET',
  };
  
  console.log('Environment status:', envStatus);
  
  // Return detailed response
  res.status(200).json({
    success: true,
    message: 'Vercel deployment is working!',
    timestamp: timestamp,
    environment: envStatus,
    headers: req.headers,
    method: req.method,
    url: req.url,
    deployment: 'time-tracker-bice-pi.vercel.app'
  });
};

module.exports = vercelTest; 