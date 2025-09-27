#!/bin/bash

# 🚨 Emergency Rebuild Script for DigitalOcean
# This script completely rebuilds the frontend from source to fix corrupted files

set -e

echo "🚨 Emergency Rebuild: Fixing corrupted frontend files..."

# Get server IP
SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "142.93.222.167")

# Go to the application directory
cd /root/TRACKERBINLP || cd /var/www/bpo-analytics || {
    echo "❌ Application directory not found. Cloning fresh..."
    cd /root
    rm -rf TRACKERBINLP
    git clone https://github.com/Banuweb3/TRACKERBINLP.git
    cd TRACKERBINLP
}

echo "📍 Working in: $(pwd)"

# Pull latest changes
echo "📥 Pulling latest code..."
git stash 2>/dev/null || true
git pull origin main || git pull origin master

# Clean everything
echo "🧹 Cleaning build artifacts..."
rm -rf dist node_modules/.vite .vite

# Create proper environment files
echo "📝 Creating environment files..."
cat > .env << EOF
VITE_API_BASE_URL=/api
VITE_BACKEND_URL=http://$SERVER_IP
REACT_APP_API_BASE_URL=/api
REACT_APP_BACKEND_URL=http://$SERVER_IP
EOF

cp .env .env.production
cp .env .env.local

# Create .npmrc for better compatibility
cat > .npmrc << 'EOF'
optional=false
fund=false
audit=false
engine-strict=false
legacy-peer-deps=true
EOF

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Build the application
echo "🔨 Building application..."
npm run build

# Verify build
if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist directory not created"
    exit 1
fi

if [ ! -f "dist/index.html" ]; then
    echo "❌ Build failed - index.html not found"
    exit 1
fi

echo "✅ Build successful!"

# Backup current web files
echo "💾 Backing up current web files..."
sudo mkdir -p /var/www/html-backup
sudo cp -r /var/www/html/* /var/www/html-backup/ 2>/dev/null || true

# Deploy new build
echo "🚀 Deploying new build..."
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/

# Set proper permissions
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html

# Create missing CSS file if needed
if [ ! -f "/var/www/html/index.css" ]; then
    echo "📝 Creating missing index.css..."
    sudo tee /var/www/html/index.css > /dev/null << 'EOF'
/* Basic styles for BPO Analytics */
body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    background-color: #f5f5f5;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.error {
    color: #dc3545;
    margin: 10px 0;
}

.success {
    color: #28a745;
    margin: 10px 0;
}
EOF
fi

# Setup Nginx with proper configuration
echo "⚙️ Configuring Nginx..."
sudo tee /etc/nginx/sites-available/bpo-analytics > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;
    root /var/www/html;
    index index.html;
    
    # Proper MIME types
    location ~* \.js$ {
        add_header Content-Type "application/javascript";
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }
    
    location ~* \.css$ {
        add_header Content-Type "text/css";
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }
    
    location ~* \.html$ {
        add_header Content-Type "text/html";
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }
    
    # Frontend files
    location / {
        try_files $uri /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
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
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "*";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With";
            add_header Access-Control-Max-Age 86400;
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:3001/health;
    }
}
EOF

# Enable the site and restart Nginx
sudo ln -sf /etc/nginx/sites-available/bpo-analytics /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx

# Restart backend to ensure it's running
echo "🔄 Restarting backend..."
cd server
pm2 restart bpo-backend || pm2 start server.js --name "bpo-backend"

# Final verification
echo "🧪 Running final tests..."
sleep 3

# Test backend
backend_test=$(curl -s http://localhost:3001/health | grep -o "OK" || echo "FAILED")
echo "Backend health: $backend_test"

# Test API proxy
api_test=$(curl -s http://localhost/health | grep -o "OK" || echo "FAILED")
echo "API proxy: $api_test"

# Test frontend files
frontend_test=$(curl -s -I http://localhost/ | grep -o "200 OK" || echo "FAILED")
echo "Frontend: $frontend_test"

# Check for JavaScript files
js_files=$(find /var/www/html -name "*.js" | wc -l)
echo "JavaScript files: $js_files"

echo ""
echo "🎉 Emergency rebuild completed!"
echo ""
echo "🌐 Your BPO Analytics Platform:"
echo "📍 URL: http://$SERVER_IP"
echo ""
echo "🔧 If still having issues:"
echo "1. Clear browser cache completely (F12 → Application → Clear site data)"
echo "2. Try incognito/private window"
echo "3. Hard refresh: Ctrl+F5 or Cmd+Shift+R"
echo ""
echo "📊 Status:"
echo "   Backend: $backend_test"
echo "   API Proxy: $api_test"
echo "   Frontend: $frontend_test"
echo "   JS Files: $js_files"
echo ""
echo "✨ The application should now work correctly!"
