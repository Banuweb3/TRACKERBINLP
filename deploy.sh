#!/bin/bash

# BPO Analytics Platform - Complete Deployment Script
# This script sets up the entire application on a fresh Ubuntu/Debian server

echo "🚀 Starting BPO Analytics Platform Deployment..."

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Node.js (LTS version)
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
apt install -y nodejs

# Install PM2 globally
echo "📦 Installing PM2..."
npm install -g pm2

# Install Nginx
echo "📦 Installing Nginx..."
apt install -y nginx

# Install MySQL Server
echo "📦 Installing MySQL Server..."
apt install -y mysql-server

# Create database and user
echo "🗄️ Setting up database..."
mysql -e "CREATE DATABASE IF NOT EXISTS bpo_analytics;"
mysql -e "CREATE USER IF NOT EXISTS 'bpo_user'@'localhost' IDENTIFIED BY 'SecurePassword123!';"
mysql -e "GRANT ALL PRIVILEGES ON bpo_analytics.* TO 'bpo_user'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

# Clone or update the application
if [ ! -d "TRACKERBINLP" ]; then
    echo "📦 Cloning repository..."
    git clone https://github.com/Banuweb3/TRACKERBINLP.git
    cd TRACKERBINLP
else
    echo "📦 Updating repository..."
    cd TRACKERBINLP
    git pull origin main
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Build frontend
echo "🔨 Building frontend..."
npm run build

# Setup environment variables
echo "⚙️ Setting up environment variables..."
cat > .env << EOL
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=bpo_analytics
DB_USER=bpo_user
DB_PASSWORD=SecurePassword123!

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3001
NODE_ENV=production

# CORS Configuration
FRONTEND_URL=http://$(curl -s ifconfig.me)
EOL

# Copy Nginx configuration
echo "🌐 Setting up Nginx..."
cp nginx.conf /etc/nginx/sites-available/bpo-analytics
ln -sf /etc/nginx/sites-available/bpo-analytics /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Create systemd service for the application
echo "⚙️ Creating systemd service..."
cat > /etc/systemd/system/bpo-analytics.service << EOL
[Unit]
Description=BPO Analytics Platform
After=network.target mysql.service

[Service]
Type=simple
User=root
WorkingDirectory=/root/TRACKERBINLP
ExecStart=/usr/bin/node server/droplet-server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOL

# Enable and start services
echo "🚀 Starting services..."
systemctl daemon-reload
systemctl enable bpo-analytics
systemctl start bpo-analytics
systemctl restart nginx

# Wait for services to start
sleep 10

# Test the deployment
echo "🧪 Testing deployment..."
echo "Health check:"
curl -f http://localhost:3001/health || echo "❌ Health check failed"

echo "Session creation test:"
curl -X POST http://localhost:3001/api/analysis/sessions \
  -H "Content-Type: application/json" \
  -d '{"sessionName": "test", "sourceLanguage": "en"}' | jq . || echo "❌ Session creation failed"

echo "🎉 Deployment completed!"
echo "🌐 Your application should be available at: http://$(curl -s ifconfig.me)"
echo ""
echo "📋 Next steps:"
echo "1. Update the database password in .env file"
echo "2. Update JWT secret in .env file"
echo "3. Set up HTTPS with certbot if needed: certbot --nginx -d yourdomain.com"
echo "4. Test audio upload functionality"
echo ""
echo "✅ BPO Analytics Platform is ready!"
