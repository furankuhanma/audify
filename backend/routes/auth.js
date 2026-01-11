const express = require('express');
const router = express.Router();
const User = require('../models/User');
const crypto = require('crypto');

/**
 * POST /api/auth/register
 * Register a new user
 * Body: { username, password }
 */
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Username and password are required'
      });
    }

    console.log(`📝 Registration attempt: ${username}`);

    // Create user
    const user = await User.create({ username, password });

    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    // Save session (optional - implement if you want persistent sessions)
    // For now, we'll just return the token

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user.id,
        username: user.username
      },
      token: sessionToken
    });

    console.log(`✅ User registered: ${username}`);

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific errors
    if (error.message.includes('already taken')) {
      return res.status(409).json({
        error: 'Username taken',
        message: error.message
      });
    }

    if (error.message.includes('must be')) {
      return res.status(400).json({
        error: 'Validation error',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Registration failed',
      message: 'An error occurred during registration'
    });
  }
});

/**
 * POST /api/auth/login
 * Login user
 * Body: { username, password }
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Username and password are required'
      });
    }

    console.log(`🔐 Login attempt: ${username}`);

    // Verify credentials
    const user = await User.verifyPassword(username, password);

    if (!user) {
      console.log(`❌ Login failed: ${username}`);
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Username or password is incorrect'
      });
    }

    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    // Save session to database (optional)
    // await saveSession(user.id, sessionToken, expiresAt);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        lastLogin: user.lastLogin
      },
      token: sessionToken
    });

    console.log(`✅ User logged in: ${username}`);

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: 'An error occurred during login'
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (invalidate token)
 * Headers: Authorization: Bearer <token>
 */
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      // Delete session from database
      // await deleteSession(token);
      console.log('👋 User logged out');
    }

    res.json({
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      message: error.message
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 * Headers: Authorization: Bearer <token>
 */
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        error: 'Not authenticated',
        message: 'No token provided'
      });
    }

    // Verify token and get user
    // For now, this is a placeholder
    // You'll need to implement token verification

    res.json({
      user: {
        id: 1,
        username: 'demo_user',
        message: 'Token verification not yet implemented'
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Failed to get user',
      message: error.message
    });
  }
});

/**
 * POST /api/auth/change-password
 * Change user password
 * Body: { currentPassword, newPassword }
 * Headers: Authorization: Bearer <token>
 */
router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        error: 'Not authenticated',
        message: 'No token provided'
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Missing passwords',
        message: 'Current and new passwords are required'
      });
    }

    // Get user ID from token (placeholder - implement token verification)
    const userId = 1; // Replace with actual user ID from token

    // Change password
    await User.changePassword(userId, currentPassword, newPassword);

    res.json({
      message: 'Password changed successfully'
    });

    console.log(`✅ Password changed for user ID: ${userId}`);

  } catch (error) {
    console.error('Change password error:', error);
    
    if (error.message.includes('incorrect')) {
      return res.status(401).json({
        error: 'Invalid password',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Failed to change password',
      message: error.message
    });
  }
});

/**
 * GET /api/auth/check-username/:username
 * Check if username is available
 */
router.get('/check-username/:username', async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findByUsername(username);

    res.json({
      available: !user,
      username: username.toLowerCase()
    });

  } catch (error) {
    console.error('Check username error:', error);
    res.status(500).json({
      error: 'Failed to check username',
      message: error.message
    });
  }
});

module.exports = router;