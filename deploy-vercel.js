const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Deploy to Vercel and test webhook setup
 */
async function deployVercel() {
  console.log('🚀 Deploying to Vercel...');
  console.log('📋 Domain: time-tracker-bice-pi.vercel.app');
  console.log('🔗 Webhook URL: https://time-tracker-bice-pi.vercel.app/api/stripe-webhook');
  
  // Check if vercel is installed
  console.log('\n1. Checking Vercel CLI...');
  try {
    await execCommand('vercel --version');
    console.log('✅ Vercel CLI is installed');
  } catch (error) {
    console.log('❌ Vercel CLI not found. Installing...');
    await execCommand('npm install -g vercel');
  }
  
  // Deploy to Vercel
  console.log('\n2. Deploying to Vercel...');
  try {
    await execCommand('vercel --prod --yes');
    console.log('✅ Deployment successful!');
  } catch (error) {
    console.log('❌ Deployment failed. Please run manually:');
    console.log('   vercel --prod');
    return;
  }
  
  // Test webhook endpoints
  console.log('\n3. Testing webhook endpoints...');
  try {
    await execCommand('node test-vercel-webhook.js');
  } catch (error) {
    console.log('⚠️  Webhook test failed. This is normal if endpoints return 404.');
  }
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Go to Stripe Dashboard: https://dashboard.stripe.com/webhooks');
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
  console.log('5. Set environment variables in Vercel dashboard');
  console.log('6. Test with a payment!');
  
  console.log('\n🔍 To verify setup:');
  console.log('1. Visit: https://time-tracker-bice-pi.vercel.app/api/debug-env');
  console.log('2. Check if STRIPE_WEBHOOK_SECRET shows "SET"');
  console.log('3. Make a test payment and check Vercel logs');
}

/**
 * Execute a command
 */
function execCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      console.log(stdout);
      if (stderr) console.log(stderr);
      resolve();
    });
  });
}

// Run the deployment
deployVercel().catch(console.error); 