#!/bin/bash

# BPO Analytics Platform - DigitalOcean Deployment Script
# This script will deploy your application on DigitalOcean droplet

set -e  # Exit on any error

echo "🚀 Starting BPO Analytics Platform deployment on DigitalOcean..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
print_status "Installing required packages..."
sudo apt install -y curl wget git nginx mysql-server ufw

# Install Node.js (Latest LTS)
print_status "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
print_status "Installing PM2..."
sudo npm install -g pm2 serve

# Configure firewall
print_status "Configuring firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw allow 3001/tcp  # Backend API
sudo ufw --force enable

# Setup MySQL
print_status "Setting up MySQL database..."
sudo systemctl start mysql
sudo systemctl enable mysql

# Create database and user
print_status "Creating database and user..."
sudo mysql -e "CREATE DATABASE IF NOT EXISTS bpo_analytics;"
sudo mysql -e "CREATE USER IF NOT EXISTS 'bpo_user'@'localhost' IDENTIFIED BY 'Banu@1234';"
sudo mysql -e "GRANT ALL PRIVILEGES ON bpo_analytics.* TO 'bpo_user'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

# Clone or update repository
print_status "Setting up application code..."
cd /root
if [ -d "TRACKERBINLP" ]; then
    print_status "Updating existing repository..."
    cd TRACKERBINLP
    git pull origin main
else
    print_status "Cloning repository..."
    git clone https://github.com/Banuweb3/TRACKERBINLP.git
    cd TRACKERBINLP
fi

# Setup Backend
print_status "Setting up backend..."
if [ -d "server" ]; then
    cd server
else
    print_error "Server directory not found!"
    exit 1
fi

# Install backend dependencies
npm install

# Create production .env file
print_status "Creating backend environment configuration..."
cat > .env << 'EOL'
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=bpo_user
DB_PASSWORD=Banu@1234
DB_NAME=bpo_analytics

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production_$(date +%s)
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3001
NODE_ENV=production

# CORS Configuration
FRONTEND_URL=http://$(curl -s ifconfig.me)

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Gemini API Keys
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
EOL

# Import database schema if exists
if [ -f "sql/bpo_analytics.sql" ]; then
    print_status "Importing database schema..."
    mysql -u bpo_user -p'Banu@1234' bpo_analytics < sql/bpo_analytics.sql
fi

# Start backend with PM2
print_status "Starting backend server..."
pm2 delete bpo-analytics 2>/dev/null || true
pm2 start npm --name "bpo-analytics" -- start
pm2 save

# Setup Frontend
print_status "Setting up frontend..."
cd /root/TRACKERBINLP

# Install frontend dependencies
npm install

# Create frontend environment file
print_status "Creating frontend environment configuration..."
cat > .env.local << EOL
VITE_API_URL=http://$(curl -s ifconfig.me):3001
GEMINI_API_KEY=AIzaSyDXUV16D4HGO23LuLxgl6jnYlHyxsYpJIY
EOL

# Build frontend
print_status "Building frontend..."
npm run build

# Start frontend with PM2
print_status "Starting frontend server..."
pm2 delete frontend 2>/dev/null || true
pm2 start "serve -s dist -l 3000" --name "frontend"
pm2 save

# Setup PM2 startup
print_status "Setting up PM2 startup..."
pm2 startup
pm2 save

# Configure Nginx (optional)
print_status "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/bpo-analytics << EOL
server {
    listen 80;
    server_name $(curl -s ifconfig.me);

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
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
    }
}
EOL

# Enable Nginx site
sudo ln -sf /etc/nginx/sites-available/bpo-analytics /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# Final status check
print_status "Checking application status..."
sleep 5

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📊 Application URLs:"
echo "   Frontend: http://$(curl -s ifconfig.me)"
echo "   Backend API: http://$(curl -s ifconfig.me):3001"
echo "   Health Check: http://$(curl -s ifconfig.me):3001/health"
echo ""
echo "🔧 Management Commands:"
echo "   View logs: pm2 logs"
echo "   Restart backend: pm2 restart bpo-analytics"
echo "   Restart frontend: pm2 restart frontend"
echo "   Status: pm2 status"
echo ""
echo "🗄️ Database Info:"
echo "   Host: localhost"
echo "   Database: bpo_analytics"
echo "   User: bpo_user"
echo ""

# Test endpoints
print_status "Testing endpoints..."
sleep 2
echo "Backend Health Check:"
curl -s http://localhost:3001/health | jq . 2>/dev/null || curl -s http://localhost:3001/health

echo ""
print_status "Deployment completed successfully! 🚀"

