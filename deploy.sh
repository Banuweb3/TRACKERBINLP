#!/bin/bash

# 🚀 DigitalOcean Deployment Script for BPO Analytics Platform
# Run this script to prepare your project for deployment

echo "🚀 Preparing BPO Analytics Platform for DigitalOcean deployment..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit - BPO Analytics Platform ready for DigitalOcean"
else
    echo "✅ Git repository already initialized"
fi

# Check if package.json has correct scripts
echo "📦 Checking package.json scripts..."

# Frontend package.json check
if grep -q '"start":' package.json; then
    echo "✅ Frontend start script found"
else
    echo "⚠️  Adding start script to frontend package.json"
    # Add start script if missing
fi

# Server package.json check
if [ -f "server/package.json" ]; then
    if grep -q '"start":' server/package.json; then
        echo "✅ Server start script found"
    else
        echo "⚠️  Server start script missing"
    fi
else
    echo "❌ Server package.json not found"
fi

# Check if .do/app.yaml exists
if [ -f ".do/app.yaml" ]; then
    echo "✅ DigitalOcean app configuration found"
else
    echo "❌ DigitalOcean app configuration missing"
    echo "Please create .do/app.yaml file"
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Push your code to GitHub:"
echo "   git remote add origin https://github.com/YOUR_USERNAME/bpo_call_version5.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "2. Go to DigitalOcean App Platform:"
echo "   https://cloud.digitalocean.com/apps"
echo ""
echo "3. Create new app from GitHub repository"
echo ""
echo "4. Follow the DEPLOYMENT_GUIDE.md for detailed instructions"
echo ""
echo "🎉 Your project is ready for DigitalOcean deployment!"
