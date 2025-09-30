# DigitalOcean Deployment Guide - BPO Analytics Platform

## Step 1: Create Droplet

1. **Login to DigitalOcean Dashboard**
   - Go to https://cloud.digitalocean.com/

2. **Create New Droplet**
   - Click "Create" → "Droplets"
   - **Image**: Ubuntu 22.04 LTS
   - **Plan**: Basic ($6/month - 1GB RAM, 1 vCPU, 25GB SSD)
   - **Datacenter**: Choose closest to your users
   - **Authentication**: SSH Key (recommended) or Password
   - **Hostname**: `bpo-analytics-server`

3. **Wait for Droplet Creation** (2-3 minutes)

## Step 2: Connect to Your Droplet

```bash
# Replace YOUR_DROPLET_IP with actual IP
ssh root@YOUR_DROPLET_IP

# If using password, enter it when prompted
```

## Step 3: Initial Server Setup

```bash
# Update system
apt update && apt upgrade -y

# Install required packages
apt install -y curl wget git nginx mysql-server nodejs npm

# Install Node.js 18+ (required)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Verify installations
node --version  # Should be 18+
npm --version
mysql --version
nginx -v
```

## Step 4: Setup MySQL Database

```bash
# Secure MySQL installation
mysql_secure_installation
# Answer: Y, Y, Y, Y, Y (yes to all)

# Create database and user
mysql -u root -p
```

```sql
-- In MySQL prompt:
CREATE DATABASE bpo_analytics;
CREATE USER 'bpo_user'@'localhost' IDENTIFIED BY 'Banu@1234';
GRANT ALL PRIVILEGES ON bpo_analytics.* TO 'bpo_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## Step 5: Clone and Setup Application

```bash
# Clone your repository
cd /var/www
git clone https://github.com/Banuweb3/TRACKERBINLP.git bpo-analytics
cd bpo-analytics

# Setup backend
cd server
npm install

# Create production environment file
cp .env.example .env.production
```

## Step 6: Configure Environment Variables

Edit the `.env.production` file:

```bash
nano .env.production
```

```env
# Database Configuration
DB_HOST=localhost
DB_USER=bpo_user
DB_PASSWORD=Banu@1234
DB_NAME=bpo_analytics
DB_PORT=3306

# Server Configuration
NODE_ENV=production
PORT=3001
FRONTEND_URL=http://YOUR_DROPLET_IP

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-here

# Your existing API keys (keep these)
API_KEY_1=AIzaSyBPCrAqcOqvYwkRbOBBM8NSg6F7zVknctQ
# ... (all your existing API keys)

# Facebook/Instagram API Configuration (keep your existing tokens)
FACEBOOK_ACCESS_TOKEN=EAAR4Qlwlv10BPUPtkc8MAYIhKpTRDO7u91ZAb3Sl2ltWD8jHBTvZCTAwJGExZCSgsOcZAWryHsyPwZABHbe9PajGDudjE62jZB3uD7EuMdRYpOPH2bl0p1MoEcIEAZCIvKPz2iO8dd0dXlfKJ7I7PKtTzkv4k1AiW7lz9n9gjaXzhdzzztyLuZBJZCN8ltHMNTQFf
FACEBOOK_APP_SECRET=ae57700e20903c511cff0fdb5b6e5f16
FACEBOOK_APP_ID=your_actual_app_id_here

# Facebook Ad Accounts
FACEBOOK_AD_ACCOUNT_INSTAGRAM=act_837599231811269
FACEBOOK_AD_ACCOUNT_FACEBOOK=act_782436794463558

# Facebook Page Tokens
FACEBOOK_PAGE_HARISHSHOPPY_ID=613327751869662
FACEBOOK_PAGE_HARISHSHOPPY_TOKEN=EAAR4Qlwlv10BPXWTfwPAYdnrYhZBBnsFfQZBFUTBk4hJDya6mTisY3bZBSYVGNZCv7Ord9dkApwIkmZBZBXrDwYI8ikrc1Nz8iZBsaw71p00ECWUM1TRqWzUKmhu2sUTPmGI6vSMzDSPArZAokpCpZCZCemQosEZAbTmAW25VT9sKtc8jnw4MkQn8ewkK1V7ZB6Ycax2yKuxUKT7A5HxyjLxdevXvNf7y6UeAwZBHhmqA6ZAkZD

FACEBOOK_PAGE_ADAMANDEVE_ID=665798336609925
FACEBOOK_PAGE_ADAMANDEVE_TOKEN=EAAR4Qlwlv10BPYE9lrIiThaS7zziBrfMkAFXBDRl9egwvyEw9KE2ORsoVeMLheKXIXTZAgrjHvZBOChBrSW402fQ99vVLc3a1ZAVlTJTnsqAARrV3ZAaupV2bZAW3Bxyt9r8f3SCjW62PwDOyZCyZB2lgP085A2Gl4H208G8o3MTaCQvQa4tM0uHSzWJEsrDIBtDZAEQ23MzgQjCdu4NPVNLgEob3GbIAaavvN9IYZCkzvgZDZD
```

## Step 7: Initialize Database

```bash
# Run database setup
cd /var/www/bpo-analytics/server
npm run init-db

# Test backend
npm start
# Should show: "🚀 BPO Analytics Server running on port 3001"
# Press Ctrl+C to stop
```

## Step 8: Setup Frontend

```bash
# Go to frontend directory
cd /var/www/bpo-analytics

# Install dependencies
npm install --legacy-peer-deps

# Build for production
npm run build

# Verify build
ls -la dist/  # Should show built files
```

## Step 9: Configure Nginx

```bash
# Create Nginx configuration
nano /etc/nginx/sites-available/bpo-analytics
```

```nginx
server {
    listen 80;
    server_name YOUR_DROPLET_IP;
    
    # Frontend (React app)
    location / {
        root /var/www/bpo-analytics/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
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
    
    # Health check
    location /health {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# Enable the site
ln -s /etc/nginx/sites-available/bpo-analytics /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default  # Remove default site

# Test Nginx configuration
nginx -t

# Restart Nginx
systemctl restart nginx
systemctl enable nginx
```

## Step 10: Setup Process Manager (PM2)

```bash
# Install PM2 globally
npm install -g pm2

# Create PM2 ecosystem file
cd /var/www/bpo-analytics/server
nano ecosystem.config.js
```

```javascript
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
    log_file: '/var/log/bpo-analytics/combined.log'
  }]
};
```

```bash
# Create log directory
mkdir -p /var/log/bpo-analytics

# Start application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it gives you (usually starts with sudo)

# Check status
pm2 status
pm2 logs
```

## Step 11: Setup Firewall

```bash
# Configure UFW firewall
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Check status
ufw status
```

## Step 12: Test Your Deployment

1. **Open browser**: `http://YOUR_DROPLET_IP`
2. **Test API**: `http://YOUR_DROPLET_IP/api/meta/health`
3. **Test Meta Dashboard**: Login and check if Facebook/Instagram data loads

## Step 13: Setup SSL (Optional but Recommended)

```bash
# Install Certbot
apt install certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
certbot --nginx -d yourdomain.com

# Auto-renewal
crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Step 14: Monitoring and Maintenance

```bash
# Check application status
pm2 status
pm2 logs bpo-analytics-server

# Check system resources
htop
df -h
free -h

# Update application
cd /var/www/bpo-analytics
git pull origin main
cd server && npm install
cd .. && npm run build
pm2 restart bpo-analytics-server
```

## Troubleshooting

### Common Issues:

1. **Database Connection Error**
   ```bash
   mysql -u bpo_user -p bpo_analytics
   # Test if database user works
   ```

2. **Port 3001 Already in Use**
   ```bash
   lsof -i :3001
   kill -9 PID_NUMBER
   ```

3. **Nginx 502 Error**
   ```bash
   pm2 status  # Check if backend is running
   pm2 restart bpo-analytics-server
   ```

4. **Facebook API Errors**
   - Check if tokens are expired
   - Verify API permissions
   - Check `/api/meta/health` endpoint

## Final Checklist

- [ ] Droplet created and accessible
- [ ] MySQL database setup
- [ ] Backend running on PM2
- [ ] Frontend built and served by Nginx
- [ ] API endpoints working
- [ ] Meta Dashboard loading Facebook/Instagram data
- [ ] SSL certificate installed (optional)
- [ ] Firewall configured
- [ ] Monitoring setup

Your BPO Analytics Platform with Meta Dashboard should now be live! 🎉
