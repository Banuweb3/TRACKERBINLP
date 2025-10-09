/**
 * Test script to debug the calling dashboard API 500 error
 */

console.log('🔍 Testing Calling Dashboard API...');

// Test 1: Check if ngrok URL is accessible
async function testNgrokAPI() {
  console.log('\n📡 Test 1: Testing ngrok API directly...');
  
  try {
    const response = await fetch('https://commodiously-appositional-yung.ngrok-free.dev/api.php/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'BPO-Analytics-Server/1.0'
      }
    });

    console.log('Response Status:', response.status);
    console.log('Response OK:', response.ok);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
      console.log('✅ ngrok API Success - Data type:', typeof data);
      console.log('✅ Data length:', Array.isArray(data) ? data.length : 'Not an array');
      console.log('✅ Sample data:', JSON.stringify(data).substring(0, 200) + '...');
      return true;
    } else {
      console.log('❌ ngrok API Failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('Error response:', errorText);
      return false;
    }
  } catch (error) {
    console.error('❌ ngrok API Error:', error.message);
    return false;
  }
}

// Test 2: Check local backend API
async function testLocalAPI() {
  console.log('\n🏠 Test 2: Testing local backend API...');
  
  try {
    const response = await fetch('http://localhost:3001/api/calling/dashboard-data', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Local API Status:', response.status);
    console.log('Local API OK:', response.ok);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Local API Success - Data type:', typeof data);
      console.log('✅ Data length:', Array.isArray(data) ? data.length : 'Not an array');
      return true;
    } else {
      console.log('❌ Local API Failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('Error response:', errorText);
      return false;
    }
  } catch (error) {
    console.error('❌ Local API Error:', error.message);
    console.log('💡 Hint: Make sure backend server is running on port 3001');
    return false;
  }
}

// Test 3: Check if server is running
async function checkServerHealth() {
  console.log('\n❤️ Test 3: Checking server health...');
  
  try {
    const response = await fetch('http://localhost:3001/health', {
      method: 'GET'
    });

    if (response.ok) {
      console.log('✅ Server is running and healthy');
      return true;
    } else {
      console.log('⚠️ Server responded but not healthy:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Server not reachable:', error.message);
    console.log('💡 Start server with: cd server && npm start');
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting comprehensive API tests...\n');
  
  const ngrokOK = await testNgrokAPI();
  const serverOK = await checkServerHealth();
  const localOK = await testLocalAPI();
  
  console.log('\n📊 Test Results Summary:');
  console.log('ngrok API:', ngrokOK ? '✅ Working' : '❌ Failed');
  console.log('Server Health:', serverOK ? '✅ Working' : '❌ Failed');
  console.log('Local API:', localOK ? '✅ Working' : '❌ Failed');
  
  if (!ngrokOK) {
    console.log('\n🔧 ngrok Issues:');
    console.log('- Check if ngrok tunnel is still active');
    console.log('- Verify the ngrok URL is correct');
    console.log('- Try regenerating the ngrok tunnel');
  }
  
  if (!serverOK) {
    console.log('\n🔧 Server Issues:');
    console.log('- Start backend: cd server && npm start');
    console.log('- Check if port 3001 is available');
    console.log('- Verify environment variables');
  }
  
  if (!localOK && serverOK) {
    console.log('\n🔧 API Route Issues:');
    console.log('- Check server logs for errors');
    console.log('- Verify calling route is registered');
    console.log('- Check for middleware conflicts');
  }
}

// Run the tests
runAllTests().catch(console.error);
