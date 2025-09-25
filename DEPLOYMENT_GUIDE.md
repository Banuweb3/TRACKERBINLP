# 🚀 DigitalOcean Deployment Guide - BPO Analytics Platform

## 📋 Pre-Deployment Checklist

### ✅ **What You Need:**
- DigitalOcean account
- GitHub account with your code pushed
- Google Gemini API keys
- 30 minutes of your time

---

## 🎯 **STEP 1: Prepare Your GitHub Repository**

### 1.1 Push Your Code to GitHub
```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit - BPO Analytics Platform"

# Create repository on GitHub and push
git remote add origin https://github.com/YOUR_USERNAME/bpo_call_version5.git
git branch -M main
git push -u origin main
```

### 1.2 Update App Configuration
Edit `.do/app.yaml` and replace:
```yaml
github:
  repo: your-username/bpo_call_version5  # ← Change this to YOUR GitHub username
  branch: main
```

---

## 🌊 **STEP 2: DigitalOcean Setup**

### 2.1 Create DigitalOcean Account
1. Go to [DigitalOcean.com](https://digitalocean.com)
2. Sign up (you'll get $200 free credit!)
3. Verify your email and add payment method

### 2.2 Connect GitHub
1. Go to **Settings** → **Applications & API**
2. Click **GitHub** tab
3. Click **Install GitHub App**
4. Authorize DigitalOcean to access your repositories

---

## 🚀 **STEP 3: Deploy Your App**

### 3.1 Create New App
1. In DigitalOcean dashboard, click **Create** → **Apps**
2. Choose **GitHub** as source
3. Select your repository: `bpo_call_version5`
4. Choose branch: `main`
5. Click **Next**

### 3.2 Configure Services
DigitalOcean will auto-detect your configuration from `.do/app.yaml`:

**Frontend Service:**
- Name: `frontend`
- Build Command: `npm run build`
- Run Command: `npm start`
- Port: 8080

**API Service:**
- Name: `api` 
- Source Directory: `/server`
- Build Command: `npm install`
- Run Command: `npm start`
- Port: 3001

**Database:**
- Engine: MySQL 8
- Size: 1GB RAM, 1 vCPU
- Name: `db`

### 3.3 Set Environment Variables
Click **Environment Variables** and add:

**For API Service:**
```
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-here
API_KEY=your-google-gemini-api-key-1
API_KEY_2=your-google-gemini-api-key-2
API_KEY_3=your-google-gemini-api-key-3
... (add all your API keys)
```

**Important:** Use the **SECRET** type for sensitive data!

---

## 💾 **STEP 4: Database Setup**

### 4.1 Database Configuration
- **Engine:** MySQL 8.0
- **Plan:** Basic ($15/month)
- **Size:** 1GB RAM, 1 vCPU, 10GB storage
- **Region:** Choose closest to your users

### 4.2 Initialize Database
After deployment, you'll need to run the database initialization:

1. Go to **Console** tab in your API service
2. Run: `npm run init-db`

---

## 🔧 **STEP 5: Final Configuration**

### 5.1 Custom Domain (Optional)
1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Update DNS records as shown

### 5.2 SSL Certificate
- Automatically provided by DigitalOcean
- No additional configuration needed

---

## 📊 **STEP 6: Verify Deployment**

### 6.1 Check Services
1. **Frontend:** `https://your-app-name.ondigitalocean.app`
2. **API:** `https://your-app-name.ondigitalocean.app/api/health`
3. **Database:** Check connection in app logs

### 6.2 Test Features
- [ ] Upload audio files
- [ ] View analytics dashboard
- [ ] Generate reports
- [ ] Check database connections

---

## 💰 **Expected Costs**

```
App Platform (Professional): $12/month
- Frontend + API services
- Auto-scaling included
- SSL certificates

Managed MySQL Database: $15/month
- 1GB RAM, 10GB storage
- Automated backups
- High availability

Total: ~$27/month
```

---

## 🆘 **Troubleshooting**

### Common Issues:

**Build Fails:**
- Check Node.js version in `package.json`
- Verify all dependencies are listed
- Check build logs in DigitalOcean console

**Database Connection Issues:**
- Verify environment variables
- Check database credentials
- Ensure database is running

**API Keys Not Working:**
- Make sure they're set as SECRET type
- Check API key format
- Verify Google Gemini API quotas

---

## 🎉 **You're Done!**

Your BPO Analytics Platform is now live on DigitalOcean! 

**Next Steps:**
1. Share the URL with your team
2. Set up monitoring and alerts
3. Configure backups
4. Scale as needed

**Need Help?** Check DigitalOcean documentation or contact their support team.
