# DigitalOcean Droplet Deployment Guide for BPO Analytics Platform

## Prerequisites
- DigitalOcean Droplet (Ubuntu 20.04 or later recommended)
- Domain name (optional but recommended)
- SSH access to your Droplet

## Step 1: Initial Server Setup

### Connect to your Droplet
```bash
ssh root@your_droplet_ip
```

### Update the system
```bash
apt update && apt upgrade -y
```

### Install Node.js (v18 or later)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs
```

### Install MySQL
```bash
apt install mysql-server -y
mysql_secure_installation
```

### Create MySQL database and user
```bash
mysql -u root -p
```

In MySQL console:
```sql
CREATE DATABASE bpo_analytics;
CREATE USER 'bpo_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON bpo_analytics.* TO 'bpo_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Install PM2 (Process Manager)
```bash
npm install -g pm2
```

### Install Nginx (for reverse proxy)
```bash
apt install nginx -y
```

## Step 2: Deploy Your Application

### Clone your repository
```bash
cd /var/www
git clone https://github.com/Banuweb3/TRACKERBINLP.git
cd TRACKERBINLP
```

### Install dependencies
```bash
# Install frontend dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..
```

### Configure environment variables
```bash
cd server
cp .env.production .env
```

Edit the `.env` file with your production values:
```bash
nano .env
```

Update these values:
```env
DB_HOST=localhost
DB_USER=bpo_user
DB_PASSWORD=your_secure_password
FRONTEND_URL=http://your_droplet_ip
NODE_ENV=production
```

### Set up the database
```bash
# Run database initialization scripts
cd server
mysql -u bpo_user -p bpo_analytics < sql/bpo_analytics.sql
mysql -u bpo_user -p bpo_analytics < sql/bulk_analysis_tables.sql
# Run other SQL files as needed
```

### Build the frontend
```bash
cd /var/www/TRACKERBINLP
npm run build
```

### Start the backend with PM2
```bash
cd server
pm2 start server.js --name "bpo-backend"
pm2 save
pm2 startup
```

## Step 3: Configure Nginx

### Create Nginx configuration
```bash
nano /etc/nginx/sites-available/bpo-analytics
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your_droplet_ip;  # or your domain name

    # Frontend
    location / {
        root /var/www/TRACKERBINLP/dist;
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
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Enable the site
```bash
ln -s /etc/nginx/sites-available/bpo-analytics /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

## Step 4: Configure Firewall

```bash
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable
```

## Step 5: Test Your Deployment

### Check backend status
```bash
pm2 status
pm2 logs bpo-backend
```

### Test API endpoint
```bash
curl http://your_droplet_ip/health
```

### Check frontend
Open your browser and go to: `http://your_droplet_ip`

## Troubleshooting

### Backend not starting
1. Check PM2 logs: `pm2 logs bpo-backend`
2. Check environment variables: `cat server/.env`
3. Test database connection: `node server/test-db.js`

### Database connection issues
1. Check MySQL status: `systemctl status mysql`
2. Verify database exists: `mysql -u bpo_user -p -e "SHOW DATABASES;"`
3. Check user permissions: `mysql -u root -p -e "SHOW GRANTS FOR 'bpo_user'@'localhost';"`

### Frontend not loading
1. Check Nginx status: `systemctl status nginx`
2. Check Nginx logs: `tail -f /var/log/nginx/error.log`
3. Verify build files exist: `ls -la /var/www/TRACKERBINLP/dist/`

### API calls failing
1. Check CORS configuration in server
2. Verify FRONTEND_URL in .env matches your domain/IP
3. Check network connectivity between frontend and backend

## SSL Certificate (Optional but Recommended)

### Install Certbot
```bash
apt install certbot python3-certbot-nginx -y
```

### Get SSL certificate
```bash
certbot --nginx -d your_domain.com
```

## Maintenance Commands

### Update application
```bash
cd /var/www/TRACKERBINLP
git pull origin main
npm install
npm run build
cd server
npm install
pm2 restart bpo-backend
```

### View logs
```bash
pm2 logs bpo-backend
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Backup database
```bash
mysqldump -u bpo_user -p bpo_analytics > backup_$(date +%Y%m%d_%H%M%S).sql
```

## Environment Variables Reference

Make sure your `server/.env` file contains:
```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=bpo_user
DB_PASSWORD=your_secure_password
DB_NAME=bpo_analytics

# JWT
JWT_SECRET=your_very_long_and_secure_jwt_secret_key
JWT_EXPIRES_IN=24h

# Server
PORT=3001
NODE_ENV=production
FRONTEND_URL=http://your_droplet_ip

# API Keys (your existing Gemini keys)
API_KEY=AIzaSyDXUV16D4HGO23LuLxgl6jnYlHyxsYpJIY
# ... (all your other API keys)
```

## Support

If you encounter issues:
1. Check the logs first
2. Verify all environment variables are set correctly
3. Ensure all services are running (MySQL, Nginx, PM2)
4. Test each component individually (database, backend, frontend)
