import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { testConnection } from './config/database.js';
import setupDatabase from './scripts/setupDatabase.js';
import authRoutes from './routes/auth.js';
import analysisRoutes from './routes/analysis.js';
import bulkAnalysisRoutes from './routes/bulkAnalysis.js';
import metaRoutes from './routes/meta.js';
import callingRoutes from './routes/calling.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);

    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:5173',      // Local development
      'http://127.0.0.1:5173',     // Alternative local
      'https://trackerbi-vvrvr.ondigitalocean.app', // Production frontend
      process.env.FRONTEND_URL      // Additional configured URL
    ].filter(Boolean);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.warn('CORS blocked origin:', origin);
      return callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/bulk-analysis', bulkAnalysisRoutes);
app.use('/api/meta', metaRoutes);
app.use('/api/calling', callingRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'Duplicate entry' });
  }
  
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({ error: 'Invalid reference' });
  }

  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
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

// Start server
const startServer = async () => {
  try {
    console.log('🚀 Starting BPO Analytics Server...');
    
    // Test database connection
    console.log('🗄️ Testing database connection...');
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.warn('⚠️ Database connection failed, but continuing server startup...');
      console.warn('Database features may not work properly.');
    } else {
      console.log('✅ Database connection successful');
      
      // Setup database tables
      console.log('📋 Setting up database tables...');
      const dbSetup = await setupDatabase();
      if (dbSetup) {
        console.log('✅ Database tables setup completed');
      } else {
        console.warn('⚠️ Database setup had issues, but continuing...');
      }
    }

    app.listen(PORT, () => {
      console.log(`🚀 Trackerbi Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
      console.log(`💾 Database: ${process.env.DB_NAME || 'defaultdb'}`);
      console.log('✅ Server startup completed successfully');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.error('Error details:', error.stack);
    process.exit(1);
  }
};

startServer();
