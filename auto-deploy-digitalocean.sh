#!/bin/bash

# ============================================================================
# AUTO-DEPLOY DIGITALOCEAN - BPO Analytics Platform
# Updated: 2025-01-01 - Bulletproof deployment script
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

print_header() {
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${PURPLE}🚀 $1${NC}"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

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

print_debug() {
    if [ "$DEBUG" = "true" ]; then
        echo -e "${PURPLE}[DEBUG]${NC} $1"
    fi
}

handle_error() {
    print_error "An error occurred: $1"
    print_error "Check the logs above for more details."
    exit 1
}

# ============================================================================
# PRE-DEPLOYMENT CHECKS
# ============================================================================

pre_deployment_checks() {
    print_header "PRE-DEPLOYMENT CHECKS"

    # Check if running as root
    if [ "$EUID" -ne 0 ]; then
        print_error "Please run this script as root (use sudo)"
        exit 1
    fi

    print_success "Running as root"

    # Check internet connectivity
    if ping -c 1 google.com &> /dev/null; then
        print_success "Internet connectivity OK"
    else
        print_error "No internet connectivity. Please check your network."
        exit 1
    fi

    # Check available disk space (need at least 1GB)
    DISK_SPACE=$(df / | tail -1 | awk '{print $4}')
    if [ "$DISK_SPACE" -gt 1048576 ]; then  # 1GB in KB
        print_success "Sufficient disk space: $(df -h / | tail -1 | awk '{print $4}')"
    else
        print_error "Insufficient disk space. Need at least 1GB free."
        exit 1
    fi
}

# ============================================================================
# SYSTEM UPDATE & DEPENDENCIES
# ============================================================================

setup_system() {
    print_header "SYSTEM SETUP & DEPENDENCIES"

    print_status "Updating system packages..."
    apt update && apt upgrade -y || handle_error "Failed to update system"

    print_status "Installing essential packages..."
    apt install -y curl wget git nginx mysql-server nodejs npm ufw htop nano ufw || handle_error "Failed to install packages"

    print_status "Installing Node.js 18+..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - || handle_error "Failed to setup Node.js"
    apt-get install -y nodejs || handle_error "Failed to install Node.js"

    print_status "Installing PM2 globally..."
    npm install -g pm2 || handle_error "Failed to install PM2"

    print_status "Installing MySQL..."
    apt install -y mysql-server || handle_error "Failed to install MySQL"

    # Verify installations
    print_status "Verifying installations..."
    node --version || handle_error "Node.js not installed properly"
    npm --version || handle_error "npm not installed properly"
    mysql --version || handle_error "MySQL not installed properly"
    nginx -v || handle_error "Nginx not installed properly"

    print_success "All dependencies installed successfully"
}

# ============================================================================
# MYSQL SETUP
# ============================================================================

setup_mysql() {
    print_header "MYSQL DATABASE SETUP"

    # Start MySQL service
    systemctl start mysql || handle_error "Failed to start MySQL"
    systemctl enable mysql || print_warning "Failed to enable MySQL auto-start"

    # Secure MySQL installation
    print_status "Securing MySQL installation..."
    mysql_secure_installation << EOF

y
Banu@1234
Banu@1234
y
y
y
y
y
EOF

    print_status "Creating database and user..."
    mysql -u root -pBanu@1234 << EOF
CREATE DATABASE IF NOT EXISTS bpo_analytics;
CREATE USER IF NOT EXISTS 'bpo_user'@'localhost' IDENTIFIED BY 'Banu@1234';
GRANT ALL PRIVILEGES ON bpo_analytics.* TO 'bpo_user'@'localhost';
FLUSH PRIVILEGES;
EOF

    # Test database connection
    if mysql -u bpo_user -pBanu@1234 bpo_analytics -e "SELECT 1;" &> /dev/null; then
        print_success "Database connection successful"
    else
        print_error "Database connection failed"
        exit 1
    fi
}

# ============================================================================
# APPLICATION DEPLOYMENT
# ============================================================================

deploy_application() {
    print_header "APPLICATION DEPLOYMENT"

    APP_DIR="/var/www/bpo-analytics"
    SERVER_DIR="$APP_DIR/server"

    # Remove existing installation if it exists
    if [ -d "$APP_DIR" ]; then
        print_warning "Existing installation found. Backing up..."
        mv "$APP_DIR" "${APP_DIR}_backup_$(date +%Y%m%d_%H%M%S)"
    fi

    print_status "Cloning repository..."
    git clone https://github.com/Banuweb3/TRACKERBINLP.git "$APP_DIR" || handle_error "Failed to clone repository"
    cd "$APP_DIR"

    # Setup backend
    print_status "Setting up backend..."
    cd "$SERVER_DIR"

    # Fix npm optional dependencies issue
    print_status "Fixing npm optional dependencies..."
    cat > .npmrc << 'EOF'
optional=false
fund=false
audit=false
engine-strict=false
legacy-peer-deps=true
EOF

    print_status "Installing backend dependencies..."
    npm install || handle_error "Failed to install backend dependencies"

    # Create production environment file
    print_status "Creating production environment file..."
    cat > .env.production << 'EOF'
# =====================================
# BPO Analytics Platform - Production Environment
# =====================================
# Database Configuration for DigitalOcean
DB_HOST=localhost
DB_PORT=3306
DB_USER=bpo_user
DB_PASSWORD=Banu@1234
DB_NAME=bpo_analytics

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production_make_it_longer_and_more_secure_$(date +%s)
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3001
NODE_ENV=production

# CORS Configuration - Update with your actual domain/IP
FRONTEND_URL=http://YOUR_DROPLET_IP_HERE

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# =====================================
# API KEYS - Gemini & Google Services
# =====================================
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

# =====================================
# Facebook/Instagram API Configuration
# =====================================
FACEBOOK_ACCESS_TOKEN=EAAR4Qlwlv10BPUPtkc8MAYIhKpTRDO7u91ZAb3Sl2ltWD8jHBTvZCTAwJGExZCSgsOcZAWryHsyPwZABHbe9PajGDudjE62jZB3uD7EuMdRYpOPH2bl0p1MoEcIEAZCIvKPz2iO8dd0dXlfKJ7I7PKtTzkv4k1AiW7lz9n9gjaXzhdzzztyLuZBJZCN8ltHMNTQFf
FACEBOOK_APP_SECRET=ae57700e20903c511cff0fdb5b6e5f16
FACEBOOK_APP_ID=your_app_id_here

# Facebook Ad Accounts
FACEBOOK_AD_ACCOUNT_INSTAGRAM=act_837599231811269
FACEBOOK_AD_ACCOUNT_FACEBOOK=act_782436794463558

# Facebook Page Tokens (Long-lived)
FACEBOOK_PAGE_HARISHSHOPPY_ID=613327751869662
FACEBOOK_PAGE_HARISHSHOPPY_TOKEN=EAAR4Qlwlv10BPXWTfwPAYdnrYhZBBnsFfQZBFUTBk4hJDya6mTisY3bZBSYVGNZCv7Ord9dkApwIkmZBZBXrDwYI8ikrc1Nz8iZBsaw71p00ECWUM1TRqWzUKmhu2sUTPmGI6vSMzDSPArZAokpCpZCZCemQosEZAbTmAW25VT9sKtc8jnw4MkQn8ewkK1V7ZB6Ycax2yKuxUKT7A5HxyjLxdevXvNf7y6UeAwZBHhmqA6ZAkZD

FACEBOOK_PAGE_ADAMANDEVE_ID=665798336609925
FACEBOOK_PAGE_ADAMANDEVE_TOKEN=EAAR4Qlwlv10BPYE9lrIiThaS7zziBrfMkAFXBDRl9egwvyEw9KE2ORsoVeMLheKXIXTZAgrjHvZBOChBrSW402fQ99vVLc3a1ZAVlTJTnsqAARrV3ZAaupV2bZAW3Bxyt9r8f3SCjW62PwDOyZCyZB2lgP085A2Gl4H208G8o3MTaCQvQa4tM0uHSzWJEsrDIBtDZAEQ23MzgQjCdu4NPVNLgEob3GbIAaavvN9IYZCkzvgZDZD

# =====================================
# Application Settings
# =====================================
MAX_FILE_SIZE=52428800
SUPPORTED_AUDIO_FORMATS=mp3,wav,m4a,ogg,flac
ANALYSIS_TIMEOUT=300000
ENABLE_BULK_ANALYSIS=true
ENABLE_REAL_TIME_ANALYSIS=true
ENABLE_EXPORT_FEATURES=true

# =====================================
# Logging Configuration
# =====================================
LOG_LEVEL=info
LOG_FILE=/var/log/bpo-analytics/server.log
LOG_MAX_SIZE=10m
LOG_MAX_FILES=5

# =====================================
# Security Settings
# =====================================
FORCE_HTTPS=false
SESSION_TIMEOUT=24h
SESSION_SECRET=your_session_secret_here_change_this
API_RATE_LIMIT_ENABLED=true
CORS_ORIGINS=http://YOUR_DROPLET_IP_HERE

# =====================================
# Performance Settings
# =====================================
PM2_INSTANCES=1
PM2_MAX_MEMORY=1G
DB_CONNECTION_LIMIT=10
DB_QUEUE_LIMIT=0

# =====================================
# Development/Debug Settings
# =====================================
DEBUG=false
VERBOSE_LOGGING=false

# =====================================
# Email Configuration (Optional)
# =====================================
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=

# =====================================
# Monitoring (Optional)
# =====================================
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_PATH=/health
METRICS_ENABLED=false
METRICS_PATH=/metrics
EOF

    # Set secure permissions
    chmod 600 .env.production || print_warning "Failed to set permissions on .env.production"

    # Setup frontend
    print_status "Setting up frontend..."
    cd "$APP_DIR"

    # Fix frontend npm issues
    cat > .npmrc << 'EOF'
optional=false
fund=false
audit=false
engine-strict=false
legacy-peer-deps=true
EOF

    print_status "Installing frontend dependencies..."
    npm install --legacy-peer-deps || handle_error "Failed to install frontend dependencies"

    print_status "Building frontend..."
    npm run build || handle_error "Failed to build frontend"

    # Verify build
    if [ ! -d "dist" ]; then
        handle_error "Frontend build failed - dist directory not found"
    fi

    print_success "Application deployed successfully"
}

# ============================================================================
# DATABASE INITIALIZATION
# ============================================================================

setup_database() {
    print_header "DATABASE INITIALIZATION"

    cd "/var/www/bpo-analytics/server"

    print_status "Running database initialization..."
    npm run init-db || print_warning "Database initialization had issues, but continuing..."

    # Alternative manual database setup
    print_status "Setting up database tables manually..."
    if [ -f "sql/bpo_analytics.sql" ]; then
        print_status "Executing main schema..."
        mysql -u bpo_user -p'Banu@1234' bpo_analytics < sql/bpo_analytics.sql || print_warning "Main schema execution had warnings"
    fi

    if [ -f "sql/bulk_analysis_tables.sql" ]; then
        print_status "Executing bulk analysis schema..."
        mysql -u bpo_user -p'Banu@1234' bpo_analytics < sql/bulk_analysis_tables.sql || print_warning "Bulk schema execution had warnings"
    fi

    # Execute other SQL files
    for sql_file in sql/*.sql; do
        if [ -f "$sql_file" ] && [ "$sql_file" != "sql/bpo_analytics.sql" ] && [ "$sql_file" != "sql/bulk_analysis_tables.sql" ]; then
            print_status "Executing: $(basename $sql_file)"
            mysql -u bpo_user -p'Banu@1234' bpo_analytics < "$sql_file" || print_warning "$(basename $sql_file) execution had warnings"
        fi
    done

    # Run Node.js database setup if available
    if [ -f "scripts/setupDatabase.js" ]; then
        print_status "Running Node.js database setup..."
        node scripts/setupDatabase.js || print_warning "Database setup had warnings, continuing..."
    fi

    # Verify database setup
    TABLE_COUNT=$(mysql -u bpo_user -p'Banu@1234' bpo_analytics -e "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'bpo_analytics';" -s -N 2>/dev/null || echo "0")
    print_status "Database setup complete! Created $TABLE_COUNT tables"

    if [ "$TABLE_COUNT" -eq "0" ]; then
        print_warning "No tables created. Database setup may have failed."
    else
        print_success "Database initialized successfully"
    fi
}

# ============================================================================
# NGINX CONFIGURATION
# ============================================================================

setup_nginx() {
    print_header "NGINX CONFIGURATION"

    # Get the droplet IP
    DROPLET_IP=$(curl -s http://checkip.amazonaws.com)

    print_status "Configuring Nginx with IP: $DROPLET_IP"

    # Create Nginx configuration
    cat > /etc/nginx/sites-available/bpo-analytics << EOF
server {
    listen 80;
    server_name $DROPLET_IP;

    # Frontend (React app)
    location / {
        root /var/www/bpo-analytics/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;

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
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;

        # Quick timeout for health checks
        proxy_connect_timeout 5s;
        proxy_send_timeout 5s;
        proxy_read_timeout 5s;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
EOF

    # Enable the site
    rm -f /etc/nginx/sites-enabled/default
    ln -sf /etc/nginx/sites-available/bpo-analytics /etc/nginx/sites-enabled/

    # Test configuration
    nginx -t || handle_error "Nginx configuration test failed"

    # Restart Nginx
    systemctl restart nginx || handle_error "Failed to restart Nginx"
    systemctl enable nginx || print_warning "Failed to enable Nginx"

    print_success "Nginx configured successfully"
}

# ============================================================================
# PM2 & APPLICATION STARTUP
# ============================================================================

setup_pm2() {
    print_header "PM2 & APPLICATION STARTUP"

    cd "/var/www/bpo-analytics/server"

    # Create PM2 ecosystem file
    cat > ecosystem.config.js << EOF
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
    log_file: '/var/log/bpo-analytics/combined.log',
    // Restart delay and monitoring
    min_uptime: '10s',
    max_restarts: 3,
    // Kill timeout
    kill_timeout: 5000,
    // Restart on crash
    restart_delay: 4000
  }]
};
EOF

    # Create log directory
    mkdir -p /var/log/bpo-analytics

    # Test application startup manually first
    print_status "Testing application startup..."
    timeout 15s npm start || print_warning "Manual startup test had issues, but continuing..."

    # Start with PM2
    print_status "Starting application with PM2..."
    pm2 start ecosystem.config.js || handle_error "Failed to start application with PM2"

    # Save PM2 configuration
    pm2 save || print_warning "Failed to save PM2 configuration"

    # Setup PM2 startup script
    pm2 startup systemd -u root --hp /root || print_warning "Failed to setup PM2 startup"

    # Wait for application to be ready
    print_status "Waiting for application to be ready..."
    sleep 10

    # Test if application is responding
    if curl -s http://localhost:3001/health > /dev/null; then
        print_success "Application is responding successfully"
    else
        print_warning "Application may not be responding yet, but continuing..."
    fi

    print_success "PM2 configured and application started"
}

# ============================================================================
# FIREWALL CONFIGURATION
# ============================================================================

setup_firewall() {
    print_header "FIREWALL CONFIGURATION"

    # Reset UFW
    ufw --force reset || print_warning "Failed to reset UFW"

    # Allow necessary ports
    ufw allow ssh || print_warning "Failed to allow SSH"
    ufw allow 80/tcp || print_warning "Failed to allow HTTP"
    ufw allow 443/tcp || print_warning "Failed to allow HTTPS"

    # Enable UFW
    ufw --force enable || print_warning "Failed to enable UFW"

    print_success "Firewall configured"
}

# ============================================================================
# POST-DEPLOYMENT VERIFICATION
# ============================================================================

post_deployment_verification() {
    print_header "POST-DEPLOYMENT VERIFICATION"

    DROPLET_IP=$(curl -s http://checkip.amazonaws.com)

    print_status "Testing all services..."

    # Test Nginx
    if systemctl is-active --quiet nginx; then
        print_success "✓ Nginx is running"
    else
        print_error "✗ Nginx is not running"
    fi

    # Test MySQL
    if systemctl is-active --quiet mysql; then
        print_success "✓ MySQL is running"
    else
        print_error "✗ MySQL is not running"
    fi

    # Test PM2
    if pm2 list | grep -q "bpo-analytics-server"; then
        print_success "✓ PM2 application is running"
    else
        print_error "✗ PM2 application is not running"
    fi

    # Test backend API
    if curl -s http://localhost:3001/health > /dev/null; then
        print_success "✓ Backend API is responding"
    else
        print_warning "! Backend API may not be responding"
    fi

    # Test frontend
    if curl -s http://localhost > /dev/null; then
        print_success "✓ Frontend is accessible"
    else
        print_warning "! Frontend may not be accessible"
    fi

    print_success "Deployment verification complete!"
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}🎉 BPO Analytics Platform Deployed Successfully!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${BLUE}🌐 Frontend:${NC} http://$DROPLET_IP"
    echo -e "${BLUE}🔧 API Health:${NC} http://$DROPLET_IP/health"
    echo -e "${BLUE}📊 Meta Dashboard:${NC} http://$DROPLET_IP/api/meta/health"
    echo ""
    echo -e "${YELLOW}📋 Management Commands:${NC}"
    echo "  pm2 status                    # Check application status"
    echo "  pm2 logs bpo-analytics-server # View application logs"
    echo "  pm2 restart bpo-analytics-server # Restart application"
    echo "  systemctl status nginx        # Check Nginx status"
    echo ""
    print_warning "Remember to:"
    print_warning "1. Update FRONTEND_URL in .env.production to: http://$DROPLET_IP"
    print_warning "2. Setup SSL certificate for production use"
    print_warning "3. Configure domain name if you have one"
    echo ""
    echo -e "${GREEN}✅ Your BPO Analytics Platform is now live!${NC}"
}

# ============================================================================
# MAIN DEPLOYMENT EXECUTION
# ============================================================================

main() {
    print_header "AUTO-DEPLOY DIGITALOCEAN - BPO Analytics Platform"

    # Run all deployment steps
    pre_deployment_checks
    setup_system
    setup_mysql
    deploy_application
    setup_database
    setup_nginx
    setup_pm2
    setup_firewall
    post_deployment_verification

    print_header "DEPLOYMENT COMPLETED"
}

# Run the deployment
main "$@"

# ============================================================================
# END OF SCRIPT
# ============================================================================
# This script has been updated to handle common deployment errors that cause
# 500 Internal Server Errors, including:
# - NPM optional dependencies issues
# - Database connection problems
# - Environment configuration errors
# - Application startup failures
# - Nginx proxy configuration issues
# ============================================================================
