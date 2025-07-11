const https = require('https');

/**
 * Trigger webhook manually after payment
 */
async function triggerWebhook(sessionId, firebaseUid) {
  const postData = JSON.stringify({
    sessionId: sessionId,
    firebaseUid: firebaseUid
  });

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/test-webhook',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ status: res.statusCode, data: result });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Main function
 */
async function main() {
  const sessionId = process.argv[2];
  const firebaseUid = process.argv[3];

  if (!sessionId || !firebaseUid) {
    console.log('❌ Usage: node trigger-webhook.js <sessionId> <firebaseUid>');
    console.log('Example: node trigger-webhook.js cs_test_abc123 EJ8UyNGP8iT07o0LKRXqA4SQdIQ2');
    return;
  }

  try {
    console.log('🔄 Triggering webhook for session:', sessionId);
    console.log('👤 Firebase UID:', firebaseUid);
    
    const result = await triggerWebhook(sessionId, firebaseUid);
    
    if (result.status === 200) {
      console.log('✅ Webhook triggered successfully!');
      console.log('📊 Result:', result.data);
    } else {
      console.log('❌ Webhook failed with status:', result.status);
      console.log('📊 Result:', result.data);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nMake sure:');
    console.log('1. Your server is running: npm start');
    console.log('2. The session ID is valid');
    console.log('3. The Firebase UID is correct');
  }
}

main(); 