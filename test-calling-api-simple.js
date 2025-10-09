/**
 * Simple test to verify calling dashboard API response format
 */

async function testCallingAPI() {
  try {
    console.log('🔍 Testing Calling Dashboard API...');
    
    const response = await fetch('http://localhost:3001/api/calling/dashboard-data');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response Status:', response.status);
      console.log('📊 Data Type:', typeof data);
      console.log('📊 Is Array:', Array.isArray(data));
      console.log('📊 Data Length:', data?.length);
      
      if (Array.isArray(data) && data.length > 0) {
        console.log('📋 First Record Sample:');
        console.log('- ID:', data[0].id);
        console.log('- Phone:', data[0].phone_number);
        console.log('- Call Type:', data[0].call_type);
        console.log('- Status:', data[0].status);
        console.log('- Agent ID:', data[0].agent_id);
        console.log('- Process Name:', data[0].process_name);
        
        // Test data structure expected by frontend
        const incomingCalls = data.filter(call => call.call_type === 'INCOMING').length;
        const outgoingCalls = data.filter(call => call.call_type === 'OUTGOING').length;
        const connectedCalls = data.filter(call => call.status === 'CONNECTED' || call.status === 'ANSWERED').length;
        const uniqueAgents = [...new Set(data.map(call => call.agent_id))];
        
        console.log('📈 Calculated Stats:');
        console.log('- Total Calls:', data.length);
        console.log('- Incoming:', incomingCalls);
        console.log('- Outgoing:', outgoingCalls);
        console.log('- Connected:', connectedCalls);
        console.log('- Unique Agents:', uniqueAgents.length);
        
      } else {
        console.log('⚠️ Empty or invalid data structure');
      }
    } else {
      console.error('❌ API Error:', response.status, response.statusText);
    }
    
  } catch (error) {
    console.error('❌ Request Failed:', error.message);
  }
}

// Run the test
testCallingAPI();
