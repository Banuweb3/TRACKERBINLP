// Minimal test server to verify DigitalOcean deployment
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  
  if (req.url === '/health') {
    res.end(JSON.stringify({ status: 'OK', message: 'Test server running' }));
  } else if (req.url === '/api/auth/login') {
    res.end(JSON.stringify({ error: 'Test server - login not implemented yet' }));
  } else {
    res.end(JSON.stringify({ message: 'Test server active', url: req.url }));
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});
