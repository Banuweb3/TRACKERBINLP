#!/bin/bash

# Quick BPO Analytics Deployment for DigitalOcean
# Run this script on your DigitalOcean droplet

echo "🚀 Quick deployment starting..."

# Get server IP
SERVER_IP=$(curl -s ifconfig.me)

# Stop existing PM2 processes
pm2 delete all 2>/dev/null || true

# Navigate to project directory
cd /root/TRACKERBINLP || { echo "❌ Project directory not found"; exit 1; }

# Pull latest changes
git pull origin main

# Update backend environment
cd server
cat > .env << EOF
DB_HOST=localhost
DB_PORT=3306
DB_USER=bpo_user
DB_PASSWORD=Banu@1234
DB_NAME=bpo_analytics
JWT_SECRET=jwt_secret_$(date +%s)
JWT_EXPIRES_IN=24h
PORT=3001
NODE_ENV=production
FRONTEND_URL=http://${SERVER_IP}
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
API_KEY=AIzaSyDXUV16D4HGO23LuLxgl6jnYlHyxsYpJIY
API_KEY_2=AIzaSyDARNXwY5iSYT1VL96Ihmuhmc1WzSIRsOI
API_KEY_3=AIzaSyBPCrAqcOqvYwkRbOBBM8NSg6F7zVknctQ
API_KEY_4=AIzaSyCUedUoOlq40hxDUwfWpBE2oCOOzezGkpc
API_KEY_5=AIzaSyBrnFs-PM_Z-qN-simcLFrGODm0o1ixdvc
API_KEY_6=AIzaSyBPCrAqcOqvYwkRbOBBM8NSg6F7zVknctQ
API_KEY_7=AIzaSyD59F_syDjDQHm1IO8mgKkiUYOsCGcQ95c
API_KEY_8=AIzaSyAPBoSN5v_3AMbDO6j2NdigroEAmHbRXGc
API_KEY_9=AIzaSyCHU0rqhEhxPlFVD0z-LiDOhZ8HRgkiwv4
API_KEY_10=AIzaSyDARNXwY5iSYT1VL96Ihmuhmc1WzSIRsOI
API_KEY_11=AIzaSyD0NMjjLZLtgN-6sEQYuqvVnggRsfE_d8U
API_KEY_12=AIzaSyAPBoSN5v_3AMbDO6j2NdigroEAmHbRXGc
API_KEY_13=AIzaSyARSlSfk5DPr9zliOsSylmKF9qsdCSbiDk
EOF

# Install backend dependencies
npm install

# Start backend
pm2 start npm --name "bpo-analytics" -- start

# Setup frontend
cd /root/TRACKERBINLP

# Create frontend environment
cat > .env.local << EOF
VITE_API_URL=http://${SERVER_IP}:3001
GEMINI_API_KEY=AIzaSyDXUV16D4HGO23LuLxgl6jnYlHyxsYpJIY
EOF

# Install frontend dependencies and build
npm install
npm run build

# Start frontend
pm2 start "serve -s dist -l 3000" --name "frontend"

# Save PM2 configuration
pm2 save

echo "✅ Deployment completed!"
echo "🌐 Frontend: http://${SERVER_IP}:3000"
echo "🔧 Backend: http://${SERVER_IP}:3001"
echo "📊 Health: http://${SERVER_IP}:3001/health"

# Test the deployment
sleep 3
echo "🧪 Testing backend..."
curl -s http://localhost:3001/health || echo "❌ Backend test failed"

echo "📋 PM2 Status:"
pm2 list
