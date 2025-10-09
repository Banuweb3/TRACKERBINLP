#!/bin/bash
# Setup nginx reverse proxy to fix API routing

echo "🔧 Setting up nginx reverse proxy..."

# Install nginx
sudo apt update
sudo apt install -y nginx

# Create nginx config
sudo tee /etc/nginx/sites-available/bpo-analytics << 'EOF'
server {
    listen 80;
    server_name _;

    # Serve frontend files
    location / {
        root /root/TRACKERBINLP/dist;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend on port 3001
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

# Enable the site
sudo ln -sf /etc/nginx/sites-available/bpo-analytics /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and restart nginx
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

# Stop PM2 frontend (nginx will serve it now)
pm2 delete bpo-frontend

echo "✅ Nginx reverse proxy setup complete!"
echo "🎯 Frontend: http://165.22.158.48 (served by nginx)"
echo "🎯 API calls: /api/* → forwarded to localhost:3001"
echo "🎯 Backend: Still running on port 3001"
