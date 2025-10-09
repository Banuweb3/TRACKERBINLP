/**
 * Meta Dashboard API Routes
 * Handles Facebook and Instagram data endpoints
 */

import express from 'express';
import facebookService from '../services/facebookService.js';
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
    } = req.query;

    // Check if user is authenticated (optional for backward compatibility)
    const userId = req.user?.id || null;
    
    console.log('Fetching Meta dashboard data:', { 
      ad_account, 
      date_preset, 
      since, 
      until,
      userId: userId ? `User ${userId}` : 'Anonymous (using static tokens)'
    });

    const data = await facebookService.getAllMetaData(ad_account, date_preset, since, until, userId);
router.get('/ads/:account', async (req, res) => {
  try {
    const { account } = req.params;
    const { date_preset = 'last_30d', since, until } = req.query;

    const adAccountId = account === 'facebook' ? 
      process.env.FACEBOOK_AD_ACCOUNT_FACEBOOK : 
      process.env.FACEBOOK_AD_ACCOUNT_INSTAGRAM;

    const data = await facebookService.getAdCampaigns(adAccountId, date_preset, since, until);
    
    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Meta ads API error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/meta/pages
 * Get all pages data
 */
router.get('/pages', async (req, res) => {
  try {
    const { since, until } = req.query;
    
    // Set default date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 28);
    
    const sinceDate = since || startDate.toISOString().split('T')[0];
    const untilDate = until || endDate.toISOString().split('T')[0];

    const pages = [
      {
        id: process.env.FACEBOOK_PAGE_HARISHSHOPPY_ID,
        token: process.env.FACEBOOK_PAGE_HARISHSHOPPY_TOKEN
      },
      {
        id: process.env.FACEBOOK_PAGE_ADAMANDEVE_ID,
        token: process.env.FACEBOOK_PAGE_ADAMANDEVE_TOKEN
      }
    ];

    const pagesData = await Promise.all(
      pages.map(page => facebookService.getPageInsights(page.id, page.token, sinceDate, untilDate))
    );
    
    res.json({
      success: true,
      data: pagesData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Meta pages API error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/meta/health
 * Health check for Meta API integration
 */
router.get('/health', async (req, res) => {
  try {
    const requiredEnvVars = [
      'FACEBOOK_ACCESS_TOKEN',
      'FACEBOOK_APP_SECRET',
      'FACEBOOK_AD_ACCOUNT_INSTAGRAM',
      'FACEBOOK_AD_ACCOUNT_FACEBOOK',
      'FACEBOOK_PAGE_HARISHSHOPPY_ID',
      'FACEBOOK_PAGE_HARISHSHOPPY_TOKEN',
      'FACEBOOK_PAGE_ADAMANDEVE_ID',
      'FACEBOOK_PAGE_ADAMANDEVE_TOKEN'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required environment variables',
        missing: missingVars,
        timestamp: new Date().toISOString()
      });
    }

    // Test API connection with a simple request
    const testResponse = await facebookService.makeRequest('/me', { fields: 'id,name' });
    
    res.json({
      success: true,
      message: 'Meta API integration is healthy',
      api_user: testResponse,
      timestamp: new Date().toISOString()
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
