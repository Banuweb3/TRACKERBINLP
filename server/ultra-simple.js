const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

console.log('🚀 Starting ULTRA SIMPLE backend...');

// CORS configuration
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('🏥 Health check requested');
  res.setHeader('Content-Type', 'application/json');
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'ULTRA SIMPLE Backend is running'
  });
});

// Register endpoint
app.post('/api/auth/register', (req, res) => {
  console.log('📝 Register request received');
  res.setHeader('Content-Type', 'application/json');
  
  const response = {
    message: 'User registered successfully',
    user: {
      id: 123,
      username: 'testuser',
      email: 'test@example.com'
    },
    success: true
  };
  
  console.log('📤 Sending register response');
  res.status(201).json(response);
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  console.log('🔐 Login request received');
  res.setHeader('Content-Type', 'application/json');
  
  const response = {
    message: 'Login successful',
    user: {
      id: 123,
      username: 'testuser',
      email: 'test@example.com'
    },
    success: true
  };
  
  console.log('📤 Sending login response');
  res.json(response);
});

// Catch all API routes
app.use('/api/*', (req, res) => {
  console.log('🔍 API route:', req.path);
  res.setHeader('Content-Type', 'application/json');
  res.json({ 
    message: 'API endpoint working',
    path: req.path
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🎉 ULTRA SIMPLE BACKEND STARTED SUCCESSFULLY!');
  console.log(`📡 Server running on port ${PORT}`);
  console.log('✅ Ready to serve JSON responses');
});

console.log('📋 Backend script loaded successfully');
