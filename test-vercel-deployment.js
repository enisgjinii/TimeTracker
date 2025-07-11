const https = require('https');

/**
 * Test Vercel deployment endpoints
 */
async function testVercelDeployment() {
  console.log('🧪 Testing Vercel Deployment');
  console.log('============================');
  
  // Your actual deployment URLs
  const deploymentUrls = [
    'https://time-tracker-poy8oqfwe-enisenisnisis-projects.vercel.app',
    'https://time-tracker-8c1tkkuly-enisenisnisis-projects.vercel.app',
    'https://time-tracker-1dkz6zuek-enisenisnisis-projects.vercel.app'
  ];
  
  console.log('\n📋 Testing deployment URLs:');
  
  for (const baseUrl of deploymentUrls) {
    console.log(`\n🔍 Testing: ${baseUrl}`);
    
    // Test 1: Simple test endpoint
    try {
      const result1 = await testEndpoint(`${baseUrl}/api/simple-test`);
      console.log(`   ✅ /api/simple-test: ${result1.status}`);
    } catch (error) {
      console.log(`   ❌ /api/simple-test: ${error.message}`);
    }
    
    // Test 2: Vercel test endpoint
    try {
      const result2 = await testEndpoint(`${baseUrl}/api/vercel-test`);
      console.log(`   ✅ /api/vercel-test: ${result2.status}`);
      if (result2.status === 200) {
        console.log(`   📊 Response: ${JSON.stringify(result2.data, null, 2)}`);
      }
    } catch (error) {
      console.log(`   ❌ /api/vercel-test: ${error.message}`);
    }
    
    // Test 3: Debug env endpoint
    try {
      const result3 = await testEndpoint(`${baseUrl}/api/debug-env`);
      console.log(`   ✅ /api/debug-env: ${result3.status}`);
    } catch (error) {
      console.log(`   ❌ /api/debug-env: ${error.message}`);
    }
  }
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Find the working deployment URL from above');
  console.log('2. Update your Stripe webhook URL to use the working URL');
  console.log('3. Test a payment to verify webhooks work');
  
  console.log('\n📋 Correct webhook URL format:');
  console.log('   https://[working-deployment-url]/api/stripe-webhook');
  
  console.log('\n🔧 To deploy a fresh version:');
  console.log('   vercel --prod');
}

/**
 * Test a single endpoint
 */
function testEndpoint(url) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: new URL(url).hostname,
      port: 443,
      path: new URL(url).pathname,
      method: 'GET',
      headers: {
        'User-Agent': 'Vercel-Test/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data.substring(0, 100) + '...' });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => reject(new Error('Timeout')));
    req.end();
  });
}

// Run the test
testVercelDeployment().catch(console.error); 