// Test script to check API endpoint
import fetch from 'node-fetch';

async function testAPI() {
  try {
    console.log('🔍 Testing API endpoint...');

    // Test health first
    const healthResponse = await fetch('http://localhost:3001/health');
    console.log('Health status:', healthResponse.status);

    // Test API keys endpoint
    const keysResponse = await fetch('http://localhost:3001/api/analysis/test-gemini');
    const keysData = await keysResponse.json();
    console.log('API Keys test result:', keysData);

  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

testAPI();
