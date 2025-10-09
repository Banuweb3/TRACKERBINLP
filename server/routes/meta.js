/**
 * Meta Dashboard API Routes
 * Handles Facebook and Instagram data endpoints
 */

import express from 'express';
import facebookService from '../services/facebookService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/meta/dashboard
 * Get complete Meta dashboard data (Ads + Pages)
 * Now supports both authenticated users (dynamic tokens) and fallback (static tokens)
 */
router.get('/dashboard', async (req, res) => {
  try {
    const { 
      ad_account = 'instagram', 
      date_preset = 'last_30d',
      since,
      until
    } = req.query;

    // Check if user is authenticated (optional for backward compatibility)
    const userId = req.user?.id || null;
    
    console.log('📊 Fetching Meta dashboard data:', { 
      ad_account, 
      date_preset, 
      since, 
      until,
      userId: userId ? `User ${userId}` : 'Anonymous (using static tokens)'
    });

    const data = await facebookService.getAllMetaData(ad_account, date_preset, since, until, userId);

    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
      params: { ad_account, date_preset, since, until },
      tokenType: userId ? 'dynamic' : 'static'
    });

  } catch (error) {
    console.error('Meta dashboard error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/meta/ads/:account
 * Get ads data for specific account
 */
router.get('/ads/:account', async (req, res) => {
  try {
    const { account } = req.params;
    const { date_preset = 'last_30d', since, until } = req.query;
    const userId = req.user?.id || null;

    console.log(`📊 Fetching ads data for ${account}:`, { date_preset, since, until, userId });

    // For backward compatibility, use static tokens if no user
    if (!userId) {
      const adAccountId = account === 'facebook' ? 
        process.env.FACEBOOK_AD_ACCOUNT_FACEBOOK : 
        process.env.FACEBOOK_AD_ACCOUNT_INSTAGRAM;

      const data = await facebookService.getAdCampaigns(adAccountId, date_preset, since, until);
      
      return res.json({
        success: true,
        data,
        timestamp: new Date().toISOString(),
        tokenType: 'static'
      });
    }

    // Use user's dynamic tokens
    const userAdAccounts = await facebookService.getUserAdAccounts(userId);
    const selectedAccount = userAdAccounts.find(acc => 
      acc.accountName.toLowerCase().includes(account) || 
      acc.accountId.includes(account)
    ) || userAdAccounts[0];

    if (!selectedAccount) {
      return res.status(404).json({
        success: false,
        error: 'No ad accounts found for user'
      });
    }

    if (selectedAccount.isTokenExpired()) {
      return res.status(401).json({
        success: false,
        error: 'Ad account token expired. Please reconnect your Facebook account.'
      });
    }

    const data = await facebookService.getAdCampaigns(
      selectedAccount.accountId, 
      date_preset, 
      since, 
      until, 
      selectedAccount.accessToken
    );
    
    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
      account: selectedAccount.toJSON(),
      tokenType: 'dynamic'
    });

  } catch (error) {
    console.error('Meta ads error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/meta/pages
 * Get pages data for authenticated user
 */
router.get('/pages', async (req, res) => {
  try {
    const { since, until } = req.query;
    const userId = req.user?.id || null;

    console.log('📊 Fetching pages data:', { since, until, userId });

    // For backward compatibility, use static tokens if no user
    if (!userId) {
      const staticPages = [
        {
          id: process.env.FACEBOOK_PAGE_HARISHSHOPPY_ID,
          name: 'Harishshoppy',
          token: process.env.FACEBOOK_PAGE_HARISHSHOPPY_TOKEN
        },
        {
          id: process.env.FACEBOOK_PAGE_ADAMANDEVE_ID,
          name: 'Adamandeveinc.in',
          token: process.env.FACEBOOK_PAGE_ADAMANDEVE_TOKEN
        }
      ];

      const pagesData = await Promise.all(
        staticPages.map(page => facebookService.getPageInsights(page.id, page.token, since, until))
      );

      return res.json({
        success: true,
        data: pagesData,
        timestamp: new Date().toISOString(),
        tokenType: 'static'
      });
    }

    // Use user's dynamic tokens
    const userPages = await facebookService.getUserPages(userId);
    const validPages = userPages.filter(page => !page.isTokenExpired());

    if (validPages.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No valid pages found for user'
      });
    }

    const pagesData = await Promise.all(
      validPages.map(page => facebookService.getPageInsights(page.accountId, page.accessToken, since, until))
    );

    res.json({
      success: true,
      data: pagesData,
      timestamp: new Date().toISOString(),
      pages: validPages.map(p => p.toJSON()),
      tokenType: 'dynamic'
    });

  } catch (error) {
    console.error('Meta pages error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/meta/health
 * Health check for Meta API service
 */
router.get('/health', async (req, res) => {
  try {
    const userId = req.user?.id || null;
    
    const health = {
      service: 'Meta Dashboard API',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      tokenType: userId ? 'dynamic' : 'static',
      facebook_app_id: process.env.FACEBOOK_APP_ID ? 'configured' : 'missing',
      facebook_app_secret: process.env.FACEBOOK_APP_SECRET ? 'configured' : 'missing'
    };

    if (userId) {
      const userAccounts = await facebookService.getUserAccounts(userId);
      health.userAccounts = {
        total: userAccounts.length,
        active: userAccounts.filter(acc => acc.isActive && !acc.isTokenExpired()).length,
        expired: userAccounts.filter(acc => acc.isTokenExpired()).length
      };
    } else {
      health.staticTokens = {
        access_token: process.env.FACEBOOK_ACCESS_TOKEN ? 'configured' : 'missing',
        page_tokens: [
          process.env.FACEBOOK_PAGE_HARISHSHOPPY_TOKEN ? 'harishshoppy_ok' : 'harishshoppy_missing',
          process.env.FACEBOOK_PAGE_ADAMANDEVE_TOKEN ? 'adamandeve_ok' : 'adamandeve_missing'
        ]
      };
    }

    res.json({
      success: true,
      ...health
    });

  } catch (error) {
    console.error('Meta health check error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
