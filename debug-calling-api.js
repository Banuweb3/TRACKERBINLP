/**
 * Debug script to test calling API and see logs
 */

import fetch from 'node-fetch';

async function debugCallingAPI() {
  try {
    console.log('🔍 Testing Calling API endpoint...');
    console.log('⏰ Time:', new Date().toISOString());
    
    const response = await fetch('http://localhost:3001/api/calling/dashboard-data', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Response Status:', response.status);
    console.log('📡 Response OK:', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Response received successfully');
      console.log('📊 Data Type:', typeof data);
      console.log('📊 Is Array:', Array.isArray(data));
      console.log('📊 Data Length:', data?.length);
      
      if (Array.isArray(data) && data.length > 0) {
        console.log('📋 First Record:');
        console.log('- ID:', data[0].id);
        console.log('- Phone:', data[0].phone_number);
        console.log('- Call Type:', data[0].call_type);
        console.log('- Status:', data[0].status);
        console.log('- Agent ID:', data[0].agent_id);
        
        // Check if this looks like mock data
        const isMockData = data.some(record => 
          record.phone_number === "+1234567890" || 
          record.agent_id === "john_smith"
        );
        
        console.log('🔍 Is Mock Data:', isMockData ? 'YES' : 'NO');
        
        if (isMockData) {
          console.log('⚠️ MOCK DATA DETECTED - Real API not working');
        } else {
          console.log('✅ REAL DATA DETECTED - API working correctly');
        }
      }
    } else {
      console.error('❌ API Error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('❌ Error Details:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Request Failed:', error.message);
  }
}

// Run the test
debugCallingAPI();
