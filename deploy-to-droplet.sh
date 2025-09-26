#!/bin/bash

# 🚀 BPO Analytics Platform - Deployment Script for Droplet
# Run this script to deploy updates to your Droplet

set -e

echo "🚀 Deploying BPO Analytics Platform updates..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Navigate to project directory
cd /var/www/bpo-analytics

# Pull latest changes
print_status "Pulling latest changes from GitHub..."
git pull origin main

# Update frontend
print_status "Installing frontend dependencies..."
npm install

print_status "Building frontend..."
npm run build

# Update backend
print_status "Installing backend dependencies..."
cd server
npm install

# Restart backend application
print_status "Restarting backend application..."
pm2 restart bpo-backend

# Reload Nginx
print_status "Reloading Nginx..."
sudo systemctl reload nginx

print_status "Deployment completed! 🎉"

# Show status
echo ""
echo "📊 Application Status:"
pm2 status
echo ""
echo "🌐 Application URL: http://$(curl -s ifconfig.me)"
