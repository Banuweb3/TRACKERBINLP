# 🖥️ DigitalOcean Droplet Setup Guide

## 🚀 Creating a Droplet

### Step 1: Create Droplet
1. Go to [DigitalOcean Control Panel](https://cloud.digitalocean.com/droplets)
2. Click **"Create Droplet"**

### Step 2: Choose Configuration

#### **Image Selection:**
- **Distribution**: Ubuntu 22.04 LTS (recommended)
- **Version**: Latest stable

#### **Droplet Size:**
For BPO Analytics Platform:
- **Basic Plan**: $12/month (2GB RAM, 1 vCPU, 50GB SSD)
- **Regular Plan**: $24/month (4GB RAM, 2 vCPU, 80GB SSD) - Recommended

#### **Datacenter Region:**
- Choose closest to your users
- Popular: New York, San Francisco, London, Bangalore

#### **Authentication:**
- **SSH Key** (recommended) - Upload your public key
- **Password** - Set a strong root password

#### **Additional Options:**
- ✅ **Monitoring** - Enable for server stats
- ✅ **Backups** - Enable weekly backups (+20% cost)
- ❌ **IPv6** - Usually not needed
- ❌ **User Data** - Skip for now

### Step 3: Finalize
- **Hostname**: `bpo-analytics-server`
- **Tags**: `production`, `bpo-analytics`
- Click **"Create Droplet"**

## 🔧 Setting Up Your Droplet

### Initial Server Setup (SSH into your droplet)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MySQL
sudo apt install mysql-server -y
sudo mysql_secure_installation

# Install PM2 (Process Manager)
sudo npm install -g pm2

# Install Nginx (Web Server)
sudo apt install nginx -y

# Install Git
sudo apt install git -y
```

### Clone and Setup Your Project

```bash
# Clone your repository
git clone https://github.com/Banuweb3/TRACKERBINLP.git
cd TRACKERBINLP

# Setup Frontend
npm install
npm run build

# Setup Backend
cd server
npm install

# Setup environment variables
sudo nano .env
```

### Environment Variables (.env file)
```bash
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=bpo_user
DB_PASSWORD=your_secure_password
DB_NAME=bpo_analytics
JWT_SECRET=your_super_secure_jwt_secret_here
API_KEY=your_gemini_api_key_1
API_KEY_2=your_gemini_api_key_2
# ... add all your API keys
```

### Setup MySQL Database

```bash
# Login to MySQL
sudo mysql -u root -p

# Create database and user
CREATE DATABASE bpo_analytics;
CREATE USER 'bpo_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON bpo_analytics.* TO 'bpo_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Initialize database schema
cd /path/to/your/project/server
node scripts/setupDatabase.js
```

### Setup Nginx (Web Server)

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/bpo-analytics
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain

    # Frontend (React build)
    location / {
        root /path/to/your/project/dist;
        try_files $uri $uri/ /index.html;
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
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/bpo-analytics /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Start Your Application

```bash
# Start backend with PM2
cd /path/to/your/project/server
pm2 start server.js --name "bpo-backend"

# Save PM2 configuration
pm2 save
pm2 startup
```

### Setup SSL Certificate (Optional but Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

## 🔒 Security Setup

### Firewall Configuration
```bash
# Enable UFW firewall
sudo ufw enable

# Allow SSH, HTTP, HTTPS
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# Check status
sudo ufw status
```

### Regular Updates
```bash
# Create update script
sudo nano /usr/local/bin/update-system.sh
```

Add:
```bash
#!/bin/bash
apt update && apt upgrade -y
npm update -g
pm2 update
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/update-system.sh

# Add to crontab (weekly updates)
sudo crontab -e
# Add: 0 2 * * 0 /usr/local/bin/update-system.sh
```

## 📊 Monitoring

### PM2 Monitoring
```bash
# Check application status
pm2 status
pm2 logs
pm2 monit

# Restart if needed
pm2 restart bpo-backend
```

### System Monitoring
```bash
# Check system resources
htop
df -h
free -h

# Check Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 💰 Cost Comparison

### Droplet Costs:
- **Basic Droplet**: $12/month
- **Database**: Self-hosted (included)
- **Total**: ~$12/month

### App Platform Costs:
- **App Platform**: $12/month
- **Managed Database**: $15/month
- **Total**: ~$27/month

## 🤔 When to Choose Droplet:

✅ **Choose Droplet if:**
- You want full server control
- You're comfortable with Linux administration
- You want to save money long-term
- You need custom server configurations

❌ **Avoid Droplet if:**
- You want easy deployment
- You don't want to manage servers
- You prefer automatic scaling
- You want managed services

## 🎯 Recommendation for Your Project:

**Stick with App Platform** because:
1. Your project is already configured for it
2. Much easier deployment and management
3. Automatic scaling and SSL
4. Built-in CI/CD from GitHub
5. Less maintenance overhead

The extra $15/month for managed services is worth it for the convenience and reliability! 🚀
