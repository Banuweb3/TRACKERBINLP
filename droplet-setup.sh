#!/bin/bash

# 🚀 BPO Analytics Platform - Droplet Setup Script
# Run this script on your Ubuntu 22.04 Droplet

set -e  # Exit on any error

echo "🚀 Starting BPO Analytics Platform setup on Droplet..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
print_status "Installing Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js installation
node_version=$(node --version)
npm_version=$(npm --version)
print_status "Node.js installed: $node_version"
print_status "npm installed: $npm_version"

# Install MySQL Server
print_status "Installing MySQL Server..."
sudo apt install mysql-server -y

# Secure MySQL installation
print_status "Securing MySQL installation..."
sudo mysql_secure_installation

# Install PM2 (Process Manager)
print_status "Installing PM2 process manager..."
sudo npm install -g pm2

# Install Nginx
print_status "Installing Nginx web server..."
sudo apt install nginx -y

# Install Git
print_status "Installing Git..."
sudo apt install git -y

# Install other useful tools
print_status "Installing additional tools..."
sudo apt install htop curl wget unzip -y

# Create application directory
print_status "Creating application directory..."
sudo mkdir -p /var/www/bpo-analytics
sudo chown $USER:$USER /var/www/bpo-analytics

# Clone your repository
print_status "Cloning BPO Analytics repository..."
cd /var/www/bpo-analytics
git clone https://github.com/Banuweb3/TRACKERBINLP.git .

# Setup MySQL database
print_status "Setting up MySQL database..."
sudo mysql -e "CREATE DATABASE IF NOT EXISTS bpo_analytics;"
sudo mysql -e "CREATE USER IF NOT EXISTS 'bpo_user'@'localhost' IDENTIFIED BY 'BpoAnalytics2024!';"
sudo mysql -e "GRANT ALL PRIVILEGES ON bpo_analytics.* TO 'bpo_user'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

print_status "MySQL database 'bpo_analytics' created with user 'bpo_user'"

# Install frontend dependencies and build
print_status "Installing frontend dependencies..."
npm install

print_status "Building frontend..."
npm run build

# Install backend dependencies
print_status "Installing backend dependencies..."
cd server
npm install

# Create production environment file
print_status "Creating production environment file..."
cat > .env << EOF
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=bpo_user
DB_PASSWORD=BpoAnalytics2024!
DB_NAME=bpo_analytics
JWT_SECRET=your_super_secure_jwt_secret_key_here_make_it_long_and_random_for_production_$(date +%s)
FRONTEND_URL=http://your-domain.com
CORS_ORIGIN=http://your-domain.com

# Add your Gemini API keys here
API_KEY=AIzaSyA87I2mshoMLktcbPdFvI1v2VAvo2SdK2E
API_KEY_2=AIzaSyDXUV16D4HGO23LuLxgl6jnYlHyxsYpJIY
API_KEY_3=AIzaSyBdWERbTOAFv6AGFlm7IGDNowkR8gafewA
API_KEY_4=AIzaSyCUedUoOlq40hxDUwfWpBE2oCOOzezGkpc
API_KEY_5=AIzaSyBrnFs-PM_Z-qN-simcLFrGODm0o1ixdvc                
API_KEY_6=AIzaSyBPCrAqcOqvYwkRbOBBM8NSg6F7zVknctQ
API_KEY_7=AIzaSyD59F_syDjDQHm1IO8mgKkiUYOsCGcQ95c
API_KEY_8=AIzaSyAPBoSN5v_3AMbDO6j2NdigroEAmHbRXGc
API_KEY_9=AIzaSyCHU0rqhEhxPlFVD0z-LiDOhZ8HRgkiwv4
API_KEY_10=AIzaSyDARNXwY5iSYT1VL96Ihmuhmc1WzSIRsOI
API_KEY_11=AIzaSyD0NMjjLZLtgN-6sEQYuqvVnggRsfE_d8U
EOF

print_warning "Please edit /var/www/bpo-analytics/server/.env and add your actual API keys!"

# Initialize database schema
print_status "Initializing database schema..."
node scripts/setupDatabase.js

# Setup Nginx configuration
print_status "Setting up Nginx configuration..."
sudo tee /etc/nginx/sites-available/bpo-analytics > /dev/null << EOF
server {
    listen 80;
    server_name _;  # Replace with your domain

    # Frontend (React build)
    location / {
        root /var/www/bpo-analytics/dist;
        try_files \$uri \$uri/ /index.html;
        
        # Add security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Increase timeout for file uploads
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3001/health;
        access_log off;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        root /var/www/bpo-analytics/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/bpo-analytics /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Setup firewall
print_status "Configuring firewall..."
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Start the backend application with PM2
print_status "Starting backend application..."
cd /var/www/bpo-analytics/server
pm2 start server.js --name "bpo-backend" --env production

# Save PM2 configuration
pm2 save
pm2 startup

print_status "Setup completed! 🎉"
echo ""
echo "📋 Next Steps:"
echo "1. Edit /var/www/bpo-analytics/server/.env and add your Gemini API keys"
echo "2. If you have a domain, update the server_name in /etc/nginx/sites-available/bpo-analytics"
echo "3. Restart Nginx: sudo systemctl restart nginx"
echo "4. Check application status: pm2 status"
echo "5. View logs: pm2 logs bpo-backend"
echo ""
echo "🌐 Your application should be accessible at: http://$(curl -s ifconfig.me)"
echo ""
echo "🔧 Useful commands:"
echo "  - Restart backend: pm2 restart bpo-backend"
echo "  - View logs: pm2 logs"
echo "  - Check Nginx: sudo nginx -t && sudo systemctl status nginx"
echo "  - Check MySQL: sudo systemctl status mysql"
