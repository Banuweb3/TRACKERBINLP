# 🖥️ BPO Analytics Platform - Droplet Deployment Guide

## 🚀 Step-by-Step Droplet Setup

### Step 1: Create Your Droplet

1. **Go to DigitalOcean Droplets:**
   - Visit: https://cloud.digitalocean.com/droplets
   - Click **"Create Droplet"**

2. **Choose Configuration:**
   ```
   Distribution: Ubuntu 22.04 LTS
   Plan: Basic
   CPU Options: Regular Intel ($24/month - 4GB RAM, 2 vCPUs, 80GB SSD)
   Datacenter: Choose closest to your users
   Authentication: SSH Key (recommended) or Password
   Hostname: bpo-analytics-server
   ```

3. **Click "Create Droplet"** and wait 2-3 minutes

### Step 2: Connect to Your Droplet

```bash
# SSH into your droplet (replace YOUR_DROPLET_IP)
ssh root@YOUR_DROPLET_IP

# If using password, you'll be prompted to enter it
```

### Step 3: Run the Automated Setup Script

```bash
# Download and run the setup script
curl -fsSL https://raw.githubusercontent.com/Banuweb3/TRACKERBINLP/main/droplet-setup.sh -o setup.sh
chmod +x setup.sh
./setup.sh
```

**OR manually copy the script:**

```bash
# Create the setup script
nano setup.sh
# Copy the entire content from droplet-setup.sh file
# Save with Ctrl+X, Y, Enter

# Make executable and run
chmod +x setup.sh
./setup.sh
```

### Step 4: Configure Your API Keys

After the setup completes:

```bash
# Edit the environment file
nano /var/www/bpo-analytics/server/.env

# Add your actual Gemini API keys:
API_KEY=AIzaSyA87I2mshoMLktcbPdFvI1v2VAvo2SdK2E
API_KEY_2=AIzaSyDXUV16D4HGO23LuLxgl6jnYlHyxsYpJIY
API_KEY_3=AIzaSyBdWERbTOAFv6AGFlm7IGDNowkR8gafewA
# ... add all your keys

# Save with Ctrl+X, Y, Enter
```

### Step 5: Restart the Application

```bash
# Restart the backend to load new environment variables
pm2 restart bpo-backend

# Check status
pm2 status
pm2 logs bpo-backend
```

### Step 6: Configure Domain (Optional)

If you have a domain name:

```bash
# Edit Nginx configuration
sudo nano /etc/nginx/sites-available/bpo-analytics

# Change this line:
server_name _;
# To:
server_name yourdomain.com www.yourdomain.com;

# Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx
```

### Step 7: Setup SSL Certificate (Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

## 🔧 Post-Setup Configuration

### Check Everything is Working

```bash
# Check all services
sudo systemctl status nginx
sudo systemctl status mysql
pm2 status

# Check application logs
pm2 logs bpo-backend

# Test database connection
cd /var/www/bpo-analytics/server
node -e "
const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: 'localhost',
  user: 'bpo_user',
  password: 'BpoAnalytics2024!',
  database: 'bpo_analytics'
});
pool.getConnection().then(() => console.log('✅ Database connected')).catch(console.error);
"
```

### Access Your Application

- **Without Domain**: `http://YOUR_DROPLET_IP`
- **With Domain**: `http://yourdomain.com`
- **With SSL**: `https://yourdomain.com`

### Default Login Credentials

```
Email: admin@bpo-analytics.com
Password: admin123
```

**⚠️ IMPORTANT: Change these credentials immediately after first login!**

## 🔄 Deployment Updates

### For Future Updates

```bash
# SSH into your droplet
ssh root@YOUR_DROPLET_IP

# Run deployment script
cd /var/www/bpo-analytics
./deploy-to-droplet.sh
```

### Manual Update Process

```bash
# Pull latest code
cd /var/www/bpo-analytics
git pull origin main

# Update frontend
npm install
npm run build

# Update backend
cd server
npm install
pm2 restart bpo-backend

# Reload Nginx
sudo systemctl reload nginx
```

## 📊 Monitoring and Maintenance

### Check Application Status

```bash
# PM2 status
pm2 status
pm2 logs bpo-backend
pm2 monit

# System resources
htop
df -h
free -h

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Backup Database

```bash
# Create backup
mysqldump -u bpo_user -p bpo_analytics > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
mysql -u bpo_user -p bpo_analytics < backup_file.sql
```

### Update System

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Node.js packages
npm update -g
cd /var/www/bpo-analytics && npm update
cd server && npm update

# Restart application
pm2 restart bpo-backend
```

## 🔒 Security Best Practices

### Firewall Configuration

```bash
# Check firewall status
sudo ufw status

# Allow only necessary ports
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### Regular Security Updates

```bash
# Create update script
sudo nano /usr/local/bin/security-update.sh
```

Add this content:
```bash
#!/bin/bash
apt update && apt upgrade -y
npm audit fix
pm2 update
systemctl restart nginx
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/security-update.sh

# Add to crontab (weekly updates)
sudo crontab -e
# Add: 0 2 * * 0 /usr/local/bin/security-update.sh
```

## 🚨 Troubleshooting

### Common Issues

#### Backend Not Starting
```bash
# Check logs
pm2 logs bpo-backend

# Check environment variables
cd /var/www/bpo-analytics/server
cat .env

# Restart with verbose logging
pm2 restart bpo-backend --log-type json
```

#### Database Connection Issues
```bash
# Check MySQL status
sudo systemctl status mysql

# Test database connection
mysql -u bpo_user -p bpo_analytics

# Check database exists
mysql -u root -p -e "SHOW DATABASES;"
```

#### Nginx Issues
```bash
# Test configuration
sudo nginx -t

# Check status
sudo systemctl status nginx

# Restart Nginx
sudo systemctl restart nginx
```

#### Frontend Not Loading
```bash
# Check if build exists
ls -la /var/www/bpo-analytics/dist/

# Rebuild frontend
cd /var/www/bpo-analytics
npm run build

# Check Nginx configuration
sudo nano /etc/nginx/sites-available/bpo-analytics
```

## 💰 Cost Breakdown

### Monthly Costs:
- **Droplet (4GB RAM)**: $24/month
- **Backups**: +$4.80/month (optional)
- **Domain**: ~$12/year
- **SSL**: Free (Let's Encrypt)

**Total**: ~$24-29/month

## 🎯 Performance Optimization

### Enable Gzip Compression
```bash
sudo nano /etc/nginx/nginx.conf
```

Add in http block:
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
```

### PM2 Cluster Mode
```bash
# Start with cluster mode (uses all CPU cores)
pm2 start server.js --name "bpo-backend" -i max
```

### Database Optimization
```bash
# Edit MySQL configuration
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf

# Add optimizations:
innodb_buffer_pool_size = 1G
query_cache_type = 1
query_cache_size = 64M
```

## 🎉 Success Checklist

- [ ] Droplet created and accessible via SSH
- [ ] All services installed (Node.js, MySQL, Nginx, PM2)
- [ ] Repository cloned and dependencies installed
- [ ] Database created and schema initialized
- [ ] Environment variables configured with API keys
- [ ] Nginx configured and serving the application
- [ ] Backend running via PM2
- [ ] Application accessible via browser
- [ ] Default admin user login works
- [ ] SSL certificate installed (if using domain)
- [ ] Firewall configured
- [ ] Monitoring setup

Your BPO Analytics Platform is now live on your Droplet! 🚀
