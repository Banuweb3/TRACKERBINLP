# 🚀 DigitalOcean Deployment Guide for BPO Analytics Platform

## 📋 Prerequisites
- DigitalOcean account
- GitHub repository with your code
- Credit card for DigitalOcean billing

## 🗄️ Step 1: Create Managed Database

### 1.1 Create Database
1. Go to [DigitalOcean Databases](https://cloud.digitalocean.com/databases)
2. Click **"Create Database"**
3. Configure:
   - **Engine**: MySQL 8.0
   - **Plan**: Basic ($15/month minimum)
   - **Region**: Choose closest to your users
   - **Database Name**: `bpo-analytics-db`
   - **Database User**: `bpo_user` (or keep default)

### 1.2 Configure Security
1. **Trusted Sources**: 
   - Add "App Platform" (will auto-detect your app)
   - Optionally add your IP for direct access
2. **Connection Details**: Note these for later
   - Host, Port, Username, Password, Database Name

## 🚀 Step 2: Deploy App Platform

### 2.1 Create App
1. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Click **"Create App"**
3. Choose **"GitHub"** as source
4. Select your repository: `bpo_call_version5`
5. Choose branch: `main`

### 2.2 Configure Components

#### Frontend Component:
- **Type**: Static Site
- **Source Directory**: `/` (root)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**: (none needed for frontend)

#### Backend Component:
- **Type**: Service
- **Source Directory**: `/server`
- **Build Command**: `npm install`
- **Run Command**: `npm start`
- **Port**: `3001`

### 2.3 Add Database Resource
1. In App Platform, go to **"Resources"**
2. Click **"Add Resource"** → **"Database"**
3. Select your created database: `bpo-analytics-db`
4. This automatically adds environment variables:
   - `${db.HOSTNAME}`
   - `${db.PORT}`
   - `${db.USERNAME}`
   - `${db.PASSWORD}`
   - `${db.DATABASE}`

### 2.4 Configure Environment Variables

#### App-Level Environment Variables:
```bash
NODE_ENV=production
JWT_SECRET=your_super_secure_jwt_secret_key_here_make_it_long_and_random_for_production
FRONTEND_URL=${frontend.PUBLIC_URL}
CORS_ORIGIN=${frontend.PUBLIC_URL}
```

#### Add Your Gemini API Keys:
```bash
API_KEY=your_gemini_api_key_1
API_KEY_2=your_gemini_api_key_2
API_KEY_3=your_gemini_api_key_3
# ... add all your API keys
```

## 🔧 Step 3: Fix Common Issues

### 3.1 Rollup Build Issue (Already Fixed)
✅ Your project already has these fixes:
- `.npmrc` with `optional=false`
- Platform-specific Rollup dependencies
- Enhanced Vite configuration

### 3.2 Database Connection
✅ Your server automatically:
- Sets up database schema on startup
- Creates default admin user
- Provides detailed connection logging

## 🎯 Step 4: Deploy and Test

### 4.1 Deploy
1. Click **"Create Resources"**
2. Wait for deployment (5-10 minutes)
3. Monitor build logs for any errors

### 4.2 Test Database Connection
1. Check server logs for:
   ```
   🗄️ Setting up database...
   ✅ Database bpo_analytics created or already exists
   ✅ Database schema created successfully
   👤 Creating default admin user...
   ✅ Default admin user created
   ```

### 4.3 Access Your App
1. **Frontend URL**: Provided in App Platform dashboard
2. **Backend API**: `https://your-app-name-backend.ondigitalocean.app`
3. **Default Login**:
   - Email: `admin@bpo-analytics.com`
   - Password: `admin123` (CHANGE THIS!)

## 🔍 Step 5: Troubleshooting

### Build Failures
- Check build logs in App Platform
- Ensure all dependencies are in `package.json`
- Verify `.npmrc` configuration

### Database Connection Issues
- Verify database is in same region as app
- Check environment variables are properly set
- Review server logs for connection details

### API Issues
- Ensure Gemini API keys are valid
- Check CORS configuration
- Verify JWT secret is set

## 🔒 Step 6: Security & Production Setup

### 6.1 Change Default Credentials
1. Login with default admin account
2. Create new admin user with strong password
3. Delete or disable default admin account

### 6.2 Environment Variables
- Use strong JWT secret (64+ characters)
- Rotate API keys regularly
- Monitor usage and costs

### 6.3 Database Security
- Enable SSL connections
- Regular backups (DigitalOcean handles this)
- Monitor connection logs

## 💰 Cost Estimation

### Monthly Costs:
- **App Platform**: $12/month (Basic)
- **Managed Database**: $15/month (Basic)
- **Total**: ~$27/month

### Scaling Options:
- Upgrade database for more connections
- Add more app instances for high traffic
- Use CDN for static assets

## 📞 Support

If you encounter issues:
1. Check DigitalOcean documentation
2. Review server logs in App Platform
3. Test database connection directly
4. Contact DigitalOcean support if needed

---

## 🎉 Success Checklist

- [ ] Database created and connected
- [ ] App deployed successfully
- [ ] Frontend accessible
- [ ] Backend API responding
- [ ] Database schema initialized
- [ ] Default admin user created
- [ ] API keys configured
- [ ] SSL certificates active

Your BPO Analytics Platform should now be live and ready for use! 🚀
