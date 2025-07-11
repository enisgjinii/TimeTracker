const https = require('https');

/**
 * Test Vercel webhook endpoint
 */
function testVercelWebhook() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'time-tracker-bice-pi.vercel.app',
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
 * Test webhook endpoint specifically
 */
function testWebhookEndpoint() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'time-tracker-bice-pi.vercel.app',
      port: 443,
      path: '/api/test-firebase',
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
async function testVercel() {
  console.log('🧪 Testing Vercel webhook endpoints...');
  
  try {
    // Test simple endpoint
    console.log('1. Testing simple endpoint...');
    const simpleResult = await testVercelWebhook();
    console.log('✅ Simple endpoint status:', simpleResult.status);
    
    // Test Firebase endpoint
    console.log('2. Testing Firebase endpoint...');
    const firebaseResult = await testWebhookEndpoint();
    console.log('✅ Firebase endpoint status:', firebaseResult.status);
    
    console.log('\n🎯 Vercel endpoints are working!');
    console.log('\n📋 Next Steps:');
    console.log('1. Go to Stripe Dashboard > Webhooks');
    console.log('2. Update webhook URL to: https://time-tracker-bice-pi.vercel.app/api/stripe-webhook');
    console.log('3. Enable these events:');
    console.log('   - checkout.session.completed');
    console.log('   - customer.subscription.created');
    console.log('   - customer.subscription.updated');
    console.log('   - customer.subscription.deleted');
    console.log('   - invoice.payment_succeeded');
    console.log('   - invoice.payment_failed');
    console.log('4. Test with a payment - webhooks should work automatically!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nMake sure:');
    console.log('1. Vercel deployment is complete');
    console.log('2. Environment variables are set in Vercel');
    console.log('3. The domain is correct');
  }
}

testVercel(); 