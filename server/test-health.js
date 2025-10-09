import fetch from 'node-fetch';

const testHealth = async () => {
  try {
    console.log('🔍 Testing backend health...');
    
    // Test local health endpoint
    const response = await fetch('http://localhost:3001/health');
    const data = await response.json();
    
    console.log('✅ Health check response:', data);
    
    if (response.ok) {
      console.log('🎉 Backend is running correctly!');
    } else {
      console.log('❌ Backend health check failed');
    }
    
  } catch (error) {
    console.error('❌ Failed to connect to backend:', error.message);
    console.log('💡 Make sure the backend server is running on port 3001');
  }
};

testHealth();
