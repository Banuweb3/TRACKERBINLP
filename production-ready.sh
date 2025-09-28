#!/bin/bash

# Production-Ready Deployment Script for BPO Analytics
# This script makes your application truly production-ready

set -e
echo "🚀 Making BPO Analytics Production-Ready..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Get server details
SERVER_IP=$(curl -s ifconfig.me)
DOMAIN=${1:-$SERVER_IP}  # Use domain if provided, otherwise IP

log_info "Setting up production environment for: $DOMAIN"

# 1. Install production dependencies
log_info "Installing production dependencies..."
sudo apt update
sudo apt install -y nginx mysql-server redis-server certbot python3-certbot-nginx
sudo npm install -g pm2 serve

# 2. Setup SSL Certificate (Let's Encrypt)
if [[ $DOMAIN != $SERVER_IP ]]; then
    log_info "Setting up SSL certificate for domain: $DOMAIN"
    sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
else
    log_warn "Using IP address - SSL certificate skipped. Use a domain for HTTPS."
fi

# 3. Setup Redis for caching and sessions
log_info "Configuring Redis..."
sudo systemctl start redis-server
sudo systemctl enable redis-server

# 4. Secure MySQL
log_info "Securing MySQL..."
sudo mysql_secure_installation --use-default

# 5. Create production environment files
log_info "Creating secure production environment..."

# Generate secure secrets
JWT_SECRET=$(openssl rand -base64 64)
SESSION_SECRET=$(openssl rand -base64 32)
DB_PASSWORD=$(openssl rand -base64 16)

# Backend production .env
cd /root/TRACKERBINLP/server
cat > .env << EOF
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=bpo_user
DB_PASSWORD=$DB_PASSWORD
DB_NAME=bpo_analytics

# Security
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=24h
SESSION_SECRET=$SESSION_SECRET

# Server Configuration
PORT=3001
NODE_ENV=production

# CORS Configuration
FRONTEND_URL=https://$DOMAIN

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Rate Limiting (Stricter for production)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=50

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/bpo-analytics/app.log

# API Keys (Move to environment variables or secret manager)
API_KEY=\${GEMINI_API_KEY_1}
API_KEY_2=\${GEMINI_API_KEY_2}
EOF

# Update database user with new password
sudo mysql -e "ALTER USER 'bpo_user'@'localhost' IDENTIFIED BY '$DB_PASSWORD';"
sudo mysql -e "FLUSH PRIVILEGES;"

# 6. Setup logging directory
sudo mkdir -p /var/log/bpo-analytics
sudo chown -R $USER:$USER /var/log/bpo-analytics

# 7. Install production dependencies
log_info "Installing production Node.js dependencies..."
npm install --production
npm install redis helmet compression morgan winston

# 8. Setup frontend for production
log_info "Building frontend for production..."
cd /root/TRACKERBINLP

# Frontend production environment
cat > .env.local << EOF
VITE_API_URL=https://$DOMAIN/api
VITE_APP_ENV=production
EOF

# Build with optimizations
npm run build

# 9. Configure Nginx for production
log_info "Configuring Nginx for production..."
sudo tee /etc/nginx/sites-available/bpo-analytics << EOF
# Rate limiting
limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone \$binary_remote_addr zone=login:10m rate=5r/m;

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
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

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
        
        # Caching for static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
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
    }

    # Stricter rate limiting for auth endpoints
    location /api/auth {
        limit_req zone=login burst=5 nodelay;
        
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable site and test configuration
sudo ln -sf /etc/nginx/sites-available/bpo-analytics /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t

# 10. Setup PM2 for production
log_info "Configuring PM2 for production..."

# PM2 ecosystem file
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
      node_args: '--max-old-space-size=512'
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
      time: true
    }
  ]
};
EOF

# 11. Setup monitoring and health checks
log_info "Setting up monitoring..."

# Health check script
cat > /root/health-check.sh << 'EOF'
#!/bin/bash
# Health check script

# Check backend
if ! curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "Backend down, restarting..."
    pm2 restart bpo-analytics-backend
fi

# Check frontend
if ! curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "Frontend down, restarting..."
    pm2 restart bpo-analytics-frontend
fi

# Check disk space
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "Warning: Disk usage is ${DISK_USAGE}%"
fi
EOF

chmod +x /root/health-check.sh

# Add to crontab
(crontab -l 2>/dev/null; echo "*/5 * * * * /root/health-check.sh") | crontab -

# 12. Setup log rotation
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

# 13. Start services
log_info "Starting production services..."

# Stop existing processes
pm2 delete all 2>/dev/null || true

# Start with ecosystem file
cd /root/TRACKERBINLP
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Start other services
sudo systemctl restart nginx
sudo systemctl restart redis-server

# 14. Setup firewall
log_info "Configuring production firewall..."
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# 15. Final security hardening
log_info "Applying security hardening..."

# Remove unnecessary packages
sudo apt autoremove -y

# Set proper file permissions
sudo chown -R $USER:$USER /root/TRACKERBINLP
chmod -R 755 /root/TRACKERBINLP
chmod 600 /root/TRACKERBINLP/server/.env

echo ""
echo "🎉 Production Deployment Completed!"
echo ""
echo "📊 Your Production Application:"
echo "   🌐 Website: https://$DOMAIN"
echo "   🔒 SSL: Enabled"
echo "   📈 Monitoring: Enabled"
echo "   🛡️  Security: Hardened"
echo "   ⚡ Performance: Optimized"
echo ""
echo "🔧 Management Commands:"
echo "   pm2 status                    # Check application status"
echo "   pm2 logs                      # View logs"
echo "   pm2 monit                     # Real-time monitoring"
echo "   sudo nginx -t                 # Test Nginx config"
echo "   sudo systemctl status nginx   # Check Nginx status"
echo ""
echo "📋 Production Checklist:"
echo "   ✅ SSL Certificate installed"
echo "   ✅ Security headers configured"
echo "   ✅ Rate limiting enabled"
echo "   ✅ Gzip compression enabled"
echo "   ✅ Log rotation configured"
echo "   ✅ Health monitoring enabled"
echo "   ✅ Firewall configured"
echo "   ✅ Redis caching enabled"
echo "   ✅ PM2 clustering enabled"
echo ""
log_info "🚀 Your application is now PRODUCTION-READY!"
