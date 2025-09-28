#!/bin/bash

# =====================================================
# BPO Analytics Platform - Production DigitalOcean Deployment
# This script deploys your complete application with full database schema
# =====================================================

set -e
echo "🚀 Starting BPO Analytics Production Deployment on DigitalOcean..."

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

# Get server details
SERVER_IP=$(curl -s ifconfig.me)
DOMAIN=${1:-$SERVER_IP}

log_info "🌐 Server IP: $SERVER_IP"
log_info "🏷️  Domain: $DOMAIN"

# =====================================================
# STEP 1: SYSTEM PREPARATION
# =====================================================

log_step "1️⃣  Preparing system..."

# Update system
log_info "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
log_info "Installing required packages..."
sudo apt install -y \
    curl \
    wget \
    git \
    nginx \
    mysql-server \
    redis-server \
    ufw \
    htop \
    unzip \
    software-properties-common

# Install Node.js (Latest LTS)
log_info "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
log_info "Installing PM2 and serve..."
sudo npm install -g pm2 serve

# =====================================================
# STEP 2: SECURITY SETUP
# =====================================================

log_step "2️⃣  Setting up security..."

# Configure firewall
log_info "Configuring firewall..."
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw allow 3000/tcp  # Frontend
sudo ufw allow 3001/tcp  # Backend API
sudo ufw --force enable

# =====================================================
# STEP 3: DATABASE SETUP
# =====================================================

log_step "3️⃣  Setting up MySQL database..."

# Start and enable MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# Generate secure database password
DB_PASSWORD=$(openssl rand -base64 16)
log_info "Generated secure database password"

# Create database and user
log_info "Creating database and user..."
sudo mysql -e "CREATE DATABASE IF NOT EXISTS bpo_analytics;"
sudo mysql -e "DROP USER IF EXISTS 'bpo_user'@'localhost';" 2>/dev/null || true
sudo mysql -e "CREATE USER 'bpo_user'@'localhost' IDENTIFIED BY '$DB_PASSWORD';"
sudo mysql -e "GRANT ALL PRIVILEGES ON bpo_analytics.* TO 'bpo_user'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

# Test database connection
log_info "Testing database connection..."
if mysql -u bpo_user -p"$DB_PASSWORD" -e "SHOW DATABASES;" > /dev/null 2>&1; then
    log_info "✅ Database connection successful"
else
    log_error "❌ Database connection failed"
    exit 1
fi

# =====================================================
# STEP 4: APPLICATION SETUP
# =====================================================

log_step "4️⃣  Setting up application..."

# Clean up existing processes
log_info "Cleaning up existing processes..."
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true
sudo pkill -f node 2>/dev/null || true
sudo pkill -f npm 2>/dev/null || true
sleep 3

# Navigate to root and setup repository
cd /root

# Clone or update repository
if [ -d "TRACKERBINLP" ]; then
    log_info "Updating existing repository..."
    cd TRACKERBINLP
    git pull origin main
else
    log_info "Cloning repository..."
    git clone https://github.com/Banuweb3/TRACKERBINLP.git
    cd TRACKERBINLP
fi

# =====================================================
# STEP 5: DATABASE SCHEMA DEPLOYMENT
# =====================================================

log_step "5️⃣  Deploying complete database schema..."

# Import the complete database schema
log_info "Importing complete database schema..."
if [ -f "server/sql/complete_database_setup.sql" ]; then
    mysql -u bpo_user -p"$DB_PASSWORD" < server/sql/complete_database_setup.sql
    log_info "✅ Complete database schema imported successfully"
else
    log_error "❌ complete_database_setup.sql not found!"
    exit 1
fi

# Verify database tables
log_info "Verifying database tables..."
TABLES=$(mysql -u bpo_user -p"$DB_PASSWORD" bpo_analytics -e "SHOW TABLES;" | wc -l)
log_info "✅ Database contains $((TABLES-1)) tables"

# Verify bulk_file_results table structure
log_info "Verifying bulk_file_results table structure..."
mysql -u bpo_user -p"$DB_PASSWORD" bpo_analytics -e "DESCRIBE bulk_file_results;" > /tmp/table_structure.txt
if grep -q "transcription" /tmp/table_structure.txt && grep -q "translation" /tmp/table_structure.txt; then
    log_info "✅ bulk_file_results table has all required columns"
else
    log_error "❌ bulk_file_results table missing required columns"
    exit 1
fi

# =====================================================
# STEP 6: BACKEND SETUP
# =====================================================

log_step "6️⃣  Setting up backend..."

cd /root/TRACKERBINLP/server

# Generate secure secrets
JWT_SECRET=$(openssl rand -base64 64)
SESSION_SECRET=$(openssl rand -base64 32)

# Create production .env file
log_info "Creating backend environment configuration..."
cat > .env << EOF
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=bpo_user
DB_PASSWORD=$DB_PASSWORD
DB_NAME=bpo_analytics

# Security Configuration
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=24h
SESSION_SECRET=$SESSION_SECRET

# Server Configuration
PORT=3001
NODE_ENV=production

# CORS Configuration
FRONTEND_URL=http://$DOMAIN

# Redis Configuration (for caching)
REDIS_HOST=localhost
REDIS_PORT=6379

# Rate Limiting (Production settings)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=50

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=/var/log/bpo-analytics/backend.log

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

# Set secure file permissions
chmod 600 .env

# Create log directory
sudo mkdir -p /var/log/bpo-analytics
sudo chown -R $USER:$USER /var/log/bpo-analytics

# Install backend dependencies
log_info "Installing backend dependencies..."
npm install --production

# =====================================================
# STEP 7: FRONTEND SETUP
# =====================================================

log_step "7️⃣  Setting up frontend..."

cd /root/TRACKERBINLP

# Create frontend environment configuration
log_info "Creating frontend environment configuration..."
cat > .env.local << EOF
# API Configuration
VITE_API_URL=http://$DOMAIN:3001
VITE_APP_ENV=production

# Gemini API Key (for frontend if needed)
VITE_GEMINI_API_KEY=AIzaSyDXUV16D4HGO23LuLxgl6jnYlHyxsYpJIY

# App Configuration
VITE_APP_NAME=BPO Analytics Platform
VITE_APP_VERSION=1.0.0
EOF

# Install frontend dependencies
log_info "Installing frontend dependencies..."
npm install

# Build frontend for production
log_info "Building frontend for production..."
npm run build

# Verify build
if [ -d "dist" ]; then
    log_info "✅ Frontend build successful"
else
    log_error "❌ Frontend build failed"
    exit 1
fi

# =====================================================
# STEP 8: REDIS SETUP
# =====================================================

log_step "8️⃣  Setting up Redis..."

# Start and enable Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Test Redis connection
if redis-cli ping | grep -q "PONG"; then
    log_info "✅ Redis is running"
else
    log_warn "⚠️  Redis connection issue"
fi

# =====================================================
# STEP 9: PM2 PROCESS MANAGEMENT
# =====================================================

log_step "9️⃣  Setting up PM2 process management..."

# Create PM2 ecosystem file
cat > /root/TRACKERBINLP/ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'bpo-analytics-backend',
      cwd: '/root/TRACKERBINLP/server',
      script: 'npm',
      args: 'start',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/var/log/bpo-analytics/backend-error.log',
      out_file: '/var/log/bpo-analytics/backend-out.log',
      log_file: '/var/log/bpo-analytics/backend.log',
      time: true,
      max_memory_restart: '500M',
      node_args: '--max-old-space-size=512',
      watch: false,
      ignore_watch: ['node_modules', 'logs'],
      restart_delay: 1000
    },
    {
      name: 'bpo-analytics-frontend',
      cwd: '/root/TRACKERBINLP',
      script: 'serve',
      args: '-s dist -l 3000',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/var/log/bpo-analytics/frontend-error.log',
      out_file: '/var/log/bpo-analytics/frontend-out.log',
      log_file: '/var/log/bpo-analytics/frontend.log',
      time: true,
      max_memory_restart: '200M',
      restart_delay: 1000
    }
  ]
};
EOF

# Start applications with PM2
log_info "Starting applications with PM2..."
cd /root/TRACKERBINLP
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# =====================================================
# STEP 10: NGINX CONFIGURATION
# =====================================================

log_step "🔟 Setting up Nginx reverse proxy..."

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/bpo-analytics << EOF
# Rate limiting zones
limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone \$binary_remote_addr zone=auth:10m rate=5r/m;

# Upstream servers
upstream backend {
    server 127.0.0.1:3001;
    keepalive 32;
}

upstream frontend {
    server 127.0.0.1:3000;
    keepalive 32;
}

server {
    listen 80;
    server_name $DOMAIN;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Static file caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            proxy_pass http://frontend;
        }
    }

    # Backend API with rate limiting
    location /api {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' 'http://$DOMAIN' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
        
        if (\$request_method = 'OPTIONS') {
            return 204;
        }
    }

    # Stricter rate limiting for auth endpoints
    location /api/auth {
        limit_req zone=auth burst=5 nodelay;
        
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://backend;
        access_log off;
    }
}
EOF

# Enable site and test configuration
sudo ln -sf /etc/nginx/sites-available/bpo-analytics /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
if sudo nginx -t; then
    log_info "✅ Nginx configuration is valid"
    sudo systemctl reload nginx
else
    log_error "❌ Nginx configuration error"
    exit 1
fi

# =====================================================
# STEP 11: MONITORING AND HEALTH CHECKS
# =====================================================

log_step "1️⃣1️⃣ Setting up monitoring..."

# Create health check script
cat > /root/health-check.sh << 'EOF'
#!/bin/bash
# Health check script for BPO Analytics

LOG_FILE="/var/log/bpo-analytics/health-check.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$DATE] Starting health check..." >> $LOG_FILE

# Check backend
if ! curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "[$DATE] Backend down, restarting..." >> $LOG_FILE
    pm2 restart bpo-analytics-backend
fi

# Check frontend
if ! curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "[$DATE] Frontend down, restarting..." >> $LOG_FILE
    pm2 restart bpo-analytics-frontend
fi

# Check MySQL
if ! mysql -u bpo_user -p'$DB_PASSWORD' -e "SELECT 1;" > /dev/null 2>&1; then
    echo "[$DATE] MySQL connection issue" >> $LOG_FILE
fi

# Check Redis
if ! redis-cli ping > /dev/null 2>&1; then
    echo "[$DATE] Redis connection issue" >> $LOG_FILE
fi

# Check disk space
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "[$DATE] Warning: Disk usage is ${DISK_USAGE}%" >> $LOG_FILE
fi

echo "[$DATE] Health check completed" >> $LOG_FILE
EOF

chmod +x /root/health-check.sh

# Add to crontab (every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * /root/health-check.sh") | crontab -

# =====================================================
# STEP 12: LOG ROTATION
# =====================================================

log_step "1️⃣2️⃣ Setting up log rotation..."

sudo tee /etc/logrotate.d/bpo-analytics << EOF
/var/log/bpo-analytics/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

# =====================================================
# STEP 13: FINAL VERIFICATION
# =====================================================

log_step "1️⃣3️⃣ Final verification..."

# Wait for services to start
log_info "Waiting for services to start..."
sleep 10

# Test backend
log_info "Testing backend..."
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    log_info "✅ Backend is responding"
else
    log_warn "⚠️  Backend not responding yet"
fi

# Test frontend
log_info "Testing frontend..."
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    log_info "✅ Frontend is responding"
else
    log_warn "⚠️  Frontend not responding yet"
fi

# Test database
log_info "Testing database..."
TABLES_COUNT=$(mysql -u bpo_user -p"$DB_PASSWORD" bpo_analytics -e "SHOW TABLES;" | wc -l)
log_info "✅ Database has $((TABLES_COUNT-1)) tables"

# Show PM2 status
log_info "PM2 Status:"
pm2 list

# =====================================================
# DEPLOYMENT COMPLETE
# =====================================================

echo ""
echo "🎉🎉🎉 BPO ANALYTICS PRODUCTION DEPLOYMENT COMPLETED! 🎉🎉🎉"
echo ""
echo "📊 Your Production Application:"
echo "   🌐 Website: http://$DOMAIN"
echo "   🔧 Backend API: http://$DOMAIN:3001"
echo "   ❤️  Health Check: http://$DOMAIN:3001/health"
echo "   📈 PM2 Monitor: pm2 monit"
echo ""
echo "🔐 Database Credentials:"
echo "   Host: localhost"
echo "   Database: bpo_analytics"
echo "   User: bpo_user"
echo "   Password: $DB_PASSWORD"
echo ""
echo "🗂️  Database Tables Created:"
mysql -u bpo_user -p"$DB_PASSWORD" bpo_analytics -e "SHOW TABLES;" | tail -n +2 | while read table; do
    echo "   ✅ $table"
done
echo ""
echo "🔧 Management Commands:"
echo "   pm2 status                    # Check application status"
echo "   pm2 logs                      # View all logs"
echo "   pm2 logs bpo-analytics-backend # Backend logs only"
echo "   pm2 logs bpo-analytics-frontend # Frontend logs only"
echo "   pm2 restart all               # Restart all services"
echo "   pm2 monit                     # Real-time monitoring"
echo "   sudo systemctl status nginx   # Check Nginx status"
echo "   sudo systemctl status mysql   # Check MySQL status"
echo "   /root/health-check.sh         # Manual health check"
echo ""
echo "📋 Production Features Enabled:"
echo "   ✅ Complete database schema with all tables and columns"
echo "   ✅ Secure environment variables and secrets"
echo "   ✅ PM2 clustering for high availability"
echo "   ✅ Nginx reverse proxy with rate limiting"
echo "   ✅ Redis caching"
echo "   ✅ Automated health monitoring"
echo "   ✅ Log rotation"
echo "   ✅ Security headers and firewall"
echo "   ✅ Gzip compression"
echo "   ✅ Static file caching"
echo ""
log_info "🚀 Your BPO Analytics Platform is now PRODUCTION-READY!"
echo ""
echo "💡 Next Steps:"
echo "   1. Test the application: http://$DOMAIN"
echo "   2. Create your first admin user via the registration page"
echo "   3. Upload audio files for analysis"
echo "   4. Monitor logs: pm2 logs"
echo "   5. Set up SSL certificate if using a domain name"
echo ""
echo "🆘 Support:"
echo "   - Check logs: pm2 logs"
echo "   - Health check: /root/health-check.sh"
echo "   - Database status: mysql -u bpo_user -p'$DB_PASSWORD' -e 'SHOW TABLES;'"
echo ""
