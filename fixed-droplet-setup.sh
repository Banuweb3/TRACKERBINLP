#!/bin/bash

# 🚀 BPO Analytics Platform - Fixed Droplet Setup Script
# Repository: https://github.com/Banuweb3/TRACKERBINLP.git

set -e

echo "🚀 Starting BPO Analytics Platform setup on Droplet..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

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

# Install Node.js 20.x (required for your project)
print_status "Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
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

# Install Git and other tools
print_status "Installing additional tools..."
sudo apt install git htop curl wget unzip -y

# Create application directory
print_status "Creating application directory..."
sudo mkdir -p /var/www/bpo-analytics
sudo chown $USER:$USER /var/www/bpo-analytics

# Clone your specific repository
print_status "Cloning BPO Analytics repository..."
cd /var/www/bpo-analytics
rm -rf * .*git* 2>/dev/null || true
git clone https://github.com/Banuweb3/TRACKERBINLP.git .

# Setup MySQL database
print_status "Setting up MySQL database..."
sudo mysql -e "CREATE DATABASE IF NOT EXISTS bpo_analytics;"
sudo mysql -e "CREATE USER IF NOT EXISTS 'bpo_user'@'localhost' IDENTIFIED BY 'BpoAnalytics2024!';"
sudo mysql -e "GRANT ALL PRIVILEGES ON bpo_analytics.* TO 'bpo_user'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

print_status "MySQL database 'bpo_analytics' created with user 'bpo_user'"

# Fix package.json for compatibility
print_status "Fixing package.json for compatibility..."
# Remove the problematic musl package
if grep -q "@rollup/rollup-linux-x64-musl" package.json; then
    sed -i '/"@rollup\/rollup-linux-x64-musl"/d' package.json
    print_status "Removed incompatible rollup-linux-x64-musl package"
fi

# Create .npmrc for better compatibility
print_status "Creating .npmrc configuration..."
cat > .npmrc << 'EOF'
optional=false
fund=false
audit=false
engine-strict=false
legacy-peer-deps=true
EOF

# Install frontend dependencies
print_status "Installing frontend dependencies..."
npm install --legacy-peer-deps

print_status "Building frontend..."
npm run build

# Verify frontend build
if [ ! -d "dist" ]; then
    print_error "Frontend build failed - dist directory not found"
    exit 1
fi

# Install backend dependencies
print_status "Installing backend dependencies..."
cd server
npm install

# Create production environment file with your API keys
print_status "Creating production environment file..."
cat > .env << 'EOF'
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

# Your Gemini API keys
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

# Initialize database schema
print_status "Initializing database schema..."
if [ -f "scripts/setupDatabase.js" ]; then
    node scripts/setupDatabase.js
else
    print_warning "Database setup script not found, creating basic structure..."
    # Create a basic database initialization
    mysql -u bpo_user -pBpoAnalytics2024! bpo_analytics << 'SQL'
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  role ENUM('admin', 'analyst', 'user') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);
SQL
fi

# Setup Nginx configuration
print_status "Setting up Nginx configuration..."
sudo tee /etc/nginx/sites-available/bpo-analytics > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;

    # Frontend (React build)
    location / {
        root /var/www/bpo-analytics/dist;
        try_files $uri $uri/ /index.html;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts for file uploads
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

# Get server IP
SERVER_IP=$(curl -s ifconfig.me)

print_status "Setup completed! 🎉"
echo ""
echo "🌐 Your BPO Analytics Platform is now live!"
echo "📍 URL: http://$SERVER_IP"
echo "👤 Default Login:"
echo "   Email: admin@bpo-analytics.com"
echo "   Password: admin123"
echo ""
echo "🔧 Useful commands:"
echo "   Check status: pm2 status"
echo "   View logs: pm2 logs bpo-backend"
echo "   Restart app: pm2 restart bpo-backend"
echo "   Check Nginx: sudo systemctl status nginx"
echo ""
echo "⚠️  IMPORTANT: Change the default admin password after first login!"
echo ""
echo "🎯 Next steps:"
echo "1. Visit http://$SERVER_IP to access your application"
echo "2. Login with the default credentials"
echo "3. Change the admin password"
echo "4. Start analyzing your BPO calls!"
