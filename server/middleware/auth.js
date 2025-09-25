import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import pool from '../config/database.js';

// Verify JWT token middleware
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if token exists in database and is active
    const [sessionRows] = await pool.execute(
      'SELECT * FROM user_sessions WHERE token_hash = ? AND is_active = TRUE AND expires_at > NOW()',
      [token]
    );

    if (sessionRows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Get user data
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
   
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Optional authentication (for public endpoints that can benefit from user context)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (user) {
        req.user = user;
        req.token = token;
      }
    }
    
    next();
  } catch (error) {
    // Ignore auth errors for optional auth
    next();
  }
};

// Role-based authorization middleware
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRoles = Array.isArray(roles) ? roles : [roles];
    if (!userRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Create JWT token and store in database
export const createToken = async (userId) => {
  try {
    const token = jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    // Store token in database
    await pool.execute(
      'INSERT INTO user_sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [userId, token, expiresAt]
    );

    return token;
  } catch (error) {
    throw error;
  }
};

// Revoke token (logout)
export const revokeToken = async (token) => {
  try {
    await pool.execute(
      'UPDATE user_sessions SET is_active = FALSE WHERE token_hash = ?',
      [token]
    );
    return true;
  } catch (error) {
    throw error;
  }
};

// Clean up expired tokens (should be run periodically)
export const cleanupExpiredTokens = async () => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM user_sessions WHERE expires_at < NOW() OR is_active = FALSE'
    );
    console.log(`Cleaned up ${result.affectedRows} expired tokens`);
    return result.affectedRows;
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
    throw error;
  }
};
