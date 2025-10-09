# Minimal Project Fix - No System Changes

## 🎯 Goal: Fix ONLY your BPO project without affecting existing Droplet setup

### Step 1: Check Current Project Status (Safe - No Changes)
```bash
# SSH into your droplet
ssh root@your_droplet_ip

# Navigate to your project (wherever it is)
cd /path/to/your/bpo_project/server

# Run safe diagnostic
node check-current-setup.js
```

### Step 2: Fix Environment Variables (Project Only)
```bash
# In your project's server directory
cd /path/to/your/bpo_project/server

# Check if .env exists
ls -la .env

# If .env doesn't exist, copy from template
cp .env.production .env

# Edit ONLY the .env file for your project
nano .env
```

Update only these values in YOUR project's .env:
```env
# Use existing database or create new one for your project
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_existing_user  # Don't change system users
DB_PASSWORD=your_existing_password
DB_NAME=bpo_analytics  # Your project's database name

# Update with your droplet IP
FRONTEND_URL=http://YOUR_DROPLET_IP

# Keep existing values
NODE_ENV=production
PORT=3001  # Or different port if 3001 is used
```

### Step 3: Create Database for Your Project Only
```bash
# Connect to existing MySQL (don't install new one)
mysql -u your_existing_user -p

# Create ONLY your project's database
CREATE DATABASE IF NOT EXISTS bpo_analytics;
EXIT;
```

### Step 4: Initialize Your Project's Database
```bash
# In your project directory
cd /path/to/your/bpo_project/server

# Initialize only your project's tables
node scripts/setupDatabase.js

# Or manually run SQL files
mysql -u your_existing_user -p bpo_analytics < sql/bpo_analytics.sql
mysql -u your_existing_user -p bpo_analytics < sql/bulk_analysis_tables.sql
```

### Step 5: Start Your Project's Backend (Different Port if Needed)
```bash
# Check what ports are in use
netstat -tlnp | grep :3001

# If 3001 is used, change PORT in .env to 3002 or 3003
nano .env  # Change PORT=3002

# Start your backend
node server.js

# Or use PM2 with different name
pm2 start server.js --name "bpo-backend-new"
```

### Step 6: Update Frontend Configuration (If Needed)
```bash
# In your project's frontend
cd /path/to/your/bpo_project

# Check if frontend is configured for correct backend port
# Look for API calls in your frontend code
grep -r "3001" src/  # or wherever your frontend code is

# If needed, rebuild frontend with correct backend URL
npm run build
```

### Step 7: Test Your Project Only
```bash
# Test backend health
curl http://localhost:3001/health  # or your chosen port

# Test from outside
curl http://YOUR_DROPLET_IP:3001/health
```

## 🔒 What This Approach DOES NOT Do:
- ❌ Install new MySQL server
- ❌ Change system users
- ❌ Modify existing Nginx configuration
- ❌ Install system packages
- ❌ Change firewall rules
- ❌ Affect other running applications

## ✅ What This Approach DOES:
- ✅ Fix only your project's configuration
- ✅ Create only your project's database
- ✅ Start only your project's backend
- ✅ Use existing system resources safely

## 🚨 If You Get "Port Already in Use" Error:
```bash
# Find what's using the port
sudo netstat -tlnp | grep :3001

# Change your project's port in .env
nano .env
# Change PORT=3002 (or any available port)

# Update frontend to use new port if needed
```

## 🚨 If Database Connection Fails:
```bash
# Check existing MySQL users
mysql -u root -p -e "SELECT user, host FROM mysql.user;"

# Use existing user credentials in your .env file
# Don't create new users if not needed
```

## 🔍 Troubleshooting Commands (Safe):
```bash
# Check your project's status
pm2 list | grep bpo
ps aux | grep node
netstat -tlnp | grep node

# Check your project's logs
pm2 logs bpo-backend-new
tail -f /var/log/your-project.log
```

## 📝 Summary:
This approach fixes your BPO project by:
1. Using existing system resources
2. Creating only project-specific database
3. Running on available port
4. Not interfering with existing setup

Your existing applications will continue running normally!
