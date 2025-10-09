#!/bin/bash

# 🚀 Commit Fixed Code and Deploy to DigitalOcean
# This script commits the API fixes and provides deployment instructions

set -e

echo "🔧 Committing API fixes to GitHub..."

# Add all changes
git add .

# Commit with descriptive message
git commit -m "🔧 Fix API URLs: Replace hardcoded localhost:3001 with dynamic detection

- Updated authService.ts to automatically detect API base URL
- Fixed analysisService.ts to use relative URLs in production
- Fixed bulkAnalysisAPI.ts to use relative URLs in production  
- Fixed geminiService.ts to use relative URLs in production
- Added auto-deploy-digitalocean.sh for automated deployment
- Updated .env.production with proper frontend API configuration

This fixes the CORS errors by using /api (Nginx proxy) instead of localhost:3001"

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push origin main || git push origin master

echo "✅ Code pushed to GitHub successfully!"
echo ""
echo "🚀 To deploy on DigitalOcean, run this command on your Droplet:"
echo ""
echo "wget https://raw.githubusercontent.com/Banuweb3/TRACKERBINLP/main/auto-deploy-digitalocean.sh && chmod +x auto-deploy-digitalocean.sh && ./auto-deploy-digitalocean.sh"
echo ""
echo "Or manually:"
echo "1. SSH to your Droplet: ssh root@142.93.222.167"
echo "2. Run: cd /var/www/bpo-analytics && git pull origin main"
echo "3. Run: npm run build && sudo cp -r dist/* /var/www/html/"
echo "4. Run: pm2 restart bpo-backend"
echo ""
echo "🎯 The fixes will:"
echo "✅ Automatically detect if running on DigitalOcean vs localhost"
echo "✅ Use /api (Nginx proxy) in production to avoid CORS errors"
echo "✅ Use localhost:3001 only in development"
echo "✅ Set up database and all services automatically"
echo ""
echo "🌐 Your app will be available at: http://142.93.222.167"
