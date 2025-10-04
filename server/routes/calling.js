import express from 'express';

const router = express.Router();

// Proxy route to fetch calling dashboard data
router.get('/dashboard-data', async (req, res) => {
  try {
    console.log('📞 Fetching calling dashboard data from external API...');
    
    // Try external API first, fallback to mock data if ngrok is offline
    try {
      const response = await fetch('https://commodiously-appositional-yung.ngrok-free.dev/api.php/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'User-Agent': 'BPO-Analytics-Server/1.0'
        },
        timeout: 5000 // 5 second timeout
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Successfully fetched from ngrok:', Array.isArray(data) ? data.length : 0, 'records');
        return res.json(data);
      }
    } catch (ngrokError) {
      console.warn('⚠️ ngrok API unavailable, using mock data:', ngrokError.message);
    }
    
    // Fallback to mock data when ngrok is offline
    console.log('🔄 Using mock calling data (ngrok offline)');
    const mockData = [
      {
        id: 1,
        caller_number: "+1234567890",
        call_type: "incoming",
        call_status: "connected",
        agent_name: "John Smith",
        call_duration: "00:05:23",
        timestamp: new Date().toISOString(),
        lead_score: 85
      },
      {
        id: 2,
        caller_number: "+1987654321",
        call_type: "outgoing",
        call_status: "missed",
        agent_name: "Sarah Johnson",
        call_duration: "00:00:00",
        timestamp: new Date(Date.now() - 300000).toISOString(),
        lead_score: 0
      },
      {
        id: 3,
        caller_number: "+1555123456",
        call_type: "incoming",
        call_status: "connected",
        agent_name: "Mike Wilson",
        call_duration: "00:08:45",
        timestamp: new Date(Date.now() - 600000).toISOString(),
        lead_score: 92
      },
      {
        id: 4,
        caller_number: "+1777888999",
        call_type: "outgoing",
        call_status: "connected",
        agent_name: "Emily Davis",
        call_duration: "00:03:12",
        timestamp: new Date(Date.now() - 900000).toISOString(),
        lead_score: 67
      },
      {
        id: 5,
        caller_number: "+1444555666",
        call_type: "incoming",
        call_status: "abandoned",
        agent_name: "David Brown",
        call_duration: "00:00:15",
        timestamp: new Date(Date.now() - 1200000).toISOString(),
        lead_score: 0
      }
    ];
    
    res.json(mockData);
    
  } catch (error) {
    console.error('❌ Error in calling dashboard route:', error);
    res.status(500).json({ 
      error: 'Failed to fetch calling dashboard data',
      message: error.message 
    });
  }
});

export default router;
