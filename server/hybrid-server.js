// Hybrid server - combines simple approach with real API functionality
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// Health check with database connectivity test
app.get('/health', async (req, res) => {
  const healthStatus = {
    status: 'OK',
    message: 'Hybrid server running',
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT
    },
    database: {
      configured: !!process.env.DB_HOST,
      host: process.env.DB_HOST || 'not set',
      port: process.env.DB_PORT || 'not set',
      user: process.env.DB_USER || 'not set',
      database: process.env.DB_NAME || 'not set',
      ssl: process.env.DB_SSLMODE || 'not set',
      connection: 'not tested'
    },
    routes: {
      auth: 'available',
      analysis: 'stub',
      health: 'working'
    }
  };

  // Test database connection if configured
  if (process.env.DB_HOST) {
    try {
      // Try to require mysql2 - if not available, skip database test
      const mysql = require('mysql2/promise');
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 25060,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: process.env.DB_SSLMODE === 'REQUIRED' ? { rejectUnauthorized: false } : false
      });
      
      await connection.execute('SELECT 1 as test');
      await connection.end();
      
      healthStatus.database.connection = 'SUCCESS';
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND' && error.message.includes('mysql2')) {
        healthStatus.database.connection = 'SKIPPED: mysql2 not installed';
      } else {
        healthStatus.database.connection = `FAILED: ${error.message}`;
      }
    }
  }

  res.json(healthStatus);
});

// Auth routes - working login/register
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('Login attempt:', req.body);
    const { email, password, username } = req.body;

    // Accept both email and username
    const loginField = email || username;
    
    if (!loginField || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email/username and password are required'
      });
    }

    // Test credentials - multiple options
    const validCredentials = [
      { email: 'admin@test.com', password: 'admin123' },
      { email: 'test@example.com', password: 'test123' },
      { username: 'admin', password: 'admin123' },
      { username: 'testuser', password: 'test123' }
    ];

    const isValid = validCredentials.some(cred => 
      (cred.email === loginField || cred.username === loginField) && cred.password === password
    );

    if (isValid) {
      return res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: 1,
          email: loginField.includes('@') ? loginField : `${loginField}@test.com`,
          username: loginField.includes('@') ? loginField.split('@')[0] : loginField,
          name: 'Test User'
        },
        token: 'test-jwt-token-' + Date.now()
      });
    }

    // Invalid credentials
    res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('Register attempt:', req.body);
    const { email, password, username, firstName, lastName } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and username are required'
      });
    }

    // Simple registration (no database for now)
    res.json({
      success: true,
      message: 'Registration successful',
      user: {
        id: Date.now(),
        email,
        username,
        firstName: firstName || '',
        lastName: lastName || ''
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Analysis routes - stub implementations
app.post('/api/analysis/analyze', (req, res) => {
  res.json({
    success: true,
    message: 'Analysis endpoint working',
    result: {
      sentiment: 'positive',
      score: 85,
      keywords: ['professional', 'helpful', 'clear']
    }
  });
});

app.get('/api/analysis/sessions', (req, res) => {
  res.json({
    success: true,
    sessions: [
      {
        id: 1,
        sessionName: 'Test Session',
        createdAt: new Date().toISOString(),
        sourceLanguage: 'english'
      }
    ]
  });
});

// Catch all - serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

// Error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  console.error('Stack:', error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start server with error handling
try {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Hybrid server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`💾 Database: ${process.env.DB_HOST || 'not configured'}`);
    console.log(`🌐 Server accessible at: http://0.0.0.0:${PORT}`);
    console.log(`📁 Static files served from: ${path.join(__dirname, '../dist')}`);
    console.log(`🔗 API Routes: /api/auth/login, /api/auth/register, /api/analysis/*`);
    
    // Log all environment variables for debugging
    console.log('🔧 Environment Variables:');
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('DB_') || key.startsWith('API_') || key === 'NODE_ENV' || key === 'PORT') {
        console.log(`   ${key}: ${key.includes('PASSWORD') || key.includes('SECRET') ? '[HIDDEN]' : process.env[key]}`);
      }
    });
  });

  server.on('error', (error) => {
    console.error('❌ Server error:', error.message);
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use`);
    }
  });
} catch (error) {
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
}

module.exports = app;
