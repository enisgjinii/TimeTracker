const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Fix Vercel deployment issues
 */
async function fixVercelDeployment() {
  console.log('🔧 Fixing Vercel Deployment Issues');
  console.log('==================================');
  
  console.log('\n📋 Current Issue:');
  console.log('   ❌ All API endpoints returning 404');
  console.log('   ❌ Webhook not receiving events');
  console.log('   ❌ Environment variables may not be set in Vercel');
  
  console.log('\n🎯 Step-by-Step Fix:');
  
  console.log('\nStep 1: Clean Vercel cache');
  try {
    // Check if .vercel folder exists
    const vercelPath = path.join(__dirname, '.vercel');
    if (fs.existsSync(vercelPath)) {
      console.log('   Found .vercel folder - this might be causing issues');
      console.log('   Consider deleting it for a fresh deployment');
    }
  } catch (error) {
    console.log('   No .vercel folder found');
  }
  
  console.log('\nStep 2: Set Vercel environment variables');
  console.log('   Go to: https://vercel.com/dashboard');
  console.log('   Select your project: time-tracker-bice-pi');
  console.log('   Go to: Settings → Environment Variables');
  console.log('   Add these variables:');
  console.log('');
  console.log('   STRIPE_SECRET_KEY=sk_test_51RjlZuRjVTeY4vTLVexy4roi9JPW6YEixnsqeKr7jxhMvnxXkwsoVUyFrI3mSJRKXRZdLFlofVg9LoQZsc3uEFNH00gq5jfci3');
  console.log('   STRIPE_PUBLISHABLE_KEY=pk_test_51RjlZuRjVTeY4vTLvc4HDiRgdt0ay9LVir7S4vFQhkcJZKHozU0pUGaXcJR6bbg4LtEEjtlx8u60Y7VnnhjIZHoC00YZlQhf6l');
  console.log('   STRIPE_WEBHOOK_SECRET=whsec_BjkX1o9EJJRbXenNJZHquTu79T1ljeng');
  console.log('   FIREBASE_PROJECT_ID=timetracker-7da41');
  console.log('   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@timetracker-7da41.iam.gserviceaccount.com');
  console.log('   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYOUR_ACTUAL_PRIVATE_KEY_HERE\\n-----END PRIVATE KEY-----\\n"');
  console.log('   NODE_ENV=production');
  
  console.log('\nStep 3: Deploy to Vercel');
  console.log('   Run: vercel --prod');
  console.log('   This will create a fresh deployment');
  
  console.log('\nStep 4: Test the deployment');
  console.log('   After deployment, test these URLs:');
  console.log('   - https://time-tracker-bice-pi.vercel.app/api/simple-test');
  console.log('   - https://time-tracker-bice-pi.vercel.app/api/debug-env');
  console.log('   - https://time-tracker-bice-pi.vercel.app/api/test-firebase');
  
  console.log('\nStep 5: Update Stripe webhook URL');
  console.log('   Go to: https://dashboard.stripe.com/webhooks');
  console.log('   Update webhook URL to: https://time-tracker-bice-pi.vercel.app/api/stripe-webhook');
  console.log('   Make sure these events are enabled:');
  console.log('   - checkout.session.completed');
  console.log('   - customer.subscription.created');
  console.log('   - customer.subscription.updated');
  console.log('   - customer.subscription.deleted');
  console.log('   - invoice.payment_succeeded');
  console.log('   - invoice.payment_failed');
  
  console.log('\n🔧 Quick Commands:');
  console.log('   npm install');
  console.log('   vercel --prod');
  console.log('   vercel logs');
  
  console.log('\n📊 Expected Results:');
  console.log('   ✅ API endpoints return 200 instead of 404');
  console.log('   ✅ Webhook events are received and processed');
  console.log('   ✅ Firebase is updated automatically');
  console.log('   ✅ User subscription status changes to "active"');
  
  console.log('\n🚨 If still getting 404s:');
  console.log('   1. Check Vercel logs for build errors');
  console.log('   2. Make sure all environment variables are set');
  console.log('   3. Try deleting and recreating the Vercel project');
  console.log('   4. Check if the API routes are being built correctly');
}

// Run the fix
fixVercelDeployment().catch(console.error); 