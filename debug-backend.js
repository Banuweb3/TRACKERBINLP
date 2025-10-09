// Debug script to test backend endpoints
const http = require('http');

console.log('🔍 Testing backend endpoints...');

// Test health endpoint
const healthReq = http.request({
  hostname: 'localhost',
  port: 3001,
  path: '/health',
  method: 'GET'
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('✅ Health endpoint (port 3001):', res.statusCode, data);
  });
});
healthReq.on('error', err => console.log('❌ Health error:', err.message));
healthReq.end();

// Test login endpoint
const loginData = JSON.stringify({
  email: 'test@example.com',
  password: 'Test123'
});

const loginReq = http.request({
  hostname: 'localhost',
  port: 3001,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('✅ Login endpoint (port 3001):', res.statusCode, data);
  });
});
loginReq.on('error', err => console.log('❌ Login error:', err.message));
loginReq.write(loginData);
loginReq.end();

// Test what's on port 80 (frontend)
const frontendReq = http.request({
  hostname: 'localhost',
  port: 80,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('❌ Frontend port 80 response:', res.statusCode, data.substring(0, 100) + '...');
  });
});
frontendReq.on('error', err => console.log('❌ Frontend port error:', err.message));
frontendReq.write('{"email":"test","password":"test"}');
frontendReq.end();
