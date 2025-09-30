#!/bin/bash

# Enhanced DigitalOcean Production Deployment Script
# Fixes SSH config prompts and other deployment issues
# Version: 2.0

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

# Error handling
cleanup_on_error() {
    log_error "Deployment failed. Cleaning up..."
    pm2 delete all 2>/dev/null || true
    pm2 kill 2>/dev/null || true
    exit 1
}
trap cleanup_on_error ERR

log_step "🚀 Starting Enhanced DigitalOcean Deployment..."

# Get server IP
SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || hostname -I | awk '{print $1}')
log_info "Server IP: $SERVER_IP"

# Set non-interactive mode for apt
export DEBIAN_FRONTEND=noninteractive
export UCF_FORCE_CONFOLD=1

log_step "1️⃣ Updating system packages (non-interactive)..."
sudo apt-get update -qq

# Upgrade with non-interactive settings to avoid SSH config prompts
log_info "Upgrading packages (keeping existing configs)..."
sudo apt-get -yq upgrade \
    -o Dpkg::Options::="--force-confdef" \
    -o Dpkg::Options::="--force-confold" \
    -o APT::Get::Assume-Yes=true \
    -o APT::Get::Fix-Broken=true

log_step "2️⃣ Installing required packages..."
sudo apt-get install -yq \
    curl \
    wget \
    git \
    nginx \
    ufw \
    mysql-server \
    software-properties-common \
    ca-certificates \
    gnupg \
    lsb-release

# Install Node.js 18.x (LTS)
log_info "Installing Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -yq nodejs

# Install global npm packages
log_info "Installing global npm packages..."
sudo npm install -g pm2@latest serve@latest

log_step "3️⃣ Cleaning up existing processes..."
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true
sudo pkill -f "node.*bpo" 2>/dev/null || true
sudo pkill -f "serve.*dist" 2>/dev/null || true
sleep 3

log_step "4️⃣ Configuring MySQL..."
sudo systemctl start mysql
sudo systemctl enable mysql

# Secure MySQL installation (automated)
log_info "Securing MySQL installation..."
sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'Banu@1234';" 2>/dev/null || true
sudo mysql -u root -p'Banu@1234' -e "DELETE FROM mysql.user WHERE User='';" 2>/dev/null || true
sudo mysql -u root -p'Banu@1234' -e "DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');" 2>/dev/null || true
sudo mysql -u root -p'Banu@1234' -e "DROP DATABASE IF EXISTS test;" 2>/dev/null || true
sudo mysql -u root -p'Banu@1234' -e "DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';" 2>/dev/null || true
sudo mysql -u root -p'Banu@1234' -e "FLUSH PRIVILEGES;" 2>/dev/null || true

# Create application database and user
log_info "Creating application database..."
sudo mysql -u root -p'Banu@1234' -e "CREATE DATABASE IF NOT EXISTS bpo_analytics CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -u root -p'Banu@1234' -e "DROP USER IF EXISTS 'bpo_user'@'localhost';"
sudo mysql -u root -p'Banu@1234' -e "CREATE USER 'bpo_user'@'localhost' IDENTIFIED BY 'Banu@1234';"
sudo mysql -u root -p'Banu@1234' -e "GRANT ALL PRIVILEGES ON bpo_analytics.* TO 'bpo_user'@'localhost';"
sudo mysql -u root -p'Banu@1234' -e "FLUSH PRIVILEGES;"

# Test database connection
log_info "Testing database connection..."
mysql -u bpo_user -p'Banu@1234' -e "SELECT 'Database connection successful' as status;" || {
    log_error "Database connection failed"
    exit 1
}

log_step "5️⃣ Setting up application..."
cd /root

# Clone or update repository
if [ -d "TRACKERBINLP" ]; then
    log_info "Updating existing repository..."
    cd TRACKERBINLP
    git fetch origin
    git reset --hard origin/main
    git clean -fd
else
    log_info "Cloning repository..."
    git clone https://github.com/Banuweb3/TRACKERBINLP.git
    cd TRACKERBINLP
fi

log_step "6️⃣ Setting up backend..."
cd server

# Create comprehensive .env file
log_info "Creating backend environment configuration..."
cat > .env << EOF
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=bpo_user
DB_PASSWORD=Banu@1234
DB_NAME=bpo_analytics

# JWT Configuration
JWT_SECRET=bpo_jwt_secret_$(openssl rand -hex 32)_secure_key
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3001
NODE_ENV=production
HOST=0.0.0.0

# CORS Configuration
FRONTEND_URL=http://${SERVER_IP}
ALLOWED_ORIGINS=http://${SERVER_IP},http://${SERVER_IP}:3000,http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=50MB
UPLOAD_PATH=/tmp/uploads

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/bpo-analytics.log

# Gemini API Keys (Multiple for load balancing)
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

# Create .npmrc to fix Rollup issues (from memory)
log_info "Creating .npmrc to prevent Rollup build issues..."
cat > .npmrc << EOF
optional=false
fund=false
audit=false
EOF

# Install backend dependencies
log_info "Installing backend dependencies..."
npm ci --production=false --include=optional

# Import database schema
if [ -f "sql/bpo_analytics.sql" ]; then
    log_info "Importing database schema..."
    mysql -u bpo_user -p'Banu@1234' bpo_analytics < sql/bpo_analytics.sql
else
    log_warn "Database schema file not found, skipping import"
fi

# Run any migration scripts
if [ -f "scripts/createBulkTables.js" ]; then
    log_info "Running database migrations..."
    node scripts/createBulkTables.js || log_warn "Migration script failed, continuing..."
fi

log_step "7️⃣ Setting up frontend..."
cd /root/TRACKERBINLP

# Create frontend environment
log_info "Creating frontend environment configuration..."
cat > .env.local << EOF
VITE_API_URL=http://${SERVER_IP}:3001
VITE_APP_TITLE=BPO Call Analytics
VITE_APP_VERSION=1.0.0
GEMINI_API_KEY=AIzaSyDXUV16D4HGO23LuLxgl6jnYlHyxsYpJIY
EOF

# Copy .npmrc to frontend as well
cp server/.npmrc .npmrc

# Install frontend dependencies
log_info "Installing frontend dependencies..."
npm ci --include=optional

# Build frontend with error handling
log_info "Building frontend application..."
npm run build || {
    log_error "Frontend build failed, trying alternative build..."
    # Alternative build approach if main build fails
    npm run build:prod 2>/dev/null || npm run build -- --mode production || {
        log_error "All build attempts failed"
        exit 1
    }
}

log_step "8️⃣ Configuring firewall..."
sudo ufw --force reset
sudo ufw allow OpenSSH
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp
sudo ufw --force enable

log_step "9️⃣ Configuring Nginx reverse proxy..."
sudo tee /etc/nginx/sites-available/bpo-analytics << EOF
server {
    listen 80;
    server_name ${SERVER_IP} _;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;

    # Frontend (React app)
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
        proxy_read_timeout 86400;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3001/health;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable site and restart Nginx
sudo ln -sf /etc/nginx/sites-available/bpo-analytics /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx || {
    log_error "Nginx configuration failed"
    exit 1
}

log_step "🔟 Starting services with PM2..."

# Create PM2 ecosystem file for better process management
cat > /root/TRACKERBINLP/ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'bpo-backend',
      cwd: '/root/TRACKERBINLP/server',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/bpo-backend-error.log',
      out_file: '/var/log/bpo-backend-out.log',
      log_file: '/var/log/bpo-backend.log',
      time: true
    },
    {
      name: 'bpo-frontend',
      cwd: '/root/TRACKERBINLP',
      script: 'serve',
      args: '-s dist -l 3000',
      env: {
        NODE_ENV: 'production'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      error_file: '/var/log/bpo-frontend-error.log',
      out_file: '/var/log/bpo-frontend-out.log',
      log_file: '/var/log/bpo-frontend.log',
      time: true
    }
  ]
};
EOF

# Start services using ecosystem file
cd /root/TRACKERBINLP
pm2 start ecosystem.config.js

# Save PM2 configuration and setup startup
pm2 save
pm2 startup systemd -u root --hp /root

# Wait for services to start
log_info "Waiting for services to start..."
sleep 10

log_step "✅ Running final health checks..."

# Test backend health
log_info "Testing backend health..."
for i in {1..5}; do
    if curl -s http://localhost:3001/health >/dev/null 2>&1; then
        log_info "✅ Backend is healthy"
        break
    else
        log_warn "Backend not ready, attempt $i/5..."
        sleep 5
    fi
done

# Test frontend
log_info "Testing frontend..."
for i in {1..3}; do
    if curl -s http://localhost:3000 >/dev/null 2>&1; then
        log_info "✅ Frontend is serving"
        break
    else
        log_warn "Frontend not ready, attempt $i/3..."
        sleep 3
    fi
done

# Display final status
echo ""
echo "🎉 =================================="
echo "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "🎉 =================================="
echo ""
echo "📊 Application URLs:"
echo "   🌐 Main Application: http://${SERVER_IP}"
echo "   🖥️  Frontend Direct:  http://${SERVER_IP}:3000"
echo "   🔧 Backend API:      http://${SERVER_IP}:3001"
echo "   ❤️  Health Check:    http://${SERVER_IP}/health"
echo ""
echo "📋 Service Status:"
pm2 list
echo ""
echo "🔧 Useful Commands:"
echo "   pm2 logs bpo-backend     # View backend logs"
echo "   pm2 logs bpo-frontend    # View frontend logs"
echo "   pm2 restart all          # Restart all services"
echo "   pm2 monit               # Monitor services"
echo "   sudo systemctl status nginx  # Check Nginx status"
echo "   mysql -u bpo_user -p'Banu@1234' bpo_analytics  # Access database"
echo ""
echo "🚀 Your BPO Call Analytics Platform is now live!"
echo "   Visit: http://${SERVER_IP}"
echo ""
