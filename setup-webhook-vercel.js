const fs = require('fs');
const path = require('path');

/**
 * Setup webhook for Vercel deployment
 */
async function setupWebhookVercel() {
  console.log('🔧 Setting up Stripe webhook for Vercel deployment...');
  console.log('\n📋 Vercel Configuration:');
  console.log('   Domain: time-tracker-bice-pi.vercel.app');
  console.log('   Webhook URL: https://time-tracker-bice-pi.vercel.app/api/stripe-webhook');
  
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
  
  console.log('\n📋 Current webhook secret status:');
  console.log(`   Current: ${currentSecret}`);
  
  if (currentSecret === 'whsec_your_actual_secret_here' || currentSecret === 'whsec_placeholder' || currentSecret === 'NOT SET') {
    console.log('\n❌ Webhook secret is not configured properly!');
    console.log('\n🎯 To fix this:');
    console.log('1. Go to Stripe Dashboard: https://dashboard.stripe.com/webhooks');
    console.log('2. Create a new webhook endpoint or update existing one');
    console.log('3. Set the webhook URL to: https://time-tracker-bice-pi.vercel.app/api/stripe-webhook');
    console.log('4. Copy the "Signing secret" (starts with whsec_)');
    console.log('5. Update your .env file with the correct secret');
    console.log('\n📝 Example:');
    console.log('   STRIPE_WEBHOOK_SECRET=whsec_your_actual_secret_here');
  } else {
    console.log('\n✅ Webhook secret appears to be configured!');
  }
  
  console.log('\n🔗 Vercel Webhook Setup:');
  console.log('1. Go to Stripe Dashboard > Webhooks');
  console.log('2. Create/Update webhook endpoint:');
  console.log('   URL: https://time-tracker-bice-pi.vercel.app/api/stripe-webhook');
  console.log('3. Enable these events:');
  console.log('   - checkout.session.completed');
  console.log('   - customer.subscription.created');
  console.log('   - customer.subscription.updated');
  console.log('   - customer.subscription.deleted');
  console.log('   - invoice.payment_succeeded');
  console.log('   - invoice.payment_failed');
  console.log('4. Copy the signing secret and update your .env file');
  console.log('5. Deploy to Vercel: vercel --prod');
  
  console.log('\n🧪 Testing Vercel webhook:');
  console.log('1. Deploy your changes: vercel --prod');
  console.log('2. Test webhook endpoint: https://time-tracker-bice-pi.vercel.app/api/simple-test');
  console.log('3. Make a test payment to verify webhooks work');
  
  console.log('\n📋 Environment Variables for Vercel:');
  console.log('Make sure these are set in your Vercel dashboard:');
  console.log('- STRIPE_SECRET_KEY');
  console.log('- STRIPE_PUBLISHABLE_KEY');
  console.log('- STRIPE_WEBHOOK_SECRET');
  console.log('- FIREBASE_PROJECT_ID');
  console.log('- FIREBASE_CLIENT_EMAIL');
  console.log('- FIREBASE_PRIVATE_KEY');
}

// Run the setup
setupWebhookVercel().catch(console.error); 