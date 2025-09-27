#!/bin/bash

# 🚀 Continue BPO Analytics Platform Setup
# Run this after the main script encountered the git clone issue

set -e

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

echo "🚀 Continuing BPO Analytics Platform setup..."

# Navigate to the existing repository
cd /var/www/bpo-analytics 2>/dev/null || cd ~/TRACKERBINLP

print_status "Using existing repository at: $(pwd)"

# Pull latest changes
print_status "Pulling latest changes from GitHub..."
git pull origin main || git pull origin master || print_warning "Could not pull latest changes"

# Setup MySQL database with correct password
print_status "Setting up MySQL database..."
sudo mysql -e "CREATE DATABASE IF NOT EXISTS bpo_analytics;" || print_warning "Database might already exist"
sudo mysql -e "DROP USER IF EXISTS 'bpo_user'@'localhost';" || print_warning "User might not exist"
sudo mysql -e "CREATE USER 'bpo_user'@'localhost' IDENTIFIED BY 'Banu@1234';"
sudo mysql -e "GRANT ALL PRIVILEGES ON bpo_analytics.* TO 'bpo_user'@'localhost';"
sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'Banu@1234';" || print_warning "Root user might already be configured"
sudo mysql -e "FLUSH PRIVILEGES;"

print_status "MySQL database 'bpo_analytics' created with user 'bpo_user'"

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

# Create production environment file
print_status "Creating production environment file..."
SERVER_IP=$(curl -s ifconfig.me)
cat > .env << EOF
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=bpo_user
DB_PASSWORD=Banu@1234
DB_NAME=bpo_analytics
JWT_SECRET=your_super_secure_jwt_secret_key_here_make_it_long_and_random_for_production_$(date +%s)
FRONTEND_URL=http://$SERVER_IP
CORS_ORIGIN=http://$SERVER_IP

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Your Gemini API keys
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

# Execute all SQL files in order
print_status "Executing SQL schema files..."
if [ -f "sql/bpo_analytics.sql" ]; then
    print_status "Executing main schema: bpo_analytics.sql"
    mysql -u bpo_user -p'Banu@1234' bpo_analytics < sql/bpo_analytics.sql
fi

if [ -f "sql/bulk_analysis_tables.sql" ]; then
    print_status "Executing bulk analysis schema: bulk_analysis_tables.sql"
    mysql -u bpo_user -p'Banu@1234' bpo_analytics < sql/bulk_analysis_tables.sql
fi

# Execute other SQL files if they exist
for sql_file in sql/*.sql; do
    if [ -f "$sql_file" ] && [ "$sql_file" != "sql/bpo_analytics.sql" ] && [ "$sql_file" != "sql/bulk_analysis_tables.sql" ]; then
        print_status "Executing: $(basename $sql_file)"
        mysql -u bpo_user -p'Banu@1234' bpo_analytics < "$sql_file" || print_warning "Failed to execute $sql_file"
    fi
done

# Run Node.js database setup if available
if [ -f "scripts/setupDatabase.js" ]; then
    print_status "Running Node.js database setup..."
    node scripts/setupDatabase.js || print_warning "Node.js database setup had issues, continuing..."
fi

# Verify database setup
print_status "Verifying database setup..."
table_count=$(mysql -u bpo_user -p'Banu@1234' bpo_analytics -e "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'bpo_analytics';" -s -N)
print_status "Database setup complete! Created $table_count tables"

# Go back to main directory for Nginx setup
cd ..

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

# Stop any existing PM2 processes
pm2 delete all 2>/dev/null || print_warning "No existing PM2 processes to stop"

# Start the backend application with PM2
print_status "Starting backend application..."
cd server
pm2 start server.js --name "bpo-backend" --env production

# Save PM2 configuration
pm2 save
pm2 startup

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
echo "🧪 Test your setup:"
echo "   Backend health: curl http://localhost:3001/health"
echo "   External access: curl http://$SERVER_IP/health"
echo ""
echo "⚠️  IMPORTANT: Change the default admin password after first login!"
