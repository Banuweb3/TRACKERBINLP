// Complete dashboard response format fix for frontend compatibility
// This script updates the backend to return exactly what the frontend expects

const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, 'server', 'droplet-server.js');
let content = fs.readFileSync(serverFile, 'utf8');

console.log('🔧 Fixing dashboard response formats...');

// Fix Meta dashboard endpoint
const metaDashboardFix = `
// Meta dashboard endpoint - Frontend Compatible Format
app.get('/api/meta/dashboard', (req, res) => {
  console.log('📈 Meta dashboard request:', req.query);
  res.setHeader('Content-Type', 'application/json');
  
  // Return format exactly matching frontend expectations
  res.json({
    success: true,
    status: 'success',
    data: {
      ads: {
        totalSpend: 1250.50,
        impressions: 45000,
        clicks: 890,
        ctr: 1.98,
        cpc: 1.41,
        conversions: 23,
        reach: 38500,
        frequency: 1.17,
        costPerConversion: 54.37
      },
      campaigns: [
        {
          id: 'camp_001',
          name: 'Summer Campaign 2024',
          status: 'active',
          spend: 650.25,
          impressions: 22000,
          clicks: 445,
          conversions: 12
        }
      ],
      insights: {
        topPerformingAd: 'Summer Sale - Video Ad',
        bestAudience: 'Age 25-34, Interests: Technology',
        recommendedBudget: 1500
      }
    },
    message: 'Meta dashboard data retrieved successfully'
  });
});`;

// Fix Calling dashboard endpoint
const callingDashboardFix = `
// Calling dashboard endpoint - Frontend Compatible Format
app.get('/api/calling/dashboard-data', (req, res) => {
  console.log('📞 Calling dashboard data request');
  res.setHeader('Content-Type', 'application/json');
  
  // Return format exactly matching frontend expectations
  res.json({
    success: true,
    status: 'success',
    data: {
      overview: {
        totalCalls: 150,
        successfulCalls: 142,
        failedCalls: 8,
        averageDuration: 245,
        successRate: 94.67
      },
      timeframe: {
        callsToday: 25,
        callsThisWeek: 180,
        callsThisMonth: 720
      },
      performance: {
        averageWaitTime: 12,
        customerSatisfaction: 4.2,
        firstCallResolution: 78
      },
      agents: [
        {
          id: 'agent_001',
          name: 'John Smith',
          callsHandled: 45,
          avgDuration: 280,
          satisfaction: 4.5
        }
      ]
    },
    message: 'Calling dashboard data retrieved successfully'
  });
});`;

// Replace the existing endpoints
content = content.replace(/\/\/ Meta dashboard endpoint[\s\S]*?}\);/m, metaDashboardFix);
content = content.replace(/\/\/ Calling dashboard.*?endpoint[\s\S]*?}\);/m, callingDashboardFix);

fs.writeFileSync(serverFile, content);
console.log('✅ Dashboard endpoints fixed!');
console.log('🚀 Restart backend: pm2 restart bpo-backend');
