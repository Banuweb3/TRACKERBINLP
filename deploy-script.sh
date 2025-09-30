#!/bin/bash

# DigitalOcean Deployment Script for BPO Analytics Platform
# Run this script on your DigitalOcean droplet as root

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run this script as root (use sudo)"
    exit 1
fi

print_status "Starting BPO Analytics Platform deployment on DigitalOcean..."

# Update system
print_status "Updating system packages..."
apt update && apt upgrade -y

# Install required packages
print_status "Installing required packages..."
apt install -y curl wget git nginx mysql-server software-properties-common

# Install Node.js 18+
print_status "Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install PM2 globally
npm install -g pm2

# Verify installations
print_status "Verifying installations..."
node --version
npm --version
mysql --version
nginx -v

# Setup MySQL
print_status "Setting up MySQL database..."
mysql -e "CREATE DATABASE IF NOT EXISTS bpo_analytics;" || print_warning "Database might already exist"
mysql -e "DROP USER IF EXISTS 'bpo_user'@'localhost';" || print_warning "User might not exist"
mysql -e "CREATE USER 'bpo_user'@'localhost' IDENTIFIED BY 'Banu@1234';"
mysql -e "GRANT ALL PRIVILEGES ON bpo_analytics.* TO 'bpo_user'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

print_success "MySQL database 'bpo_analytics' created with user 'bpo_user'"

# Clone repository
print_status "Cloning BPO Analytics repository..."
cd /var/www
if [ -d "bpo-analytics" ]; then
    print_warning "Directory exists, updating..."
    cd bpo-analytics
    git pull origin main
else
    git clone https://github.com/Banuweb3/TRACKERBINLP.git bpo-analytics
    cd bpo-analytics
fi

# Setup backend
print_status "Setting up backend..."
cd server
npm install

# Create production environment file if it doesn't exist
if [ ! -f ".env.production" ]; then
    print_status "Creating .env.production file..."
    cat > .env.production << 'EOF'
# Database Configuration
DB_HOST=localhost
DB_USER=bpo_user
DB_PASSWORD=Banu@1234
DB_NAME=bpo_analytics
DB_PORT=3306

# Server Configuration
NODE_ENV=production
PORT=3001
FRONTEND_URL=http://localhost

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-change-this-in-production

# Facebook/Instagram API Configuration
FACEBOOK_ACCESS_TOKEN=EAAR4Qlwlv10BPUPtkc8MAYIhKpTRDO7u91ZAb3Sl2ltWD8jHBTvZCTAwJGExZCSgsOcZAWryHsyPwZABHbe9PajGDudjE62jZB3uD7EuMdRYpOPH2bl0p1MoEcIEAZCIvKPz2iO8dd0dXlfKJ7I7PKtTzkv4k1AiW7lz9n9gjaXzhdzzztyLuZBJZCN8ltHMNTQFf
FACEBOOK_APP_SECRET=ae57700e20903c511cff0fdb5b6e5f16
FACEBOOK_APP_ID=your_app_id_here

# Facebook Ad Accounts
FACEBOOK_AD_ACCOUNT_INSTAGRAM=act_837599231811269
FACEBOOK_AD_ACCOUNT_FACEBOOK=act_782436794463558

# Facebook Page Tokens
FACEBOOK_PAGE_HARISHSHOPPY_ID=613327751869662
FACEBOOK_PAGE_HARISHSHOPPY_TOKEN=EAAR4Qlwlv10BPXWTfwPAYdnrYhZBBnsFfQZBFUTBk4hJDya6mTisY3bZBSYVGNZCv7Ord9dkApwIkmZBZBXrDwYI8ikrc1Nz8iZBsaw71p00ECWUM1TRqWzUKmhu2sUTPmGI6vSMzDSPArZAokpCpZCZCemQosEZAbTmAW25VT9sKtc8jnw4MkQn8ewkK1V7ZB6Ycax2yKuxUKT7A5HxyjLxdevXvNf7y6UeAwZBHhmqA6ZAkZD

FACEBOOK_PAGE_ADAMANDEVE_ID=665798336609925
FACEBOOK_PAGE_ADAMANDEVE_TOKEN=EAAR4Qlwlv10BPYE9lrIiThaS7zziBrfMkAFXBDRl9egwvyEw9KE2ORsoVeMLheKXIXTZAgrjHvZBOChBrSW402fQ99vVLc3a1ZAVlTJTnsqAARrV3ZAaupV2bZAW3Bxyt9r8f3SCjW62PwDOyZCyZB2lgP085A2Gl4H208G8o3MTaCQvQa4tM0uHSzWJEsrDIBtDZAEQ23MzgQjCdu4NPVNLgEob3GbIAaavvN9IYZCkzvgZDZD

# Google API Keys
API_KEY_1=AIzaSyBPCrAqcOqvYwkRbOBBM8NSg6F7zVknctQ
API_KEY_2=AIzaSyD59F_syDjDQHm1IO8mgKkiUYOsCGcQ95c
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
    print_success "Created .env.production with your tokens"
else
    print_warning ".env.production already exists, skipping creation"
fi

# Initialize database
print_status "Initializing database..."
npm run init-db || print_warning "Database initialization might have failed"

# Setup frontend
print_status "Setting up frontend..."
cd /var/www/bpo-analytics

# Create .npmrc for better compatibility
cat > .npmrc << 'EOF'
optional=false
fund=false
audit=false
engine-strict=false
legacy-peer-deps=true
EOF

npm install --legacy-peer-deps
npm run build

# Verify frontend build
if [ ! -d "dist" ]; then
    print_error "Frontend build failed - dist directory not found"
    exit 1
fi

print_success "Frontend built successfully"

# Setup Nginx
print_status "Configuring Nginx..."
cat > /etc/nginx/sites-available/bpo-analytics << 'EOF'
server {
    listen 80;
    server_name _;
    
    # Frontend (React app)
    location / {
        root /var/www/bpo-analytics/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/bpo-analytics /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Restart Nginx
systemctl restart nginx
systemctl enable nginx

print_success "Nginx configured and started"

# Setup PM2 ecosystem
print_status "Setting up PM2 process manager..."
cd /var/www/bpo-analytics/server

cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'bpo-analytics-server',
    script: 'server.js',
    cwd: '/var/www/bpo-analytics/server',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: '/var/log/bpo-analytics/error.log',
    out_file: '/var/log/bpo-analytics/out.log',
    log_file: '/var/log/bpo-analytics/combined.log'
  }]
};
EOF

# Create log directory
mkdir -p /var/log/bpo-analytics

# Start application with PM2
pm2 start ecosystem.config.js
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd -u root --hp /root

print_success "PM2 configured and application started"

# Setup firewall
print_status "Configuring firewall..."
ufw --force reset
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

print_success "Firewall configured"

# Get server IP
SERVER_IP=$(curl -s http://checkip.amazonaws.com)

print_success "🎉 Deployment completed successfully!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}Your BPO Analytics Platform is now live!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${BLUE}🌐 Frontend URL:${NC} http://$SERVER_IP"
echo -e "${BLUE}🔧 API Health:${NC} http://$SERVER_IP/health"
echo -e "${BLUE}📊 Meta Dashboard:${NC} http://$SERVER_IP/api/meta/health"
echo ""
echo -e "${YELLOW}📋 Management Commands:${NC}"
echo "  pm2 status                    # Check application status"
echo "  pm2 logs bpo-analytics-server # View application logs"
echo "  pm2 restart bpo-analytics-server # Restart application"
echo "  systemctl status nginx        # Check Nginx status"
echo ""
echo -e "${YELLOW}🔍 Troubleshooting:${NC}"
echo "  - Check logs: pm2 logs"
echo "  - Test API: curl http://localhost:3001/health"
echo "  - Check database: mysql -u bpo_user -p bpo_analytics"
echo ""
echo -e "${GREEN}✅ Features Available:${NC}"
echo "  - BPO Call Analytics"
echo "  - Meta Dashboard (Facebook/Instagram)"
echo "  - User Authentication"
echo "  - Real-time Data Processing"
echo ""
print_warning "Remember to:"
print_warning "1. Update FRONTEND_URL in .env.production to your domain/IP"
print_warning "2. Setup SSL certificate for production use"
print_warning "3. Configure domain name if you have one"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
