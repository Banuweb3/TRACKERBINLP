#!/bin/bash
echo "🔧 Fixing nginx proxy configuration..."

# Update nginx config to properly proxy ALL /api routes
sudo tee /etc/nginx/sites-available/bpo-analytics << 'EOF'
server {
    listen 80;
    server_name _;

    # Serve frontend files
    location / {
        root /root/TRACKERBINLP/dist;
        try_files $uri $uri/ /index.html;
    }

    # Proxy ALL API requests to backend on port 3001
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
        
        # Add CORS headers
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }
    }

    # Proxy health endpoint
    location /health {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Test and restart nginx
echo "🧪 Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx config is valid, restarting..."
    sudo systemctl restart nginx
    echo "✅ Nginx restarted successfully"
    
    echo "🧪 Testing API proxy..."
    curl -s http://localhost/api/auth/verify -H "Authorization: Bearer test" | head -c 100
    echo ""
    
    echo "🧪 Testing analysis endpoint..."
    curl -s -X POST http://localhost/api/analysis/sessions -H "Authorization: Bearer token_1_123" | head -c 100
    echo ""
    
else
    echo "❌ Nginx config has errors!"
fi

echo "✅ Nginx proxy fix complete!"
