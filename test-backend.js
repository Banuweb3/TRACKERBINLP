/**
 * Backend Connection Test Script
 * Run this to check if your backend server is working
 */

const testBackend = async () => {
  const baseUrl = 'http://localhost:3001';
  
  console.log('🔍 Testing backend server connection...\n');
  
  // Test 1: Health check
  try {
    console.log('1️⃣ Testing health endpoint...');
    const healthResponse = await fetch(`${baseUrl}/health`);
    const healthData = await healthResponse.text();
    console.log('✅ Health check response:', healthData);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    console.log('💡 Make sure your backend server is running with: cd server && npm start');
    return;
  }
  
  // Test 2: Test login endpoint with invalid data
  try {
    console.log('\n2️⃣ Testing login endpoint...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'wrongpassword'
      }),
    });
    
    const loginText = await loginResponse.text();
    console.log('📡 Login response status:', loginResponse.status);
    console.log('📡 Login response body:', loginText);
    
    if (loginText) {
      try {
        const loginData = JSON.parse(loginText);
        console.log('✅ Login endpoint returns valid JSON');
      } catch (parseError) {
        console.log('❌ Login endpoint returns invalid JSON:', parseError.message);
      }
    } else {
      console.log('❌ Login endpoint returns empty response');
    }
  } catch (error) {
    console.log('❌ Login test failed:', error.message);
  }
  
  // Test 3: Test Meta API health
  try {
    console.log('\n3️⃣ Testing Meta API health...');
    const metaResponse = await fetch(`${baseUrl}/api/meta/health`);
    const metaText = await metaResponse.text();
    console.log('📡 Meta API response status:', metaResponse.status);
    console.log('📡 Meta API response:', metaText);
  } catch (error) {
    console.log('❌ Meta API test failed:', error.message);
  }
  
  console.log('\n🏁 Backend test completed!');
};

// Run the test
testBackend().catch(console.error);
