/**
 * Simple test endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const simpleTest = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    return res.status(200).json({
      success: true,
      message: 'Server is working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Simple test error:', error);
    return res.status(500).json({ 
      error: 'Simple test failed',
      details: error.message
    });
  }
};

module.exports = simpleTest; 