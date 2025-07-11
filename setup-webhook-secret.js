const fs = require('fs');
const path = require('path');

/**
 * Setup webhook secret configuration
 */
async function setupWebhookSecret() {
  console.log('🔧 Setting up Stripe webhook secret...');
  console.log('\n📋 Current webhook secret status:');
  
  // Read current .env file
  const envPath = path.join(__dirname, '.env');
  let envContent = '';
  
  try {
    envContent = fs.readFileSync(envPath, 'utf8');
  } catch (error) {
    console.error('❌ Error reading .env file:', error.message);
    return;
  }
  
  // Check current webhook secret
  const webhookSecretMatch = envContent.match(/STRIPE_WEBHOOK_SECRET=(.+)/);
  const currentSecret = webhookSecretMatch ? webhookSecretMatch[1] : 'NOT SET';
  
  console.log(`   Current: ${currentSecret}`);
  
  if (currentSecret === 'whsec_placeholder' || currentSecret === 'NOT SET') {
    console.log('\n❌ Webhook secret is not configured properly!');
    console.log('\n🎯 To fix this:');
    console.log('1. Go to Stripe Dashboard: https://dashboard.stripe.com/webhooks');
    console.log('2. Find your webhook endpoint or create a new one');
    console.log('3. Copy the "Signing secret" (starts with whsec_)');
    console.log('4. Update your .env file with the correct secret');
    console.log('\n📝 Example:');
    console.log('   STRIPE_WEBHOOK_SECRET=whsec_your_actual_secret_here');
    console.log('\n🔗 Webhook URL should be:');
    console.log('   http://localhost:3001/api/stripe-webhook (for local development)');
    console.log('   or your ngrok URL: https://your-ngrok-url.ngrok.io/api/stripe-webhook');
    console.log('\n📋 Required webhook events:');
    console.log('   - checkout.session.completed');
    console.log('   - customer.subscription.created');
    console.log('   - customer.subscription.updated');
    console.log('   - customer.subscription.deleted');
    console.log('   - invoice.payment_succeeded');
    console.log('   - invoice.payment_failed');
  } else {
    console.log('\n✅ Webhook secret appears to be configured!');
    console.log('\n🧪 To test if it works:');
    console.log('1. Make sure your webhook URL is set in Stripe Dashboard');
    console.log('2. Try a test payment');
    console.log('3. Check server logs for webhook events');
  }
  
  console.log('\n🔍 To verify webhook setup:');
  console.log('1. Run: npm start');
  console.log('2. Visit: http://localhost:3001/api/debug-env');
  console.log('3. Check if STRIPE_WEBHOOK_SECRET shows "SET"');
}

// Run the setup
setupWebhookSecret().catch(console.error); 