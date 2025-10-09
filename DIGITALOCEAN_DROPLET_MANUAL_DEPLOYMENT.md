# DigitalOcean Droplet - Manual Deployment Guide
## BPO Analytics Platform - Step by Step

---

## 📋 Prerequisites

- DigitalOcean Account
- GitHub Account with repository: `https://github.com/Banuweb3/TRACKERBINLP.git`
- SSH client (PuTTY for Windows, Terminal for Mac/Linux)
- 30-45 minutes of time

---

## 🚀 STEP 1: Create DigitalOcean Droplet

### 1.1 Login to DigitalOcean
1. Go to https://cloud.digitalocean.com
2. Login with your credentials
3. Click **Create** → **Droplets**

### 1.2 Choose Droplet Configuration

**Choose an image:**
- Select: **Ubuntu 22.04 (LTS) x64**

**Choose Size:**
- **Basic Plan**
- **Regular Intel with SSD**
- Select: **$12/month** (2 GB RAM / 1 vCPU / 50 GB SSD)
  - Minimum recommended: $6/month (1 GB RAM) - may be slow
  - Recommended: $12/month (2 GB RAM) - better performance

**Choose a datacenter region:**
- Select: **Bangalore (BLR1)** (closest to India)
- Alternative: **Singapore (SGP1)**

**Authentication:**
- Select: **SSH keys** (Recommended) OR **Password**
- If password: Choose a strong password (you'll need this to login)

**Finalize Details:**
- Hostname: `bpo-analytics-server`
- Tags: `bpo`, `analytics`, `production`
- Click **Create Droplet**

### 1.3 Wait for Droplet Creation
- Wait 1-2 minutes for droplet to be created
- Note down the **IP Address** (e.g., 139.59.41.249)

---

## 🔐 STEP 2: Connect to Your Droplet

### 2.1 For Windows Users (Using PuTTY or PowerShell)

**Option A: Using PowerShell (Recommended)**
```powershell
ssh root@YOUR_DROPLET_IP
```
Replace `YOUR_DROPLET_IP` with your actual IP address.

**Option B: Using PuTTY**
1. Download PuTTY from https://www.putty.org/
2. Open PuTTY
3. Enter your droplet IP in "Host Name"
4. Port: 22
5. Click "Open"
6. Login as: `root`
7. Enter your password

### 2.2 For Mac/Linux Users
```bash
ssh root@YOUR_DROPLET_IP
```

### 2.3 First Login
- Type `yes` when asked about fingerprint
- Enter your password
- You should now see: `root@bpo-analytics-server:~#`

---

## 📦 STEP 3: System Update & Install Dependencies

### 3.1 Update System Packages
```bash
apt update && apt upgrade -y
```
⏱️ Wait 2-3 minutes

### 3.2 Install Essential Packages
```bash
apt install -y curl wget git nginx mysql-server ufw htop nano
```
⏱️ Wait 2-3 minutes

### 3.3 Install Node.js 18
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs
```
⏱️ Wait 1-2 minutes

### 3.4 Verify Installations
```bash
node --version    # Should show v18.x.x
npm --version     # Should show 9.x.x or higher
nginx -v          # Should show nginx version
mysql --version   # Should show mysql version
```

### 3.5 Install PM2 (Process Manager)
```bash
npm install -g pm2
```
⏱️ Wait 1 minute

---

## 🗄️ STEP 4: Setup MySQL Database

### 4.1 Start MySQL Service
```bash
systemctl start mysql
systemctl enable mysql
```

### 4.2 Secure MySQL Installation
```bash
mysql_secure_installation
```

**Answer the prompts:**
- Press Enter for current password (no password yet)
- Set root password? **Y**
- New password: `Banu@1234` (or your preferred password)
- Re-enter password: `Banu@1234`
- Remove anonymous users? **Y**
- Disallow root login remotely? **Y**
- Remove test database? **Y**
- Reload privilege tables? **Y**

### 4.3 Create Database and User
```bash
mysql -u root -p
```
Enter password: `Banu@1234`

**In MySQL prompt, run these commands:**
```sql
CREATE DATABASE bpo_analytics;
CREATE USER 'bpo_user'@'localhost' IDENTIFIED BY 'Banu@1234';
GRANT ALL PRIVILEGES ON bpo_analytics.* TO 'bpo_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 4.4 Test Database Connection
```bash
mysql -u bpo_user -pBanu@1234 bpo_analytics -e "SELECT 1;"
```
✅ Should show: `1` in output

---

## 📥 STEP 5: Clone and Setup Application

### 5.1 Create Application Directory
```bash
mkdir -p /var/www
cd /var/www
```

### 5.2 Clone Repository
```bash
git clone https://github.com/Banuweb3/TRACKERBINLP.git bpo-analytics
cd bpo-analytics
```
⏱️ Wait 1-2 minutes

### 5.3 Setup Backend

#### 5.3.1 Navigate to Server Directory
```bash
cd /var/www/bpo-analytics/server
```

#### 5.3.2 Create .npmrc File (Fix npm issues)
```bash
cat > .npmrc << 'EOF'
optional=false
fund=false
audit=false
engine-strict=false
legacy-peer-deps=true
EOF
```

#### 5.3.3 Install Backend Dependencies
```bash
npm install
```
⏱️ Wait 3-5 minutes

**If you see errors, try:**
```bash
npm install --legacy-peer-deps
```

#### 5.3.4 Create Production Environment File
```bash
nano .env.production
```

**Paste this content (press Ctrl+Shift+V):**
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=bpo_user
DB_PASSWORD=Banu@1234
DB_NAME=bpo_analytics

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_make_it_very_long_and_secure_12345678
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3001
NODE_ENV=production
FRONTEND_URL=http://YOUR_DROPLET_IP

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Gemini API Keys
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

# Facebook/Instagram API Configuration
FACEBOOK_ACCESS_TOKEN=EAAR4Qlwlv10BPUPtkc8MAYIhKpTRDO7u91ZAb3Sl2ltWD8jHBTvZCTAwJGExZCSgsOcZAWryHsyPwZABHbe9PajGDudjE62jZB3uD7EuMdRYpOPH2bl0p1MoEcIEAZCIvKPz2iO8dd0dXlfKJ7I7PKtTzkv4k1AiW7lz9n9gjaXzhdzzztyLuZBJZCN8ltHMNTQFf
FACEBOOK_APP_SECRET=ae57700e20903c511cff0fdb5b6e5f16
FACEBOOK_APP_ID=your_app_id_here
FACEBOOK_AD_ACCOUNT_INSTAGRAM=act_837599231811269
FACEBOOK_AD_ACCOUNT_FACEBOOK=act_782436794463558
FACEBOOK_PAGE_HARISHSHOPPY_ID=613327751869662
FACEBOOK_PAGE_HARISHSHOPPY_TOKEN=EAAR4Qlwlv10BPXWTfwPAYdnrYhZBBnsFfQZBFUTBk4hJDya6mTisY3bZBSYVGNZCv7Ord9dkApwIkmZBZBXrDwYI8ikrc1Nz8iZBsaw71p00ECWUM1TRqWzUKmhu2sUTPmGI6vSMzDSPArZAokpCpZCZCemQosEZAbTmAW25VT9sKtc8jnw4MkQn8ewkK1V7ZB6Ycax2yKuxUKT7A5HxyjLxdevXvNf7y6UeAwZBHhmqA6ZAkZD
FACEBOOK_PAGE_ADAMANDEVE_ID=665798336609925
FACEBOOK_PAGE_ADAMANDEVE_TOKEN=EAAR4Qlwlv10BPYE9lrIiThaS7zziBrfMkAFXBDRl9egwvyEw9KE2ORsoVeMLheKXIXTZAgrjHvZBOChBrSW402fQ99vVLc3a1ZAVlTJTnsqAARrV3ZAaupV2bZAW3Bxyt9r8f3SCjW62PwDOyZCyZB2lgP085A2Gl4H208G8o3MTaCQvQa4tM0uHSzWJEsrDIBtDZAEQ23MzgQjCdu4NPVNLgEob3GbIAaavvN9IYZCkzvgZDZD
```

**⚠️ IMPORTANT: Replace `YOUR_DROPLET_IP` with your actual droplet IP address!**

**Save and exit:**
- Press `Ctrl + X`
- Press `Y`
- Press `Enter`

#### 5.3.5 Copy to .env
```bash
cp .env.production .env
```

#### 5.3.6 Set Secure Permissions
```bash
chmod 600 .env.production .env
```

### 5.4 Setup Frontend

#### 5.4.1 Navigate to Root Directory
```bash
cd /var/www/bpo-analytics
```

#### 5.4.2 Create .npmrc for Frontend
```bash
cat > .npmrc << 'EOF'
optional=false
fund=false
audit=false
engine-strict=false
legacy-peer-deps=true
EOF
```

#### 5.4.3 Install Frontend Dependencies
```bash
npm install --legacy-peer-deps
```
⏱️ Wait 5-10 minutes (this is the longest step)

**If you see memory errors:**
```bash
export NODE_OPTIONS="--max-old-space-size=2048"
npm install --legacy-peer-deps
```

#### 5.4.4 Create Frontend Environment File
```bash
nano .env.production
```

**Paste this content:**
```env
VITE_API_URL=http://YOUR_DROPLET_IP/api
```

**⚠️ Replace `YOUR_DROPLET_IP` with your actual IP!**

**Save and exit:** `Ctrl + X`, `Y`, `Enter`

#### 5.4.5 Build Frontend
```bash
npm run build
```
⏱️ Wait 2-5 minutes

**Verify build succeeded:**
```bash
ls -la dist/
```
✅ Should show files like `index.html`, `assets/`, etc.

---

## 🗄️ STEP 6: Initialize Database

### 6.1 Navigate to Server Directory
```bash
cd /var/www/bpo-analytics/server
```

### 6.2 Run Database Setup Script
```bash
node scripts/setupDatabase.js
```

✅ You should see:
- ✅ Connected to MySQL server
- ✅ Database schema created successfully
- ✅ Default admin user created
- 📧 Email: admin@bpo-analytics.com
- 🔑 Password: admin123

---

## 🌐 STEP 7: Configure Nginx (Web Server)

### 7.1 Get Your Droplet IP
```bash
curl -s http://checkip.amazonaws.com
```
📝 Note this IP address

### 7.2 Create Nginx Configuration
```bash
nano /etc/nginx/sites-available/bpo-analytics
```

**Paste this configuration (replace YOUR_DROPLET_IP with your actual IP):**
```nginx
server {
    listen 80;
    server_name YOUR_DROPLET_IP;

    # Frontend (React app)
    location / {
        root /var/www/bpo-analytics/dist;
        index index.html;
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
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

        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
```

**Save and exit:** `Ctrl + X`, `Y`, `Enter`

### 7.3 Enable the Site
```bash
rm -f /etc/nginx/sites-enabled/default
ln -s /etc/nginx/sites-available/bpo-analytics /etc/nginx/sites-enabled/
```

### 7.4 Test Nginx Configuration
```bash
nginx -t
```
✅ Should show: `syntax is ok` and `test is successful`

### 7.5 Restart Nginx
```bash
systemctl restart nginx
systemctl enable nginx
```

### 7.6 Check Nginx Status
```bash
systemctl status nginx
```
✅ Should show: `active (running)`
Press `q` to exit

---

## 🚀 STEP 8: Start Application with PM2

### 8.1 Navigate to Server Directory
```bash
cd /var/www/bpo-analytics/server
```

### 8.2 Create PM2 Ecosystem File
```bash
nano ecosystem.config.js
```

**Paste this content:**
```javascript
module.exports = {
  apps: [{
    name: 'bpo-backend',
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
    log_file: '/var/log/bpo-analytics/combined.log',
    min_uptime: '10s',
    max_restarts: 10,
    kill_timeout: 5000,
    restart_delay: 4000
  }]
};
```

**Save and exit:** `Ctrl + X`, `Y`, `Enter`

### 8.3 Create Log Directory
```bash
mkdir -p /var/log/bpo-analytics
```

### 8.4 Start Application with PM2
```bash
pm2 start ecosystem.config.js
```

✅ You should see:
```
┌─────┬──────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┐
│ id  │ name         │ status  │ ...     │          │        │      │           │
├─────┼──────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┤
│ 0   │ bpo-backend  │ online  │ ...     │          │        │      │           │
└─────┴──────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┘
```

### 8.5 Save PM2 Configuration
```bash
pm2 save
```

### 8.6 Setup PM2 Startup Script
```bash
pm2 startup systemd
```
Copy and run the command it shows (starts with `sudo env PATH=...`)

### 8.7 Check Application Logs
```bash
pm2 logs bpo-backend --lines 20
```

✅ Look for:
- ✅ Database connected successfully
- 🚀 BPO Analytics Server running on port 3001
- 📊 Environment: production

Press `Ctrl + C` to exit logs

### 8.8 Check PM2 Status
```bash
pm2 status
```

✅ Status should be: **online**

---

## 🔥 STEP 9: Configure Firewall

### 9.1 Allow SSH (Important - Don't skip!)
```bash
ufw allow ssh
ufw allow 22/tcp
```

### 9.2 Allow HTTP and HTTPS
```bash
ufw allow 80/tcp
ufw allow 443/tcp
```

### 9.3 Enable Firewall
```bash
ufw --force enable
```

### 9.4 Check Firewall Status
```bash
ufw status
```

✅ Should show:
```
Status: active
To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
```

---

## ✅ STEP 10: Verify Deployment

### 10.1 Test Backend Health
```bash
curl http://localhost:3001/health
```
✅ Should return JSON with `"status": "OK"`

### 10.2 Test Frontend
```bash
curl http://localhost
```
✅ Should return HTML content

### 10.3 Test from Browser
Open your browser and visit:
- **Frontend:** `http://YOUR_DROPLET_IP`
- **API Health:** `http://YOUR_DROPLET_IP/health`
- **Meta Dashboard:** `http://YOUR_DROPLET_IP/api/meta/health`

### 10.4 Login to Application
1. Go to `http://YOUR_DROPLET_IP`
2. Click **Login**
3. Enter credentials:
   - **Email:** `admin@bpo-analytics.com`
   - **Password:** `admin123`
4. Click **Sign In**

✅ You should be logged in!

---

## 🎉 DEPLOYMENT COMPLETE!

Your BPO Analytics Platform is now live at:
**http://YOUR_DROPLET_IP**

---

## 📊 Useful Management Commands

### Check Application Status
```bash
pm2 status
```

### View Application Logs
```bash
pm2 logs bpo-backend
pm2 logs bpo-backend --lines 50
pm2 logs bpo-backend --err  # Only errors
```

### Restart Application
```bash
pm2 restart bpo-backend
```

### Stop Application
```bash
pm2 stop bpo-backend
```

### Start Application
```bash
pm2 start bpo-backend
```

### Check Nginx Status
```bash
systemctl status nginx
```

### Restart Nginx
```bash
systemctl restart nginx
```

### Check MySQL Status
```bash
systemctl status mysql
```

### View Nginx Error Logs
```bash
tail -f /var/log/nginx/error.log
```

### Check Disk Space
```bash
df -h
```

### Check Memory Usage
```bash
free -h
```

### Check CPU Usage
```bash
htop
```
Press `q` to exit

---

## 🔧 Troubleshooting

### Problem: Application keeps restarting

**Check logs:**
```bash
pm2 logs bpo-backend --lines 100
```

**Common issues:**
1. **Database connection failed** - Check MySQL is running: `systemctl status mysql`
2. **Port already in use** - Check what's using port 3001: `lsof -i :3001`
3. **Out of memory** - Upgrade droplet or reduce memory usage

### Problem: 502 Bad Gateway

**Check if backend is running:**
```bash
pm2 status
curl http://localhost:3001/health
```

**Restart services:**
```bash
pm2 restart bpo-backend
systemctl restart nginx
```

### Problem: Can't access from browser

**Check firewall:**
```bash
ufw status
```

**Make sure ports 80 and 443 are allowed**

**Check Nginx:**
```bash
systemctl status nginx
nginx -t
```

### Problem: Database errors

**Check MySQL is running:**
```bash
systemctl status mysql
```

**Test database connection:**
```bash
mysql -u bpo_user -pBanu@1234 bpo_analytics -e "SELECT 1;"
```

**Restart MySQL:**
```bash
systemctl restart mysql
```

---

## 🔄 Updating Your Application

### Pull Latest Code from GitHub
```bash
cd /var/www/bpo-analytics
git pull origin main
```

### Update Backend
```bash
cd /var/www/bpo-analytics/server
npm install
pm2 restart bpo-backend
```

### Update Frontend
```bash
cd /var/www/bpo-analytics
npm install --legacy-peer-deps
npm run build
systemctl restart nginx
```

---

## 🔒 Security Recommendations

### 1. Change Default Admin Password
- Login to application
- Go to Settings → Change Password
- Use a strong password

### 2. Setup SSL Certificate (HTTPS)
```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com
```

### 3. Regular Updates
```bash
apt update && apt upgrade -y
```

### 4. Setup Automated Backups
```bash
# Create backup script
nano /root/backup.sh
```

**Add this content:**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u bpo_user -pBanu@1234 bpo_analytics > /root/backups/db_$DATE.sql
tar -czf /root/backups/app_$DATE.tar.gz /var/www/bpo-analytics
# Keep only last 7 days
find /root/backups -type f -mtime +7 -delete
```

```bash
chmod +x /root/backup.sh
mkdir -p /root/backups
```

**Setup daily cron job:**
```bash
crontab -e
```

**Add this line:**
```
0 2 * * * /root/backup.sh
```

---

## 📞 Support & Monitoring

### Monitor Application Health
```bash
pm2 monit
```

### Setup PM2 Web Dashboard (Optional)
```bash
pm2 install pm2-server-monit
```

### Check System Resources
```bash
htop
```

---

## 💰 Cost Breakdown

| Service | Cost |
|---------|------|
| Droplet (2GB RAM) | $12/month |
| **Total** | **$12/month** |

**Optional:**
- Domain name: ~$10/year
- SSL certificate: Free (Let's Encrypt)
- Backups: $2.40/month (20% of droplet cost)

---

## ✅ Deployment Checklist

- [ ] Droplet created and accessible via SSH
- [ ] System packages updated
- [ ] Node.js, Nginx, MySQL installed
- [ ] MySQL database created and secured
- [ ] Repository cloned
- [ ] Backend dependencies installed
- [ ] Frontend built successfully
- [ ] Database initialized
- [ ] Nginx configured
- [ ] Application running with PM2
- [ ] Firewall configured
- [ ] Application accessible from browser
- [ ] Can login with admin credentials
- [ ] Changed default admin password
- [ ] Backups configured (optional)
- [ ] SSL certificate installed (optional)

---

## 🎯 Next Steps

1. ✅ Test all features of the application
2. ✅ Change default admin password
3. ✅ Add custom domain (optional)
4. ✅ Setup SSL certificate for HTTPS
5. ✅ Configure automated backups
6. ✅ Setup monitoring alerts
7. ✅ Invite team members

---

**Congratulations! Your BPO Analytics Platform is now live! 🎉**

For issues or questions, check the logs:
```bash
pm2 logs bpo-backend
tail -f /var/log/nginx/error.log
```
