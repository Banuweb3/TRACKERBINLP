# 🚀 BPO Analytics Platform - Complete Setup Guide

## 📋 Prerequisites

- Ubuntu/Debian server
- Root access
- Internet connection
- Domain name (optional, can use IP)

## 🛠️ Quick Deployment (Automated)

### Option 1: One-Command Deployment
```bash
# Download and run the deployment script
curl -fsSL https://raw.githubusercontent.com/Banuweb3/TRACKERBINLP/main/deploy.sh | bash
```

### Option 2: Manual Deployment
```bash
# 1. Clone the repository
git clone https://github.com/Banuweb3/TRACKERBINLP.git
cd TRACKERBINLP

# 2. Run the deployment script
chmod +x deploy.sh
./deploy.sh
```

## 🔧 Manual Setup (If Automated Fails)

### 1. Install Dependencies
```bash
# Update system
apt update && apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
apt install -y nodejs

# Install PM2
npm install -g pm2

# Install Nginx
apt install -y nginx

# Install MySQL
apt install -y mysql-server
```

### 2. Database Setup
```bash
# Create database and user
mysql -e "CREATE DATABASE bpo_analytics;"
mysql -e "CREATE USER 'bpo_user'@'localhost' IDENTIFIED BY 'SecurePassword123!';"
mysql -e "GRANT ALL PRIVILEGES ON bpo_analytics.* TO 'bpo_user'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"
```

### 3. Application Setup
```bash
# Install dependencies
npm install

# Build frontend
npm run build

# Copy environment file and configure
cp .env.example .env
nano .env  # Update database credentials
```

### 4. Nginx Configuration
```bash
# Copy Nginx configuration
cp nginx.conf /etc/nginx/sites-available/bpo-analytics

# Enable site
ln -sf /etc/nginx/sites-available/bpo-analytics /etc/nginx/sites-enabled/

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
nginx -t
systemctl restart nginx
```

### 5. Start Application
```bash
# Start with PM2
pm2 start server/droplet-server.js --name bpo-backend

# Or start with systemd (more reliable)
systemctl enable bpo-analytics
systemctl start bpo-analytics
```

## 🌐 HTTPS Setup (Recommended)

```bash
# Install certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d yourdomain.com

# Or for IP address
certbot certonly --standalone -d your-server-ip
```

## 🔍 Testing

```bash
# Test health endpoint
curl http://localhost:3001/health

# Test session creation
curl -X POST http://localhost:3001/api/analysis/sessions \
  -H "Content-Type: application/json" \
  -d '{"sessionName": "test", "sourceLanguage": "en"}'

# Test complete analysis
curl -X POST http://localhost:3001/api/analysis/complete \
  -H "Content-Type: application/json" \
  -d '{"sessionId": 123}'
```

## 🚨 Troubleshooting

### Backend Not Starting
```bash
# Check PM2 logs
pm2 logs bpo-backend

# Check syntax
node -c server/droplet-server.js

# Check if port is in use
netstat -tlnp | grep :3001
```

### Frontend Issues
```bash
# Clear browser cache completely
# Press: Ctrl + Shift + Delete
# Select all cache options

# Hard refresh
# Press: Ctrl + Shift + R
```

### Database Connection Issues
```bash
# Check MySQL status
systemctl status mysql

# Test database connection
mysql -u bpo_user -p bpo_analytics
```

## 📁 File Structure

```
├── server/                 # Backend Node.js application
│   └── droplet-server.js   # Main server file
├── src/                    # Frontend React application
├── nginx.conf             # Nginx configuration
├── deploy.sh              # Automated deployment script
├── package.json           # Dependencies
└── README.md             # This file
```

## 🔒 Security Notes

1. **Change default passwords** in `.env` file
2. **Update JWT secret** for production
3. **Set up HTTPS** for microphone access
4. **Configure firewall** rules as needed

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review PM2 logs: `pm2 logs`
3. Check Nginx logs: `/var/log/nginx/error.log`
4. Test individual components step by step

---

**🎉 Your BPO Analytics Platform is ready for audio upload and analysis!**
