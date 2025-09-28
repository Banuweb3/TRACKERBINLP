#!/bin/bash

# Complete DigitalOcean Deployment Fix Script
# This script fixes all common deployment issues

set -e
echo "🔧 Starting DigitalOcean deployment fix..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Get server IP
SERVER_IP=$(curl -s ifconfig.me)
log_info "Server IP: $SERVER_IP"

# 1. Clean up existing processes
log_info "Cleaning up existing processes..."
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true
sudo pkill -f node 2>/dev/null || true
sudo pkill -f npm 2>/dev/null || true
sleep 3

# 2. Install/Update required packages
log_info "Installing required packages..."
sudo apt update
sudo apt install -y mysql-server nodejs npm git nginx ufw
sudo npm install -g pm2 serve

# 3. Configure MySQL
log_info "Configuring MySQL..."
sudo systemctl start mysql
sudo systemctl enable mysql

# Create database and user
sudo mysql -e "CREATE DATABASE IF NOT EXISTS bpo_analytics;" 2>/dev/null || true
sudo mysql -e "DROP USER IF EXISTS 'bpo_user'@'localhost';" 2>/dev/null || true
sudo mysql -e "CREATE USER 'bpo_user'@'localhost' IDENTIFIED BY 'Banu@1234';"
sudo mysql -e "GRANT ALL PRIVILEGES ON bpo_analytics.* TO 'bpo_user'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

# Test database connection
log_info "Testing database connection..."
mysql -u bpo_user -p'Banu@1234' -e "SHOW DATABASES;" || {
    log_error "Database connection failed"
    exit 1
}

# 4. Setup application
log_info "Setting up application..."
cd /root

# Clone or update repository
if [ -d "TRACKERBINLP" ]; then
    cd TRACKERBINLP
    git pull origin main
else
    git clone https://github.com/Banuweb3/TRACKERBINLP.git
    cd TRACKERBINLP
fi

# 5. Setup Backend
log_info "Setting up backend..."
cd server

# Create proper .env file
cat > .env << EOF
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=bpo_user
DB_PASSWORD=Banu@1234
DB_NAME=bpo_analytics

# JWT Configuration
JWT_SECRET=bpo_jwt_secret_$(date +%s)_secure_key
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3001
NODE_ENV=production

# CORS Configuration
FRONTEND_URL=http://${SERVER_IP}

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
EOF

# Install backend dependencies
log_info "Installing backend dependencies..."
npm install

# Import database schema if exists
if [ -f "sql/bpo_analytics.sql" ]; then
    log_info "Importing database schema..."
    mysql -u bpo_user -p'Banu@1234' bpo_analytics < sql/bpo_analytics.sql
fi

# 6. Setup Frontend
log_info "Setting up frontend..."
cd /root/TRACKERBINLP

# Create frontend environment
cat > .env.local << EOF
VITE_API_URL=http://${SERVER_IP}:3001
GEMINI_API_KEY=AIzaSyDXUV16D4HGO23LuLxgl6jnYlHyxsYpJIY
EOF

# Install frontend dependencies
log_info "Installing frontend dependencies..."
npm install

# Build frontend
log_info "Building frontend..."
npm run build

# 7. Start services with PM2
log_info "Starting services..."

# Start backend
cd /root/TRACKERBINLP/server
pm2 start npm --name "bpo-analytics" -- start

# Wait for backend to start
sleep 5

# Start frontend
cd /root/TRACKERBINLP
pm2 start "serve -s dist -l 3000" --name "frontend"

# Save PM2 configuration
pm2 save
pm2 startup

# 8. Configure firewall
log_info "Configuring firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp
sudo ufw --force enable

# 9. Configure Nginx reverse proxy
log_info "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/bpo-analytics << EOF
server {
    listen 80;
    server_name ${SERVER_IP};

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
EOF

# Enable Nginx site
sudo ln -sf /etc/nginx/sites-available/bpo-analytics /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# 10. Final checks
log_info "Running final checks..."
sleep 5

echo ""
echo "🎉 Deployment Fix Completed!"
echo ""
echo "📊 Application URLs:"
echo "   Main Site: http://${SERVER_IP}"
echo "   Frontend Direct: http://${SERVER_IP}:3000"
echo "   Backend API: http://${SERVER_IP}:3001"
echo "   Health Check: http://${SERVER_IP}:3001/health"
echo ""

# Test endpoints
log_info "Testing endpoints..."
echo "Backend Health:"
curl -s http://localhost:3001/health 2>/dev/null || echo "❌ Backend not responding"

echo ""
echo "PM2 Status:"
pm2 list

echo ""
log_info "✅ All services should now be working properly!"
echo ""
echo "🔧 Troubleshooting Commands:"
echo "   pm2 logs bpo-analytics    # Backend logs"
echo "   pm2 logs frontend         # Frontend logs"
echo "   pm2 restart all           # Restart all services"
echo "   sudo systemctl status nginx  # Check Nginx"
echo "   mysql -u bpo_user -p'Banu@1234' -e 'SHOW DATABASES;'  # Test DB"
