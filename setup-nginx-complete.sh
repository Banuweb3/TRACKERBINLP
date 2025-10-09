#!/bin/bash
echo "🔧 Installing and configuring nginx for BPO Analytics..."

# Install nginx
echo "📦 Installing nginx..."
sudo apt update
sudo apt install -y nginx

# Create directories if they don't exist
sudo mkdir -p /etc/nginx/sites-available
sudo mkdir -p /etc/nginx/sites-enabled

# Create nginx configuration
echo "⚙️ Creating nginx configuration..."
sudo tee /etc/nginx/sites-available/bpo-analytics << 'EOF'
server {
    listen 80;
    server_name _;

    # Serve frontend files
    location / {
        root /root/TRACKERBINLP/dist;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Add CORS headers for API
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type';

        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type';
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }
    }

    # Proxy health endpoint
    location /health {
        proxy_pass http://localhost:3001;
    }
}
EOF

# Enable the site
echo "🔗 Enabling site configuration..."
sudo ln -sf /etc/nginx/sites-available/bpo-analytics /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
echo "🧪 Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx config is valid"

    # Stop PM2 frontend first
    echo "🛑 Stopping PM2 frontend..."
    pm2 delete bpo-frontend 2>/dev/null || echo "Frontend not running"

    # Check what's using port 80
    echo "🔍 Checking port 80 usage..."
    sudo netstat -tulpn | grep :80 || echo "Port 80 is free"

    # Start nginx
    echo "🚀 Starting nginx..."
    sudo systemctl start nginx
    sudo systemctl enable nginx

    # Wait a moment and check status
    sleep 2
    sudo systemctl status nginx --no-pager -l

    # Test the setup
    echo "🧪 Testing API proxy..."
    sleep 3
    curl -s -X POST http://localhost/api/analysis/sessions \
      -H "Authorization: Bearer token_9_1760004216488" \
      -H "Content-Type: application/json" \
      -d '{}' | head -c 100

    echo "✅ Nginx setup complete!"

else
    echo "❌ Nginx config has errors!"
    sudo nginx -t
fi
