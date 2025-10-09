const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3001;

console.log('🚀 Starting DROPLET backend with database...');

// Database configuration for your DigitalOcean database
const dbConfig = {
  host: process.env.DB_HOST || 'trackerbi-do-user-17425890-0.m.db.ondigitalocean.com',
  port: parseInt(process.env.DB_PORT) || 25060,
  user: process.env.DB_USER || 'doadmin',
  password: process.env.DB_PASSWORD || 'YOUR_DB_PASSWORD_HERE',
  database: process.env.DB_NAME || 'defaultdb',
  ssl: {
    rejectUnauthorized: false
  }
};

// Create database connection pool
let pool;
try {
  pool = mysql.createPool(dbConfig);
  console.log('✅ Database pool created');
} catch (error) {
  console.error('❌ Database pool creation failed:', error);
}

// Test database connection
async function testDatabase() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

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
app.get('/health', async (req, res) => {
  console.log('🏥 Health check requested');
  const dbStatus = await testDatabase();
  res.setHeader('Content-Type', 'application/json');
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: dbStatus ? 'Connected' : 'Disconnected',
    message: 'Droplet backend is running'
  });
});

// Create users table if it doesn't exist
async function setupUsersTable() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(50),
        last_name VARCHAR(50),
        role ENUM('admin', 'analyst', 'user') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE
      )
    `);
    console.log('✅ Users table ready');
  } catch (error) {
    console.error('❌ Users table setup failed:', error);
  }
}

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  console.log('📝 Register request received:', req.body);
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

  try {
    // Check if user already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'Email or username already registered'
      });
    }

    // Create new user (simple password storage for now)
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?, ?)',
      [username, email, password, firstName || '', lastName || '']
    );

    console.log('✅ User created in database:', email);
    const response = {
      message: 'User registered successfully',
      user: {
        id: result.insertId,
        username,
        email,
        firstName: firstName || '',
        lastName: lastName || ''
      },
      success: true
    };
    
    console.log('📤 Sending response:', response);
    res.status(201).json(response);

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: error.message
    });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  console.log('🔐 Login request received:', { email: req.body.email });
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

  try {
    // Find user by email
    const [users] = await pool.execute(
      'SELECT id, username, email, password_hash, first_name, last_name FROM users WHERE email = ? AND is_active = TRUE',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    const user = users[0];
    
    // Simple password check (in production, use bcrypt)
    if (user.password_hash !== password) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    console.log('✅ Login successful for:', email);
    const response = {
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name || '',
        lastName: user.last_name || ''
      },
      success: true
    };
    
    console.log('📤 Sending login response:', response);
    res.json(response);

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: error.message
    });
  }
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  console.log('👋 Logout request received');
  res.setHeader('Content-Type', 'application/json');
  res.json({ 
    message: 'Logout successful', 
    success: true 
  });
});

// Profile endpoint
app.get('/api/auth/profile', (req, res) => {
  console.log('👤 Profile request received');
  res.setHeader('Content-Type', 'application/json');
  res.json({
    user: {
      id: 1,
      username: 'demo_user',
      email: 'demo@example.com',
      firstName: 'Demo',
      lastName: 'User'
    }
  });
});

// Analysis sessions endpoint
app.get('/api/analysis/sessions', (req, res) => {
  console.log('📊 Analysis sessions request received');
  res.setHeader('Content-Type', 'application/json');
  res.json({
    success: true,
    sessions: [],
    message: 'No sessions found'
  });
});

// Check existing analysis endpoint
app.get('/api/analysis/sessions/check', (req, res) => {
  console.log('🔍 Check analysis request:', req.query);
  res.setHeader('Content-Type', 'application/json');
  res.json({
    exists: false,
    message: 'No existing analysis found'
  });
});

// Meta dashboard endpoint
app.get('/api/meta/dashboard', (req, res) => {
  console.log('📈 Meta dashboard request:', req.query);
  res.setHeader('Content-Type', 'application/json');
  res.json({
    success: true,
    data: {
      impressions: 0,
      clicks: 0,
      spend: 0,
      ctr: 0
    },
    message: 'Demo data'
  });
});

// Analysis create session endpoint
app.post('/api/analysis/sessions', (req, res) => {
  console.log('📝 Create analysis session:', req.body);
  res.setHeader('Content-Type', 'application/json');
  res.json({
    success: true,
    sessionId: Date.now(),
    message: 'Session created successfully'
  });
});

// Catch all API routes
app.use('/api/*', (req, res) => {
  console.log('🔍 API route not found:', req.path);
  res.setHeader('Content-Type', 'application/json');
  res.status(404).json({ 
    error: 'API route not found',
    path: req.path,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Global error:', err);
  res.setHeader('Content-Type', 'application/json');
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testDatabase();
    if (dbConnected) {
      await setupUsersTable();
    }

    app.listen(PORT, () => {
      console.log('🎉 DROPLET BACKEND WITH DATABASE STARTED!');
      console.log(`📡 Server running on port ${PORT}`);
      console.log(`💾 Database: ${dbConnected ? 'Connected' : 'Disconnected'}`);
      console.log('✅ All API endpoints are ready');
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  if (pool) pool.end();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  if (pool) pool.end();
  process.exit(0);
});
