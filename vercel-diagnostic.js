const fs = require('fs');
const path = require('path');

/**
 * Comprehensive Vercel diagnostic script
 */
async function vercelDiagnostic() {
  console.log('🔍 Vercel Deployment Diagnostic');
  console.log('================================');
  
  // Check 1: Package.json
  console.log('\n1. Checking package.json...');
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    console.log('✅ package.json exists');
    console.log('   Dependencies:', Object.keys(packageJson.dependencies || {}).length);
    console.log('   Scripts:', Object.keys(packageJson.scripts || {}));
  } catch (error) {
    console.log('❌ package.json error:', error.message);
  }
  
  // Check 2: Vercel.json
  console.log('\n2. Checking vercel.json...');
  try {
    const vercelJson = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
    console.log('✅ vercel.json exists');
    console.log('   Version:', vercelJson.version);
    console.log('   Routes:', vercelJson.routes?.length || 0);
    console.log('   Builds:', vercelJson.builds?.length || 0);
  } catch (error) {
    console.log('❌ vercel.json error:', error.message);
  }
  
  // Check 3: API files
  console.log('\n3. Checking API files...');
  const apiDir = path.join(__dirname, 'api');
  const apiFiles = fs.readdirSync(apiDir).filter(f => f.endsWith('.js'));
  console.log(`✅ Found ${apiFiles.length} API files`);
  console.log('   Files:', apiFiles.join(', '));
  
  // Check 4: Environment variables
  console.log('\n4. Checking environment variables...');
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = envContent.split('\n').filter(line => line.includes('='));
    console.log(`✅ .env file exists with ${envVars.length} variables`);
    
    // Check critical vars
    const criticalVars = [
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'FIREBASE_PROJECT_ID',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_PRIVATE_KEY'
    ];
    
    criticalVars.forEach(varName => {
      const hasVar = envContent.includes(varName);
      console.log(`   ${varName}: ${hasVar ? 'SET' : 'NOT SET'}`);
    });
  } else {
    console.log('❌ .env file not found');
  }
  
  // Check 5: Node modules
  console.log('\n5. Checking node_modules...');
  const nodeModulesPath = path.join(__dirname, 'node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    console.log('✅ node_modules exists');
  } else {
    console.log('❌ node_modules not found - run npm install');
  }
  
  console.log('\n🎯 Solutions for 404 errors:');
  console.log('\nOption 1: Redeploy with fresh build');
  console.log('1. Delete .vercel folder if it exists');
  console.log('2. Run: vercel --prod');
  console.log('3. Make sure to set environment variables in Vercel dashboard');
  
  console.log('\nOption 2: Check Vercel environment variables');
  console.log('1. Go to Vercel Dashboard > Your Project > Settings > Environment Variables');
  console.log('2. Add these variables:');
  console.log('   STRIPE_SECRET_KEY=sk_test_...');
  console.log('   STRIPE_WEBHOOK_SECRET=whsec_BjkX1o9EJJRbXenNJZHquTu79T1ljeng');
  console.log('   FIREBASE_PROJECT_ID=timetracker-7da41');
  console.log('   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@timetracker-7da41.iam.gserviceaccount.com');
  console.log('   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"');
  
  console.log('\nOption 3: Test locally first');
  console.log('1. Run: npm start');
  console.log('2. Test: http://localhost:3001/api/simple-test');
  console.log('3. If local works, the issue is with Vercel deployment');
  
  console.log('\nOption 4: Check Vercel logs');
  console.log('1. Go to Vercel Dashboard > Your Project > Functions');
  console.log('2. Look for build errors or runtime errors');
  console.log('3. Check if the function is being invoked');
  
  console.log('\n🔧 Quick Fix Commands:');
  console.log('npm install');
  console.log('vercel --prod');
  console.log('vercel logs');
}

// Run diagnostic
vercelDiagnostic().catch(console.error); 