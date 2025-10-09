// Simple server test
import http from 'http';

const testServer = () => {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/analysis/test-gemini',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer test-token'
    }
  };

  const req = http.request(options, (res) => {
    console.log('Status:', res.statusCode);
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        console.log('Response:', parsed);
      } catch (e) {
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (e) => {
    console.error('Request failed:', e.message);
  });

  req.end();
};

testServer();
