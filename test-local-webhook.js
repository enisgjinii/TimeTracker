const http = require('http');

/**
 * Test webhook locally
 */
async function testLocalWebhook() {
  console.log('🧪 Testing local webhook functionality...');
  console.log('📋 Local server: http://localhost:3001');
  console.log('🔗 Webhook endpoint: http://localhost:3001/api/stripe-webhook');
  
  // Test 1: Check if local server is running
  console.log('\n1. Testing local server connectivity...');
  try {
    const response = await fetch('http://localhost:3001/api/debug-env');
    const data = await response.json();
    console.log('✅ Local server is running');
    console.log('📋 Environment status:', data.environment.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.log('❌ Local server not accessible:', error.message);
    return;
  }
  
  // Test 2: Check Stripe webhook configuration
  console.log('\n2. Checking Stripe webhook configuration...');
  console.log('🔍 Go to Stripe Dashboard > Webhooks');
  console.log('📋 Check if webhook URL is set to:');
  console.log('   Local: http://localhost:3001/api/stripe-webhook');
  console.log('   OR Vercel: https://time-tracker-bice-pi.vercel.app/api/stripe-webhook');
  
  console.log('\n🎯 The Issue:');
  console.log('   - Your local server is running ✅');
  console.log('   - Your webhook secret is configured ✅');
  console.log('   - But Stripe webhooks are probably configured for Vercel, not localhost');
  
  console.log('\n🔧 Solutions:');
  console.log('Option 1: Test with local webhook');
  console.log('   1. Go to Stripe Dashboard > Webhooks');
  console.log('   2. Update webhook URL to: http://localhost:3001/api/stripe-webhook');
  console.log('   3. Test a payment locally');
  
  console.log('\nOption 2: Test with Vercel webhook');
  console.log('   1. Set environment variables in Vercel dashboard');
  console.log('   2. Deploy: vercel --prod');
  console.log('   3. Test payment on Vercel deployment');
  
  console.log('\nOption 3: Use manual webhook test');
  console.log('   1. Complete payment');
  console.log('   2. Use manual webhook test endpoint');
  console.log('   3. This bypasses signature verification');
}

// Run the test
testLocalWebhook().catch(console.error); 