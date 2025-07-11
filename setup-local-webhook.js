const fs = require('fs');
const path = require('path');

/**
 * Setup local webhook testing
 */
async function setupLocalWebhook() {
  console.log('🔧 Setting up local webhook testing...');
  console.log('\n📋 Current Status:');
  console.log('   ✅ Local server running on http://localhost:3001');
  console.log('   ✅ Webhook secret configured: whsec_BjkX1o9EJJRbXenNJZHquTu79T1ljeng');
  console.log('   ❌ Stripe webhook URL probably set to Vercel, not localhost');
  
  console.log('\n🎯 Quick Fix Options:');
  
  console.log('\nOption 1: Test Local Webhook (Recommended)');
  console.log('1. Go to Stripe Dashboard: https://dashboard.stripe.com/webhooks');
  console.log('2. Find your webhook endpoint');
  console.log('3. Click "Edit" and change the URL to:');
  console.log('   http://localhost:3001/api/stripe-webhook');
  console.log('4. Save the changes');
  console.log('5. Test a payment - webhooks should now work automatically!');
  
  console.log('\nOption 2: Use Manual Webhook Test (Quick Test)');
  console.log('1. Complete a payment');
  console.log('2. Copy the session ID from the URL');
  console.log('3. Run this command:');
  console.log('   node trigger-webhook.js <sessionId> <firebaseUid>');
  console.log('4. This will manually trigger the webhook');
  
  console.log('\nOption 3: Set Up Vercel Webhook (Production)');
  console.log('1. Go to Vercel Dashboard: https://vercel.com/dashboard');
  console.log('2. Select your project: time-tracker-bice-pi');
  console.log('3. Go to Settings → Environment Variables');
  console.log('4. Add: STRIPE_WEBHOOK_SECRET=whsec_BjkX1o9EJJRbXenNJZHquTu79T1ljeng');
  console.log('5. Deploy: vercel --prod');
  console.log('6. Test on Vercel deployment');
  
  console.log('\n🧪 To test right now:');
  console.log('1. Go to http://localhost:3001');
  console.log('2. Complete a test payment');
  console.log('3. Check if user status updates automatically');
  console.log('4. If not, use Option 1 or 2 above');
  
  console.log('\n📊 Expected Behavior:');
  console.log('   ✅ Payment completes successfully');
  console.log('   ✅ Webhook event received by local server');
  console.log('   ✅ Firebase user subscription updated');
  console.log('   ✅ User status changes to "active"');
}

// Run the setup
setupLocalWebhook().catch(console.error); 