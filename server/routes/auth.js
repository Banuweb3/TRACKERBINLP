import express from 'express';
import { body, validationResult } from 'express-validator';
import { User } from '../models/User.js';
import { authenticateToken, createToken, revokeToken } from '../middleware/auth.js';

const router = express.Router();

// Register new user
router.post('/register', [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('firstName')
    .optional()
    .isLength({ max: 50 })
    .withMessage('First name must be less than 50 characters'),
  body('lastName')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Last name must be less than 50 characters')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { username, email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUserByEmail = await User.findByEmail(email);
    if (existingUserByEmail) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const existingUserByUsername = await User.findByUsername(username);
    if (existingUserByUsername) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    // Create new user
    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName
    });

    // Generate JWT token
    const token = await createToken(user.id);

    res.status(201).json({
      message: 'User registered successfully',
      user: user.toJSON(),
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login user
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user with password
    const userData = await User.findByEmailWithPassword(email);
    if (!userData) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isValidPassword = await User.verifyPassword(password, userData.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Create user object (without password)
    const user = new User(userData);

    // Generate JWT token
    const token = await createToken(user.id);

    res.json({
      message: 'Login successful',
      user: user.toJSON(),
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout user
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    await revokeToken(req.token);
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const analysisCount = await req.user.getAnalysisCount();
    
    res.json({
      user: req.user.toJSON(),
      stats: {
        totalAnalyses: analysisCount
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, [
  body('firstName')
    .optional()
    .isLength({ max: 50 })
    .withMessage('First name must be less than 50 characters'),
  body('lastName')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Last name must be less than 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { firstName, lastName, email } = req.body;

    // Check if email is already taken by another user
    if (email && email !== req.user.email) {
      const existingUser = await User.findByEmail(email);
      if (existingUser && existingUser.id !== req.user.id) {
        return res.status(409).json({ error: 'Email already in use' });
      }
    }

    // Update user
    const updatedUser = await req.user.update({
      firstName,
      lastName,
      email
    });

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser.toJSON()
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Profile update failed' });
  }
});

// Verify token (for frontend to check if user is still authenticated)
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    valid: true,
    user: req.user.toJSON()
  });
});

export default router;
