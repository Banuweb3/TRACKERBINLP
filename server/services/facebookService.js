/**
 * Facebook Graph API Service
 * Handles Instagram and Facebook data fetching with dynamic user tokens
 */

import axios from 'axios';
import crypto from 'crypto';
// Import FacebookAccount only when needed to avoid startup crashes
// import { FacebookAccount } from '../models/FacebookAccount.js';

class FacebookService {
  constructor() {
    this.baseURL = 'https://graph.facebook.com/v18.0';
    this.appSecret = process.env.FACEBOOK_APP_SECRET;
    
    // Fallback static tokens (for backward compatibility)
    this.fallbackTokens = {
      accessToken: process.env.FACEBOOK_ACCESS_TOKEN,
      adAccounts: {
        instagram: process.env.FACEBOOK_AD_ACCOUNT_INSTAGRAM,
        facebook: process.env.FACEBOOK_AD_ACCOUNT_FACEBOOK
      },
      pages: [
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
      ]
    };
  }

  /**
   * Get user's Facebook accounts
   */
  async getUserAccounts(userId) {
    try {
      const { FacebookAccount } = await import('../models/FacebookAccount.js');
      return await FacebookAccount.findByUserId(userId);
    } catch (error) {
      console.error('Error fetching user Facebook accounts:', error);
      return [];
    }
  }

  /**
   * Get user's ad accounts
   */
  async getUserAdAccounts(userId) {
    try {
      const { FacebookAccount } = await import('../models/FacebookAccount.js');
      return await FacebookAccount.findByUserAndType(userId, 'ad_account');
    } catch (error) {
      console.error('Error fetching user ad accounts:', error);
      return [];
    }
  }

  /**
   * Get user's pages
   */
  async getUserPages(userId) {
    try {
      const { FacebookAccount } = await import('../models/FacebookAccount.js');
      return await FacebookAccount.findByUserAndType(userId, 'page');
    } catch (error) {
      console.error('Error fetching user pages:', error);
      return [];
    }
  }

  /**
   * Generate app secret proof for secure API calls
   */
  generateAppSecretProof(accessToken) {
    return crypto.createHmac('sha256', this.appSecret).update(accessToken).digest('hex');
  }

  /**
   * Make Facebook Graph API request
   */
  async makeRequest(endpoint, params = {}, token = null) {
    try {
      const accessToken = token || this.accessToken;
      const appsecretProof = this.generateAppSecretProof(accessToken);
      
      const response = await axios.get(`${this.baseURL}${endpoint}`, {
        params: {
          access_token: accessToken,
          appsecret_proof: appsecretProof,
          ...params
        },
        timeout: 30000
      });
      
      return response.data;
    } catch (error) {
      console.error('Facebook API Error:', error.response?.data || error.message);
      throw new Error(`Facebook API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Get Ad Campaign Data
   */
  async getAdCampaigns(adAccountId, datePreset = 'last_30d', since = null, until = null) {
    try {
      // Get campaigns
      const campaignsResponse = await this.makeRequest(`/${adAccountId}/campaigns`, {
        fields: 'id,name,status,objective,effective_status,start_time,stop_time',
        limit: 250
      });

      const campaigns = campaignsResponse.data || [];
      
      // Get insights
      const insightsParams = {
        level: 'campaign',
        fields: 'campaign_id,campaign_name,spend,impressions,reach,clicks,ctr,cpc,cpm,actions,inline_link_clicks,unique_inline_link_clicks',
        limit: 500
      };

      if (since && until) {
        insightsParams.time_range = JSON.stringify({ since, until });
      } else {
        insightsParams.date_preset = datePreset;
      }

      const insightsResponse = await this.makeRequest(`/${adAccountId}/insights`, insightsParams);
      const insights = insightsResponse.data || [];

      // Combine campaign data with insights
      const campaignInsights = {};
      insights.forEach(insight => {
        if (insight.campaign_id) {
          campaignInsights[insight.campaign_id] = insight;
        }
      });

      // Calculate totals
      let totalSpend = 0;
      let totalImpressions = 0;
      let totalClicks = 0;
      let totalLeads = 0;

      insights.forEach(insight => {
        totalSpend += parseFloat(insight.spend || 0);
        totalImpressions += parseInt(insight.impressions || 0);
        totalClicks += parseInt(insight.clicks || 0);
        
        // Count leads from actions
        if (insight.actions) {
          insight.actions.forEach(action => {
            if (['lead', 'offsite_conversion.lead'].includes(action.action_type)) {
              totalLeads += parseInt(action.value || 0);
            }
          });
        }
      });

      const avgCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;
      const avgCPM = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;
      const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
      const avgCPL = totalLeads > 0 ? totalSpend / totalLeads : 0;

      return {
        campaigns: campaigns.map(campaign => ({
          ...campaign,
          insights: campaignInsights[campaign.id] || {}
        })),
        totals: {
          totalSpend,
          totalImpressions,
          totalClicks,
          totalLeads,
          avgCPC,
          avgCPM,
          avgCTR,
          avgCPL
        }
      };
    } catch (error) {
      console.error('Error fetching ad campaigns:', error);
      throw error;
    }
  }

  /**
   * Get Page Insights Data
   */
  async getPageInsights(pageId, pageToken, since, until) {
    try {
      const data = {
        id: pageId,
        name: '',
        about: '',
        total_followers: 0,
        reach: 0,
        engaged: 0,
        engagement_rate: 0,
        page_views: 0,
        video_views: 0,
        cta_clicks: 0,
        organic_reach: 0,
        paid_reach: 0,
        total_posts: 0,
        labels: [],
        daily_reach: [],
        daily_engaged: [],
        fanAdds: [],
        fanRemoves: [],
        posts: [],
        top_post: null
      };

      // Get page info
      const pageInfo = await this.makeRequest(`/${pageId}`, {
        fields: 'about,followers_count,fan_count,name'
      }, pageToken);

      data.name = pageInfo.name || '';
      data.about = pageInfo.about || '';
      data.total_followers = pageInfo.followers_count || pageInfo.fan_count || 0;

      // Get page impressions (reach)
      const impressionsData = await this.makeRequest(`/${pageId}/insights`, {
        metric: 'page_impressions',
        period: 'day',
        since,
        until
      }, pageToken);

      if (impressionsData.data && impressionsData.data[0] && impressionsData.data[0].values) {
        impressionsData.data[0].values.forEach(value => {
          data.labels.push(new Date(value.end_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
          data.daily_reach.push(value.value || 0);
        });
        data.reach = data.daily_reach.reduce((sum, val) => sum + val, 0);
      }

      // Get engaged users
      const engagedData = await this.makeRequest(`/${pageId}/insights`, {
        metric: 'page_engaged_users',
        period: 'day',
        since,
        until
      }, pageToken);

      if (engagedData.data && engagedData.data[0] && engagedData.data[0].values) {
        engagedData.data[0].values.forEach(value => {
          data.daily_engaged.push(value.value || 0);
        });
        data.engaged = data.daily_engaged.reduce((sum, val) => sum + val, 0);
      }

      data.engagement_rate = data.reach > 0 ? ((data.engaged / data.reach) * 100).toFixed(2) : 0;

      // Get page views
      const viewsData = await this.makeRequest(`/${pageId}/insights`, {
        metric: 'page_views_total',
        period: 'day',
        since,
        until
      }, pageToken);

      if (viewsData.data && viewsData.data[0] && viewsData.data[0].values) {
        const views = viewsData.data[0].values.map(v => v.value || 0);
        data.page_views = views.reduce((sum, val) => sum + val, 0);
      }

      // Get video views
      const videoViewsData = await this.makeRequest(`/${pageId}/insights`, {
        metric: 'page_video_views',
        period: 'day',
        since,
        until
      }, pageToken);

      if (videoViewsData.data && videoViewsData.data[0] && videoViewsData.data[0].values) {
        const videoViews = videoViewsData.data[0].values.map(v => v.value || 0);
        data.video_views = videoViews.reduce((sum, val) => sum + val, 0);
      }

      // Get CTA clicks
      const ctaData = await this.makeRequest(`/${pageId}/insights`, {
        metric: 'page_cta_clicks_logged_in_total',
        period: 'day',
        since,
        until
      }, pageToken);

      if (ctaData.data && ctaData.data[0] && ctaData.data[0].values) {
        const ctaClicks = ctaData.data[0].values.map(v => v.value || 0);
        data.cta_clicks = ctaClicks.reduce((sum, val) => sum + val, 0);
      }

      // Get organic vs paid reach
      const organicData = await this.makeRequest(`/${pageId}/insights`, {
        metric: 'page_impressions_organic',
        period: 'day',
        since,
        until
      }, pageToken);

      if (organicData.data && organicData.data[0] && organicData.data[0].values) {
        const organic = organicData.data[0].values.map(v => v.value || 0);
        data.organic_reach = organic.reduce((sum, val) => sum + val, 0);
      }

      const paidData = await this.makeRequest(`/${pageId}/insights`, {
        metric: 'page_impressions_paid',
        period: 'day',
        since,
        until
      }, pageToken);

      if (paidData.data && paidData.data[0] && paidData.data[0].values) {
        const paid = paidData.data[0].values.map(v => v.value || 0);
        data.paid_reach = paid.reduce((sum, val) => sum + val, 0);
      }

      // Get fan adds/removes
      const fanAddsData = await this.makeRequest(`/${pageId}/insights`, {
        metric: 'page_fan_adds',
        period: 'day',
        since,
        until
      }, pageToken);

      if (fanAddsData.data && fanAddsData.data[0] && fanAddsData.data[0].values) {
        data.fanAdds = fanAddsData.data[0].values.map(v => v.value || 0);
      }

      const fanRemovesData = await this.makeRequest(`/${pageId}/insights`, {
        metric: 'page_fan_removes',
        period: 'day',
        since,
        until
      }, pageToken);

      if (fanRemovesData.data && fanRemovesData.data[0] && fanRemovesData.data[0].values) {
        data.fanRemoves = fanRemovesData.data[0].values.map(v => v.value || 0);
      }

      // Get recent posts
      const postsData = await this.makeRequest(`/${pageId}/posts`, {
        fields: 'id,message,created_time,full_picture,reactions.summary(true),comments.summary(true),shares',
        limit: 10
      }, pageToken);

      if (postsData.data) {
        data.posts = postsData.data.map(post => ({
          id: post.id,
          message: post.message || '[No text]',
          created_time: post.created_time,
          full_picture: post.full_picture,
          reactions: post.reactions || { summary: { total_count: 0 } },
          comments: post.comments || { summary: { total_count: 0 } },
          shares: post.shares || { count: 0 }
        }));

        // Find top performing post
        if (data.posts.length > 0) {
          data.posts.sort((a, b) => {
            const aEngagement = (a.reactions.summary.total_count || 0) + 
                              (a.comments.summary.total_count || 0) + 
                              (a.shares.count || 0);
            const bEngagement = (b.reactions.summary.total_count || 0) + 
                              (b.comments.summary.total_count || 0) + 
                              (b.shares.count || 0);
            return bEngagement - aEngagement;
          });
          data.top_post = data.posts[0];
        }
      }

      // Count total posts in time range
      let totalPosts = 0;
      let after = null;
      do {
        const params = { since, until, limit: 100 };
        if (after) params.after = after;
        
        const postsCount = await this.makeRequest(`/${pageId}/posts`, params, pageToken);
        const batch = postsCount.data ? postsCount.data.length : 0;
        totalPosts += batch;
        after = postsCount.paging?.cursors?.after;
        if (batch === 0) after = null;
      } while (after);
      
      data.total_posts = totalPosts;

      return data;
    } catch (error) {
      console.error(`Error fetching page insights for ${pageId}:`, error);
      throw error;
    }
  }

  /**
   * Get all Meta data (Ads + Pages) - supports both user tokens and fallback static tokens
   */
  async getAllMetaData(adAccount = 'instagram', datePreset = 'last_30d', since = null, until = null, userId = null) {
    try {
      // Set default date range if not provided
      if (!since || !until) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 28);
        since = startDate.toISOString().split('T')[0];
        until = endDate.toISOString().split('T')[0];
      }

      let adsData = { totals: {}, campaigns: [] };
      let pagesData = [];

      if (userId) {
        // Use user's connected accounts
        console.log(`🔄 Fetching Meta data for user ${userId} with dynamic tokens...`);
        
        // Get user's ad accounts
        const userAdAccounts = await this.getUserAdAccounts(userId);
        const userPages = await this.getUserPages(userId);

        if (userAdAccounts.length > 0) {
          // Use first matching ad account or first available
          const selectedAdAccount = userAdAccounts.find(acc => 
            acc.accountName.toLowerCase().includes(adAccount) || 
            acc.accountId.includes(adAccount)
          ) || userAdAccounts[0];

          if (!selectedAdAccount.isTokenExpired()) {
            adsData = await this.getAdCampaigns(selectedAdAccount.accountId, datePreset, since, until, selectedAdAccount.accessToken);
          } else {
            console.warn(`⚠️ Ad account token expired for ${selectedAdAccount.accountName}`);
          }
        }

        if (userPages.length > 0) {
          // Fetch data from user's connected pages
          const validPages = userPages.filter(page => !page.isTokenExpired());
          if (validPages.length > 0) {
            pagesData = await Promise.all(
              validPages.map(page => this.getPageInsights(page.accountId, page.accessToken, since, until))
            );
          } else {
            console.warn('⚠️ All user page tokens are expired');
          }
        }

        // If no user accounts or all expired, fall back to static tokens
        if (userAdAccounts.length === 0 && userPages.length === 0) {
          console.log('📋 No user accounts found, using fallback static tokens...');
          return this.getAllMetaDataWithFallback(adAccount, datePreset, since, until);
        }
      } else {
        // Use static fallback tokens
        console.log('📋 Using static fallback tokens...');
        return this.getAllMetaDataWithFallback(adAccount, datePreset, since, until);
      }

      return {
        ads: {
          totalSpend: adsData.totals.totalSpend || 0,
          totalImpressions: adsData.totals.totalImpressions || 0,
          totalClicks: adsData.totals.totalClicks || 0,
          totalLeads: adsData.totals.totalLeads || 0,
          avgCPC: adsData.totals.avgCPC || 0,
          avgCPM: adsData.totals.avgCPM || 0,
          avgCTR: adsData.totals.avgCTR || 0,
          avgCPL: adsData.totals.avgCPL || 0,
          campaigns: (adsData.campaigns || []).map(campaign => ({
            id: campaign.id,
            name: campaign.name,
            status: campaign.status,
            objective: campaign.objective,
            spend: parseFloat(campaign.insights?.spend || 0),
            impressions: parseInt(campaign.insights?.impressions || 0),
            clicks: parseInt(campaign.insights?.clicks || 0),
            ctr: parseFloat(campaign.insights?.ctr || 0),
            cpl: campaign.insights?.actions ? this.calculateCPL(campaign.insights) : 0
          }))
        },
        pages: pagesData
      };
    } catch (error) {
      console.error('Error fetching all Meta data:', error);
      throw error;
    }
  }

  /**
   * Fallback method using static tokens (backward compatibility)
   */
  async getAllMetaDataWithFallback(adAccount = 'instagram', datePreset = 'last_30d', since = null, until = null) {
    try {
      const adAccountId = this.fallbackTokens.adAccounts[adAccount] || this.fallbackTokens.adAccounts.instagram;
      
      // Fetch ads data with fallback token
      const adsData = await this.getAdCampaigns(adAccountId, datePreset, since, until, this.fallbackTokens.accessToken);

      // Fetch pages data with fallback tokens
      const pagesData = await Promise.all(
        this.fallbackTokens.pages.map(page => this.getPageInsights(page.id, page.token, since, until))
      );

      return {
        ads: {
          totalSpend: adsData.totals.totalSpend || 0,
          totalImpressions: adsData.totals.totalImpressions || 0,
          totalClicks: adsData.totals.totalClicks || 0,
          totalLeads: adsData.totals.totalLeads || 0,
          avgCPC: adsData.totals.avgCPC || 0,
          avgCPM: adsData.totals.avgCPM || 0,
          avgCTR: adsData.totals.avgCTR || 0,
          avgCPL: adsData.totals.avgCPL || 0,
          campaigns: (adsData.campaigns || []).map(campaign => ({
            id: campaign.id,
            name: campaign.name,
            status: campaign.status,
            objective: campaign.objective,
            spend: parseFloat(campaign.insights?.spend || 0),
            impressions: parseInt(campaign.insights?.impressions || 0),
            clicks: parseInt(campaign.insights?.clicks || 0),
            ctr: parseFloat(campaign.insights?.ctr || 0),
            cpl: campaign.insights?.actions ? this.calculateCPL(campaign.insights) : 0
          }))
        },
        pages: pagesData
      };
    } catch (error) {
      console.error('Error with fallback Meta data:', error);
      throw error;
    }
  }

  /**
   * Calculate Cost Per Lead from campaign insights
   */
  calculateCPL(insights) {
    if (!insights.actions || !insights.spend) return 0;
    
    let leads = 0;
    insights.actions.forEach(action => {
      if (['lead', 'offsite_conversion.lead'].includes(action.action_type)) {
        leads += parseInt(action.value || 0);
      }
    });
    
    return leads > 0 ? parseFloat(insights.spend) / leads : 0;
  }
}

export default new FacebookService();
