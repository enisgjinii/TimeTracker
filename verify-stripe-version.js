const fs = require('fs');
const path = require('path');

/**
 * Verify Stripe API version across all files
 */
async function verifyStripeVersion() {
  console.log('🔍 Verifying Stripe API version across all files...');
  console.log('📋 Target version: 2025-06-30.basil');
  
  const apiDir = path.join(__dirname, 'api');
  const files = fs.readdirSync(apiDir);
  
  let totalFiles = 0;
  let updatedFiles = 0;
  let filesWithStripe = 0;
  
  console.log('\n📁 Checking API files:');
  
  for (const file of files) {
    if (file.endsWith('.js')) {
      totalFiles++;
      const filePath = path.join(apiDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check if file uses Stripe
      if (content.includes('require(\'stripe\')') || content.includes('new Stripe')) {
        filesWithStripe++;
        
        // Check for API version
        if (content.includes('apiVersion')) {
          if (content.includes('2025-06-30.basil')) {
            console.log(`   ✅ ${file} - Using correct API version`);
            updatedFiles++;
          } else if (content.includes('2022-11-15')) {
            console.log(`   ❌ ${file} - Still using old API version`);
          } else {
            console.log(`   ⚠️  ${file} - API version not found`);
          }
        } else {
          console.log(`   ⚠️  ${file} - No explicit API version (using default)`);
        }
      }
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`   Total files: ${totalFiles}`);
  console.log(`   Files with Stripe: ${filesWithStripe}`);
  console.log(`   Files with correct API version: ${updatedFiles}`);
  
  if (updatedFiles === filesWithStripe) {
    console.log('\n✅ All Stripe files updated successfully!');
  } else {
    console.log('\n❌ Some files still need updating.');
  }
  
  console.log('\n🔍 Files that use Stripe:');
  console.log('   - verify-subscription.js');
  console.log('   - test-webhook.js');
  console.log('   - stripe-webhook.js');
  console.log('   - manual-update.js');
  console.log('   - debug-session.js');
  console.log('   - create-portal-session.js');
  console.log('   - cancel-subscription.js');
  console.log('   - create-checkout-session.js');
  console.log('   - create-payment-intent.js');
  
  console.log('\n📋 Next steps:');
  console.log('1. Test your application to ensure everything works');
  console.log('2. Deploy to Vercel: vercel --prod');
  console.log('3. Test webhook functionality');
}

// Run the verification
verifyStripeVersion().catch(console.error); 