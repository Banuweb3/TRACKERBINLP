import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Proxy route to fetch calling dashboard data
router.get('/dashboard-data', async (req, res) => {
  const startTime = Date.now();
  console.log('========== CALLING API REQUEST START ==========');
  console.log('Request Time:', new Date().toISOString());
  
  try {
    // Try external API first, fallback to mock data if ngrok is offline
    try {
      console.log('Attempting to connect to ngrok API...');
      console.log('URL:', 'https://commodiously-appositional-yung.ngrok-free.dev/api.php/');
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('TIMEOUT: Aborting request after 15 seconds');
        controller.abort();
      }, 15000); // Increased to 15 seconds
      
      console.log('Making fetch request...');
      const response = await fetch('https://commodiously-appositional-yung.ngrok-free.dev/api.php/', {
        method: 'GET',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'ngrok-skip-browser-warning': 'true',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      
      console.log('Response received in', responseTime, 'ms');
      console.log('Status:', response.status, response.statusText);
      console.log('Headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const responseText = await response.text();
        console.log('Raw response length:', responseText.length);
        console.log('First 300 chars:', responseText.substring(0, 300));
        
        try {
          const data = JSON.parse(responseText);
          console.log('JSON parsed successfully!');
          console.log('Data type:', typeof data);
          console.log('Is array:', Array.isArray(data));
          console.log('Length:', Array.isArray(data) ? data.length : 'N/A');
          
          if (Array.isArray(data) && data.length > 0) {
            console.log('Sample record keys:', Object.keys(data[0]));
            console.log('First record phone:', data[0].phone_number);
            console.log('RETURNING REAL DATA FROM NGROK');
            return res.json(data);
          } else {
            console.log('Empty array or invalid data structure');
          }
        } catch (parseError) {
          console.error('JSON parse error:', parseError.message);
          console.log('Response was not valid JSON, first 500 chars:');
          console.log(responseText.substring(0, 500));
        }
      } else {
        const errorText = await response.text();
        console.error(`HTTP Error ${response.status}: ${response.statusText}`);
        console.error('Error response:', errorText.substring(0, 300));
      }
    } catch (ngrokError) {
      const errorTime = Date.now() - startTime;
      console.error('NGROK REQUEST FAILED after', errorTime, 'ms');
      console.error('Error name:', ngrokError.name);
      console.error('Error message:', ngrokError.message);
      console.error('Error code:', ngrokError.code);
      console.error('Full error:', ngrokError);
      
      if (ngrokError.name === 'AbortError') {
        console.error('Request was aborted due to timeout');
      } else if (ngrokError.code === 'ENOTFOUND') {
        console.error('DNS resolution failed - ngrok domain not found');
      } else if (ngrokError.code === 'ECONNREFUSED') {
        console.error('Connection refused - ngrok server not responding');
      } else if (ngrokError.code === 'ETIMEDOUT') {
        console.error('Connection timed out');
      }
    }
    
    // Fallback to database data when ngrok is offline
    console.log('========== FALLING BACK TO DATABASE DATA ==========');
    console.log('Fetching call records from database...');
    
    try {
      // Query call records from database
      const [callRecords] = await pool.execute(`
        SELECT 
          id,
          phone_number,
          call_type,
          status,
          dialer_status,
          agent_id,
          disposition,
          call_end_date,
          process_name,
          call_timer_json,
          call_duration,
          created_at
        FROM call_records 
        WHERE call_end_date >= DATE_SUB(NOW(), INTERVAL 1 DAY)
        ORDER BY call_end_date DESC 
        LIMIT 50
      `);
      
      console.log(`Found ${callRecords.length} call records in database`);
      
      // Format the data to match expected structure
      const formattedData = callRecords.map(record => ({
        ...record,
        call_timer_json: typeof record.call_timer_json === 'string' 
          ? record.call_timer_json 
          : JSON.stringify(record.call_timer_json || { bill_sec: record.call_duration || "0" })
      }));
      
      res.json(formattedData);
      
    } catch (dbError) {
      console.error('Database query failed:', dbError);
      console.log('Using fallback mock data...');
      
      // If database fails, use mock data as last resort
      const mockData = [
        {
          id: 1,
          phone_number: "+1234567890",
          call_type: "INCOMING",
          status: "CONNECTED",
          dialer_status: "ANSWERED",
          agent_id: "john_smith",
          disposition: "SALE",
          call_end_date: new Date().toISOString(),
          process_name: "Sales Campaign",
          call_timer_json: JSON.stringify({ bill_sec: "323" })
        },
        {
          id: 2,
          phone_number: "+1987654321",
          call_type: "OUTGOING",
          status: "NO ANSWER",
          dialer_status: "MISSED",
          agent_id: "sarah_johnson",
          disposition: "CANCEL",
          call_end_date: new Date(Date.now() - 300000).toISOString(),
          process_name: "Lead Follow-up",
          call_timer_json: JSON.stringify({ bill_sec: "0" })
        }
      ];
      
      res.json(mockData);
    }
    
  } catch (error) {
    console.error('Error in calling dashboard route:', error);
    res.status(500).json({ 
      error: 'Failed to fetch calling dashboard data',
      message: error.message 
    });
  }
});

export default router;
