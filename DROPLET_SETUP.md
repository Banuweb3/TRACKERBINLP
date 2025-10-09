# Droplet Deployment Instructions

## Run these commands in your droplet console:

```bash
# Set environment variable for database password
export DB_PASSWORD="YOUR_DATABASE_PASSWORD_HERE"

# Update the repository
cd TRACKERBINLP
git pull origin main

# Install dependencies
cd server
npm install

# Restart the backend with PM2
pm2 delete bpo-backend 2>/dev/null || true
pm2 start droplet-server.js --name "bpo-backend"

# Rebuild and restart frontend
cd ..
npm install --legacy-peer-deps
npm run build
pm2 delete bpo-frontend 2>/dev/null || true
pm2 serve dist 80 --name "bpo-frontend"

# Save PM2 configuration
pm2 save

# Check status
pm2 status
```

## Test the deployment:
- Frontend: http://165.22.158.48
- Backend Health: http://165.22.158.48:3001/health
- Should show database connection status

## Environment Variables Set:
- DB_PASSWORD: Your database password (replace YOUR_DATABASE_PASSWORD_HERE)
- All other database config is in the code
