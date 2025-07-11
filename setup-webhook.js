const https = require('https');
const http = require('http');

/**
 * Get ngrok tunnel URL
 */
async function getNgrokUrl() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:4040/api/tunnels', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const tunnels = JSON.parse(data);
          if (tunnels.tunnels && tunnels.tunnels.length > 0) {
            resolve(tunnels.tunnels[0].public_url);
          } else {
            reject(new Error('No tunnels found'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => reject(new Error('Timeout')));
  });
}

/**
 * Test webhook endpoint
 */
async function testWebhookEndpoint(url) {
  return new Promise((resolve, reject) => {
    const testData = JSON.stringify({ test: true });
    const options = {
      hostname: new URL(url).hostname,
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
 * Main setup function
 */
async function setupWebhook() {
  console.log('🔧 Setting up automatic webhook...');
  
  try {
    // Wait for ngrok to be ready
    console.log('⏳ Waiting for ngrok tunnel...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const ngrokUrl = await getNgrokUrl();
    console.log('✅ ngrok URL found:', ngrokUrl);
    
    // Test the endpoint
    console.log('🧪 Testing webhook endpoint...');
    const testResult = await testWebhookEndpoint(ngrokUrl);
    console.log('✅ Webhook endpoint test result:', testResult.status);
    
    const webhookUrl = `${ngrokUrl}/api/stripe-webhook`;
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Go to your Stripe Dashboard: https://dashboard.stripe.com/webhooks');
    console.log('2. Update your webhook endpoint URL to:');
    console.log(`   ${webhookUrl}`);
    console.log('3. Make sure these events are enabled:');
    console.log('   - checkout.session.completed');
    console.log('   - customer.subscription.created');
    console.log('   - customer.subscription.updated');
    console.log('   - customer.subscription.deleted');
    console.log('   - invoice.payment_succeeded');
    console.log('   - invoice.payment_failed');
    console.log('4. Test with a payment - webhooks should now work automatically!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📋 Manual Setup:');
    console.log('1. Open a new terminal and run: ngrok http 3001');
    console.log('2. Copy the https URL from the ngrok output');
    console.log('3. Update your Stripe webhook URL to: https://your-ngrok-url.ngrok.io/api/stripe-webhook');
  }
}

// Run the setup
setupWebhook().catch(console.error); 