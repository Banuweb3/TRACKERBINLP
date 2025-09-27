#!/bin/bash

# 🚀 Quick Fix for API CORS Issues on DigitalOcean
# Run this script on your DigitalOcean Droplet to fix the localhost:3001 issue immediately

set -e

echo "🔧 Quick Fix: Replacing hardcoded localhost URLs in built files..."

# Go to the web directory
cd /var/www/html

# Find and replace ALL instances of localhost:3001 in built JavaScript files
echo "📝 Fixing JavaScript files..."
find . -name "*.js" -type f -exec sed -i 's|http://localhost:3001/api|/api|g' {} \;
find . -name "*.js" -type f -exec sed -i 's|https://localhost:3001/api|/api|g' {} \;
find . -name "*.js" -type f -exec sed -i 's|localhost:3001/api|/api|g' {} \;
find . -name "*.js" -type f -exec sed -i 's|http://localhost:3001||g' {} \;
find . -name "*.js" -type f -exec sed -i 's|https://localhost:3001||g' {} \;
find . -name "*.js" -type f -exec sed -i 's|localhost:3001||g' {} \;

# Also check HTML files
echo "📝 Fixing HTML files..."
find . -name "*.html" -type f -exec sed -i 's|http://localhost:3001/api|/api|g' {} \;
find . -name "*.html" -type f -exec sed -i 's|localhost:3001||g' {} \;

# Force browser cache refresh by adding cache-busting headers
echo "🔄 Adding cache-busting headers to Nginx..."
sudo tee /etc/nginx/sites-available/bpo-analytics > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;
    root /var/www/html;
    index index.html;
    
    # Force no caching to prevent old JS files
    location / {
        add_header Cache-Control "no-cache, no-store, must-revalidate, max-age=0";
        add_header Pragma "no-cache";
        add_header Expires "Thu, 01 Jan 1970 00:00:00 GMT";
        add_header Last-Modified "Thu, 01 Jan 1970 00:00:00 GMT";
        try_files $uri /index.html;
    }
    
    # Force no caching for JS and CSS files
    location ~* \.(js|css)$ {
        add_header Cache-Control "no-cache, no-store, must-revalidate, max-age=0";
        add_header Pragma "no-cache";
        add_header Expires "Thu, 01 Jan 1970 00:00:00 GMT";
        add_header Last-Modified "Thu, 01 Jan 1970 00:00:00 GMT";
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

# Restart Nginx
echo "🔄 Restarting Nginx..."
sudo nginx -t
sudo systemctl restart nginx

# Verify the fixes
echo "🧪 Testing fixes..."
echo "Checking for localhost in JS files:"
grep -r "localhost:3001" . || echo "✅ No more localhost:3001 found in files"

echo "Testing API proxy:"
curl -s http://localhost/health | grep -o "OK" && echo "✅ API proxy working" || echo "❌ API proxy issue"

echo ""
echo "🎯 Quick Fix Applied!"
echo ""
echo "📋 Now do this in your browser:"
echo "1. Open Developer Tools (F12)"
echo "2. Go to Application tab"
echo "3. Click 'Storage' → 'Clear site data'"
echo "4. Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)"
echo "5. Try registration again"
echo ""
echo "🌐 If still not working, try:"
echo "- Open incognito/private window"
echo "- Go to http://142.93.222.167"
echo "- Try registration"
echo ""
echo "✨ The API should now call /api instead of localhost:3001!"
