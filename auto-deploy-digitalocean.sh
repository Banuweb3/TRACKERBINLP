#!/bin/bash

# 🚀 Automated BPO Analytics Deployment Script for DigitalOcean
# This script automatically sets up everything from GitHub

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

echo "🚀 Starting Automated BPO Analytics Deployment..."
echo "📍 Repository: https://github.com/Banuweb3/TRACKERBINLP.git"
echo ""

# Get server IP
SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "142.93.222.167")
print_info "Server IP: $SERVER_IP"

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
print_status "Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MySQL Server
print_status "Installing MySQL Server..."
sudo apt install mysql-server -y

# Install PM2 and Nginx
print_status "Installing PM2 and Nginx..."
sudo npm install -g pm2
sudo apt install nginx -y

# Install additional tools
print_status "Installing additional tools..."
sudo apt install git htop curl wget unzip -y

# Clone/Update repository
print_status "Setting up application directory..."
if [ -d "/var/www/bpo-analytics" ]; then
    print_info "Updating existing repository..."
    cd /var/www/bpo-analytics
    git pull origin main || git pull origin master
else
    print_info "Cloning fresh repository..."
    sudo mkdir -p /var/www/bpo-analytics
    sudo chown $USER:$USER /var/www/bpo-analytics
    cd /var/www/bpo-analytics
    git clone https://github.com/Banuweb3/TRACKERBINLP.git .
fi

# Setup MySQL database with automatic authentication fix
print_status "Setting up MySQL database..."
sudo mysql -e "CREATE DATABASE IF NOT EXISTS bpo_analytics;" || true
sudo mysql -e "DROP USER IF EXISTS 'bpo_user'@'localhost';" 2>/dev/null || true
sudo mysql -e "CREATE USER 'bpo_user'@'localhost' IDENTIFIED BY 'Banu@1234';"
sudo mysql -e "GRANT ALL PRIVILEGES ON bpo_analytics.* TO 'bpo_user'@'localhost';"
sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'Banu@1234';" 2>/dev/null || true
sudo mysql -e "FLUSH PRIVILEGES;"

print_status "MySQL database 'bpo_analytics' configured successfully"

# Create .npmrc for better compatibility
print_status "Creating .npmrc configuration..."
cat > .npmrc << 'EOF'
optional=false
fund=false
audit=false
engine-strict=false
legacy-peer-deps=true
EOF

# Install frontend dependencies and build
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

# Create production environment file with dynamic IP
print_status "Creating production environment file..."
cat > .env << EOF
# Frontend API Configuration
VITE_API_BASE_URL=/api
VITE_BACKEND_URL=http://$SERVER_IP
REACT_APP_API_BASE_URL=/api
REACT_APP_BACKEND_URL=http://$SERVER_IP

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=bpo_user
DB_PASSWORD=Banu@1234
DB_NAME=bpo_analytics

# JWT Configuration
JWT_SECRET=bpo_analytics_super_secure_jwt_secret_key_$(date +%s)
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3001
NODE_ENV=production
FRONTEND_URL=http://$SERVER_IP
CORS_ORIGIN=http://$SERVER_IP

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

print_status "Environment file created with IP: $SERVER_IP"

# Execute SQL files automatically
print_status "Executing SQL schema files..."
if [ -f "sql/bpo_analytics.sql" ]; then
    print_info "Executing main schema: bpo_analytics.sql"
    mysql -u bpo_user -p'Banu@1234' bpo_analytics < sql/bpo_analytics.sql || print_warning "Main schema execution had warnings"
fi

if [ -f "sql/bulk_analysis_tables.sql" ]; then
    print_info "Executing bulk analysis schema: bulk_analysis_tables.sql"
    mysql -u bpo_user -p'Banu@1234' bpo_analytics < sql/bulk_analysis_tables.sql || print_warning "Bulk schema execution had warnings"
fi

# Execute other SQL files
for sql_file in sql/*.sql; do
    if [ -f "$sql_file" ] && [ "$sql_file" != "sql/bpo_analytics.sql" ] && [ "$sql_file" != "sql/bulk_analysis_tables.sql" ]; then
        print_info "Executing: $(basename $sql_file)"
        mysql -u bpo_user -p'Banu@1234' bpo_analytics < "$sql_file" || print_warning "$(basename $sql_file) execution had warnings"
    fi
done

# Run Node.js database setup if available
if [ -f "scripts/setupDatabase.js" ]; then
    print_status "Running Node.js database setup..."
    node scripts/setupDatabase.js || print_warning "Database setup had warnings, continuing..."
fi

# Verify database setup
print_status "Verifying database setup..."
table_count=$(mysql -u bpo_user -p'Banu@1234' bpo_analytics -e "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'bpo_analytics';" -s -N)
print_status "Database setup complete! Created $table_count tables"

# Go back to main directory for Nginx setup
cd ..

# Setup Nginx configuration with automatic API proxy
print_status "Setting up Nginx configuration..."
sudo tee /etc/nginx/sites-available/bpo-analytics > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;
    root /var/www/bpo-analytics/dist;
    index index.html;
    
    # Disable caching for development
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    add_header Expires "0";
    
    # Frontend files
    location / {
        try_files $uri /index.html;
    }
    
    # API proxy - CRITICAL for fixing CORS issues
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With" always;
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:3001/health;
    }
    
    # Static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1h;
        add_header Cache-Control "public";
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/bpo-analytics /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and start Nginx
sudo nginx -t
sudo systemctl start nginx
sudo systemctl enable nginx

# Setup firewall
print_status "Configuring firewall..."
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Stop any existing PM2 processes
pm2 delete all 2>/dev/null || print_warning "No existing PM2 processes to stop"

# Start the backend application with PM2
print_status "Starting backend application..."
cd server
pm2 start server.js --name "bpo-backend" --env production

# Save PM2 configuration
pm2 save
pm2 startup

# Final verification
print_status "Running final verification..."
sleep 5

# Test backend
backend_status=$(curl -s http://localhost:3001/health | grep -o "OK" || echo "FAILED")
if [ "$backend_status" = "OK" ]; then
    print_status "Backend is running correctly"
else
    print_warning "Backend might have issues, check logs: pm2 logs bpo-backend"
fi

# Test API proxy
api_status=$(curl -s http://localhost/health | grep -o "OK" || echo "FAILED")
if [ "$api_status" = "OK" ]; then
    print_status "API proxy is working correctly"
else
    print_warning "API proxy might have issues, check Nginx: sudo nginx -t"
fi

print_status "Deployment completed! 🎉"
echo ""
echo "🌐 Your BPO Analytics Platform is now live!"
echo "📍 URL: http://$SERVER_IP"
echo "👤 Default Login:"
echo "   Email: admin@bpo-analytics.com"
echo "   Password: admin123"
echo ""
echo "🔧 Management Commands:"
echo "   Check backend: pm2 status"
echo "   View logs: pm2 logs bpo-backend"
echo "   Restart app: pm2 restart bpo-backend"
echo "   Check Nginx: sudo systemctl status nginx"
echo ""
echo "🧪 Test Commands:"
echo "   Backend health: curl http://localhost:3001/health"
echo "   API proxy: curl http://localhost/health"
echo "   External access: curl http://$SERVER_IP/health"
echo ""
echo "✨ Your BPO Analytics Platform is ready for production use!"
