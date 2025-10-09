#!/bin/bash

# Manual Deployment Script for DigitalOcean App Platform
# Since GitHub push is blocked, use this to manually deploy the fixed configuration

echo "🚀 Manual Deployment to DigitalOcean App Platform"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f ".do/app.yaml" ]; then
    echo "❌ Error: .do/app.yaml not found. Please run this script from the project root."
    exit 1
fi

echo "✅ Found configuration files"

# Display current configuration
echo ""
echo "📋 Current Configuration:"
echo "Frontend URL: https://trackerbi-vvrvr.ondigitalocean.app"
echo "Backend will handle: /api/* routes"
echo "Frontend will handle: / and /assets/* routes"

echo ""
echo "🔧 Required Environment Variables in App Platform:"
echo "DB_PASSWORD=YOUR_DATABASE_PASSWORD_HERE"
echo "JWT_SECRET=your_secure_jwt_secret_here"
echo "API_KEY=YOUR_GEMINI_API_KEY_HERE"
echo "API_KEY_2=your_additional_api_key"
echo "API_KEY_3=your_additional_api_key"
echo ""

# Database setup reminder
echo "🗄️ Database Setup Reminder:"
echo "Run this command in your deployment environment:"
echo "mysql -h trackerbi-do-user-17425890-0.m.db.ondigitalocean.com \\"
echo "      -P 25060 \\"
echo "      -u doadmin \\"
echo "      -p\"YOUR_DATABASE_PASSWORD_HERE\" \\"
echo "      defaultdb < server/sql/complete_database_setup.sql"

echo ""
echo "📝 Next Steps:"
echo "1. Copy the updated .do/app.yaml to your DigitalOcean App Platform app"
echo "2. Set the environment variables listed above in App Platform dashboard"
echo "3. Trigger a manual redeploy in App Platform"
echo "4. Test the following endpoints:"
echo "   - Frontend: https://trackerbi-vvrvr.ondigitalocean.app/"
echo "   - Health: https://trackerbi-vvrvr.ondigitalocean.app/health"
echo "   - API: https://trackerbi-vvrvr.ondigitalocean.app/api/auth/login"

echo ""
echo "🎯 Expected Results:"
echo "✅ Frontend loads without HTML-in-JSON errors"
echo "✅ Backend API responds with proper JSON"
echo "✅ Authentication works correctly"
echo "✅ Database connections functional"

echo ""
echo "✅ Configuration is ready for deployment!"
