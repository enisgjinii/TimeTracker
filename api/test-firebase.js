const { db, initialized: firebaseInitialized } = require('./firebase-admin');

/**
 * Test Firebase connection
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const testFirebase = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔧 Testing Firebase connection...');
    
    if (!db || !firebaseInitialized) {
      return res.status(503).json({ 
        error: 'Firebase not initialized',
        initialized: firebaseInitialized,
        db: !!db
      });
    }

    // Test a simple Firestore operation
    const testDoc = db.collection('test').doc('connection-test');
    
    // Try to write a test document
    await testDoc.set({
      test: true,
      timestamp: new Date(),
      message: 'Firebase connection test'
    });

    // Try to read it back
    const doc = await testDoc.get();
    
    if (doc.exists) {
      // Clean up the test document
      await testDoc.delete();
      
      return res.status(200).json({
        success: true,
        message: 'Firebase connection successful',
        initialized: firebaseInitialized,
        timestamp: new Date().toISOString()
      });
    } else {
      return res.status(500).json({
        error: 'Firebase write succeeded but read failed',
        initialized: firebaseInitialized
      });
    }

  } catch (error) {
    console.error('Firebase test error:', error);
    return res.status(500).json({ 
      error: 'Firebase connection failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: error.code,
      initialized: firebaseInitialized
    });
  }
};

module.exports = testFirebase; 