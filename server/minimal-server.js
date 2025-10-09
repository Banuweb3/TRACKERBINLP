import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://trackerbi-vvrvr.ondigitalocean.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('🏥 Health check requested');
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: 'Backend is running successfully'
  });
});

// Register endpoint
app.post('/api/auth/register', (req, res) => {
  console.log('📝 Register request received:', req.body);
  
  // Set JSON content type explicitly
  res.setHeader('Content-Type', 'application/json');
  
  const { username, email, password, firstName, lastName } = req.body;
  
  // Basic validation
  if (!username || !email || !password) {
    console.log('❌ Validation failed - missing fields');
    return res.status(400).json({
      error: 'Missing required fields',
      details: ['Username, email, and password are required']
    });
  }
  
  // Success response
  console.log('✅ Registration successful for:', email);
  const response = {
    message: 'User registered successfully',
    user: {
      id: Date.now(),
      username,
      email,
      firstName,
      lastName
    },
    success: true
  };
  
  console.log('📤 Sending response:', response);
  res.status(201).json(response);
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  console.log('🔐 Login request received:', { email: req.body.email });
  
  // Set JSON content type explicitly
  res.setHeader('Content-Type', 'application/json');
  
  const { email, password } = req.body;
  
  // Basic validation
  if (!email || !password) {
    console.log('❌ Login validation failed - missing fields');
    return res.status(400).json({
      error: 'Missing required fields',
      details: ['Email and password are required']
    });
  }
  
  // Success response
  console.log('✅ Login successful for:', email);
  const response = {
    message: 'Login successful',
    user: {
      id: 1,
      username: 'demo_user',
      email: email,
      firstName: 'Demo',
      lastName: 'User'
    },
    success: true
  };
  
  console.log('📤 Sending login response:', response);
  res.json(response);
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  console.log('👋 Logout request received');
  res.json({ 
    message: 'Logout successful', 
    success: true 
  });
});

// Profile endpoint
app.get('/api/profile', (req, res) => {
  console.log('👤 Profile request received');
  res.json({
    user: {
      id: 1,
      username: 'demo_user',
      email: 'demo@example.com',
      firstName: 'Demo',
      lastName: 'User'
    },
    stats: {
      totalAnalyses: 0
    }
  });
});

// Analysis sessions endpoint
app.get('/api/analysis/sessions', (req, res) => {
  console.log('📊 Analysis sessions request received');
  res.json({
    success: true,
    sessions: [],
    message: 'No sessions found'
  });
});

// Catch all API routes
app.use('/api/*', (req, res) => {
  console.log('🔍 API route not found:', req.path);
  res.status(404).json({ 
    error: 'API route not found',
    path: req.path,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Global error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 MINIMAL BACKEND STARTED SUCCESSFULLY');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('✅ All API endpoints are ready');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
