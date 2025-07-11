const https = require('https');

/**
 * Test if webhook endpoint is accessible
 */
function testWebhookEndpoint(ngrokUrl) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: new URL(ngrokUrl).hostname,
      port: 443,
      path: '/api/simple-test',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data });
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => reject(new Error('Timeout')));
    req.end();
  });
}

/**
 * Main test function
 */
async function testWebhook() {
  console.log('🧪 Testing webhook accessibility...');
  
  // You need to replace this with your actual ngrok URL
  const ngrokUrl = process.argv[2];
  
  if (!ngrokUrl) {
    console.log('❌ Please provide your ngrok URL as an argument');
    console.log('Usage: node test-webhook-automatic.js https://your-ngrok-url.ngrok.io');
    console.log('\nTo get your ngrok URL:');
    console.log('1. Open a new terminal');
    console.log('2. Run: ngrok http 3001');
    console.log('3. Copy the https URL from the output');
    return;
  }

  try {
    const result = await testWebhookEndpoint(ngrokUrl);
    console.log('✅ Webhook endpoint is accessible!');
    console.log('Status:', result.status);
    console.log('\n🎯 Next steps:');
    console.log('1. Go to Stripe Dashboard > Webhooks');
    console.log('2. Update webhook URL to:', `${ngrokUrl}/api/stripe-webhook`);
    console.log('3. Test with a payment - webhooks should work automatically!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nMake sure:');
    console.log('1. ngrok is running: ngrok http 3001');
    console.log('2. Your server is running: npm start');
    console.log('3. The ngrok URL is correct');
  }
}

testWebhook(); 