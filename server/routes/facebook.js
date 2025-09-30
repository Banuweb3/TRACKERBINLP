/**
 * Facebook OAuth Integration Routes
 * Handles Facebook account connection and token management
 */

import express from 'express';
import axios from 'axios';
// import { FacebookAccount } from '../models/FacebookAccount.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/facebook/auth-url
 * Generate Facebook OAuth URL for user to connect their account
 */
router.get('/auth-url', authenticateToken, (req, res) => {
  const appId = process.env.FACEBOOK_APP_ID;
  const redirectUri = `${process.env.FRONTEND_URL}/facebook/callback`;
  
  const scopes = [
    'pages_read_engagement',
    'pages_show_list', 
    'ads_read',
    'read_insights',
    'business_management'
  ].join(',');

  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
    `client_id=${appId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${encodeURIComponent(scopes)}&` +
    `response_type=code&` +
    `state=${req.user.id}`;

  res.json({
    success: true,
    authUrl,
    message: 'Use this URL to connect your Facebook account'
  });
});

/**
 * POST /api/facebook/callback
 * Handle Facebook OAuth callback and exchange code for token
 */
router.post('/callback', authenticateToken, async (req, res) => {
  try {
    const { code, state } = req.body;
    
    // Verify state matches user ID for security
    if (parseInt(state) !== req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Invalid state parameter'
      });
    }

    // Exchange code for access token
    const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        redirect_uri: `${process.env.FRONTEND_URL}/facebook/callback`,
        code
      }
    });

    const { access_token, expires_in } = tokenResponse.data;
    
    // Get user info
    const userResponse = await axios.get('https://graph.facebook.com/v18.0/me', {
      params: {
        access_token,
        fields: 'id,name,email'
      }
    });

    const facebookUser = userResponse.data;
    
    // Get user's pages
    const pagesResponse = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
      params: {
        access_token,
        fields: 'id,name,access_token,perms'
      }
    });

    // Get user's ad accounts
    const adAccountsResponse = await axios.get('https://graph.facebook.com/v18.0/me/adaccounts', {
      params: {
        access_token,
        fields: 'id,name,account_status'
      }
    });

    // Calculate token expiry
    const tokenExpiry = expires_in ? 
      new Date(Date.now() + expires_in * 1000) : 
      new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days default

    const savedAccounts = [];

    // Save pages
    for (const page of pagesResponse.data.data || []) {
      const account = await FacebookAccount.create(req.user.id, {
        facebookUserId: facebookUser.id,
        accessToken: page.access_token,
        tokenExpiry,
        accountType: 'page',
        accountId: page.id,
        accountName: page.name,
        permissions: page.perms || []
      });
      savedAccounts.push(account);
    }

    // Save ad accounts
    for (const adAccount of adAccountsResponse.data.data || []) {
      const account = await FacebookAccount.create(req.user.id, {
        facebookUserId: facebookUser.id,
        accessToken: access_token,
        tokenExpiry,
        accountType: 'ad_account',
        accountId: adAccount.id,
        accountName: adAccount.name,
        permissions: ['ads_read', 'read_insights']
      });
      savedAccounts.push(account);
    }

    res.json({
      success: true,
      message: 'Facebook accounts connected successfully',
      accounts: savedAccounts.map(acc => acc.toJSON()),
      user: {
        id: facebookUser.id,
        name: facebookUser.name,
        email: facebookUser.email
      }
    });

  } catch (error) {
    console.error('Facebook callback error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to connect Facebook account',
      details: error.response?.data || error.message
    });
  }
});

/**
 * GET /api/facebook/accounts
 * Get user's connected Facebook accounts
 */
router.get('/accounts', authenticateToken, async (req, res) => {
  try {
    const accounts = await FacebookAccount.findByUserId(req.user.id);
    
    res.json({
      success: true,
      accounts: accounts.map(acc => acc.toJSON())
    });
  } catch (error) {
    console.error('Get Facebook accounts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Facebook accounts'
    });
  }
});

/**
 * DELETE /api/facebook/accounts/:id
 * Disconnect a Facebook account
 */
router.delete('/accounts/:id', authenticateToken, async (req, res) => {
  try {
    const account = await FacebookAccount.findById(req.params.id);
    
    if (!account || account.userId !== req.user.id) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    await account.deactivate();
    
    res.json({
      success: true,
      message: 'Facebook account disconnected'
    });
  } catch (error) {
    console.error('Disconnect Facebook account error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disconnect Facebook account'
    });
  }
});

/**
 * POST /api/facebook/refresh-token/:id
 * Refresh Facebook access token
 */
router.post('/refresh-token/:id', authenticateToken, async (req, res) => {
  try {
    const account = await FacebookAccount.findById(req.params.id);
    
    if (!account || account.userId !== req.user.id) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    // For long-lived tokens, we need to exchange them
    const refreshResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        fb_exchange_token: account.accessToken
      }
    });

    const { access_token, expires_in } = refreshResponse.data;
    const newExpiry = expires_in ? 
      new Date(Date.now() + expires_in * 1000) : 
      new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

    await account.updateToken(access_token, newExpiry);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      account: account.toJSON()
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh token',
      details: error.response?.data || error.message
    });
  }
});

export default router;
