# 🚀 DigitalOcean Deployment Guide - BPO Analytics Platform

## Prerequisites
- DigitalOcean account
- GitHub repository with your code
- Gemini API keys (up to 20)
- Domain name (optional)

## 📋 Step-by-Step Deployment

### Step 1: Prepare Your Repository

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for DigitalOcean deployment"
   git push origin main
   ```

2. **Ensure all files are committed**:
   - `.do/app.yaml` (DigitalOcean configuration)
   - `package.json` (updated with production scripts)
   - `server/` directory (backend code)
   - `src/` directory (frontend code)

### Step 2: Create DigitalOcean App

1. **Go to DigitalOcean Dashboard**:
   - Visit: https://cloud.digitalocean.com/apps
   - Click "Create App"

2. **Connect GitHub Repository**:
   - Choose "GitHub" as source
   - Select your repository: `your-username/bpo_call_version5`
   - Choose branch: `main`
   - Auto-deploy: ✅ Enable

3. **Configure App Settings**:
   - DigitalOcean will auto-detect the `.do/app.yaml` file
   - Review the configuration:
     - Frontend service (React)
     - API service (Node.js)
     - MySQL database

### Step 3: Set Environment Variables

In the DigitalOcean dashboard, add these environment variables:

#### **Required Secrets** (mark as encrypted):
```
JWT_SECRET=your_super_secure_jwt_secret_key_here_make_it_long_and_random
API_KEY=your_gemini_api_key_1
API_KEY_2=your_gemini_api_key_2
API_KEY_3=your_gemini_api_key_3
API_KEY_4=your_gemini_api_key_4
API_KEY_5=your_gemini_api_key_5
API_KEY_6=your_gemini_api_key_6
API_KEY_7=your_gemini_api_key_7
API_KEY_8=your_gemini_api_key_8
API_KEY_9=your_gemini_api_key_9
API_KEY_10=your_gemini_api_key_10
API_KEY_11=your_gemini_api_key_11
API_KEY_12=your_gemini_api_key_12
API_KEY_13=your_gemini_api_key_13
API_KEY_14=your_gemini_api_key_14
API_KEY_15=your_gemini_api_key_15
API_KEY_16=your_gemini_api_key_16
API_KEY_17=your_gemini_api_key_17
API_KEY_18=your_gemini_api_key_18
API_KEY_19=your_gemini_api_key_19
API_KEY_20=your_gemini_api_key_20
```

### Step 4: Database Setup

1. **Database will be auto-created** from `app.yaml`
2. **Initialize database schema**:
   - After first deployment, access the console
   - Run: `node server/scripts/initDatabase.js`

### Step 5: Deploy

1. **Click "Create Resources"**
2. **Wait for deployment** (5-10 minutes)
3. **Monitor build logs** for any errors

### Step 6: Configure Domain (Optional)

1. **Add Custom Domain**:
   - Go to Settings → Domains
   - Add your domain: `yourdomain.com`
   - Update DNS records as instructed

2. **SSL Certificate**:
   - Automatically provisioned by DigitalOcean
   - No additional configuration needed

## 🔧 Post-Deployment Configuration

### Verify Deployment

1. **Check Health Endpoint**:
   ```
   GET https://your-app-url/api/health
   ```

2. **Test Authentication**:
   ```
   POST https://your-app-url/api/auth/register
   ```

3. **Test Analysis**:
   - Upload an audio file
   - Verify transcription and analysis work

### Monitor Performance

1. **DigitalOcean Insights**:
   - Monitor CPU, memory, and database usage
   - Set up alerts for high usage

2. **Application Logs**:
   - View real-time logs in DigitalOcean dashboard
   - Monitor for errors and performance issues

## 💰 Pricing Breakdown

| **Service** | **Tier** | **Monthly Cost** |
|-------------|----------|------------------|
| Frontend App | Basic XXS | $5 |
| API App | Basic XXS | $5 |
| MySQL Database | Basic | $15 |
| **Total** | | **$25/month** |

## 🔄 Scaling Options

### Automatic Scaling
- **CPU/Memory**: Auto-scales based on usage
- **Database**: Can upgrade to larger instances
- **Global CDN**: Included for static assets

### Manual Scaling
- **Increase instance size**: Basic XS ($12), Basic S ($24)
- **Add database replicas**: For read scaling
- **Multiple regions**: Deploy globally

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check Node.js version (should be 18+)
   - Verify all dependencies in package.json
   - Check build logs for specific errors

2. **Database Connection Issues**:
   - Verify environment variables are set
   - Check database credentials
   - Ensure database is in same region

3. **API Errors**:
   - Verify Gemini API keys are valid
   - Check CORS configuration
   - Monitor rate limits

### Debug Commands

```bash
# View application logs
doctl apps logs <app-id> --type=run

# Check app status
doctl apps get <app-id>

# Restart services
doctl apps create-deployment <app-id>
```

## 🎯 Success Checklist

- ✅ Repository connected and auto-deploy enabled
- ✅ Environment variables configured (all 20 API keys)
- ✅ Database created and schema initialized
- ✅ Frontend accessible at provided URL
- ✅ API endpoints responding correctly
- ✅ Authentication system working
- ✅ Audio analysis pipeline functional
- ✅ SSL certificate active
- ✅ Custom domain configured (if applicable)

## 🔗 Useful Links

- **DigitalOcean Apps Documentation**: https://docs.digitalocean.com/products/app-platform/
- **Node.js on App Platform**: https://docs.digitalocean.com/products/app-platform/languages-frameworks/nodejs/
- **Database Management**: https://docs.digitalocean.com/products/databases/mysql/

## 📞 Support

If you encounter issues:
1. Check DigitalOcean documentation
2. Review application logs
3. Contact DigitalOcean support (24/7 available)
4. Community forums: https://www.digitalocean.com/community

---

**Your BPO Analytics Platform will be live at**: `https://your-app-name.ondigitalocean.app`

**Estimated deployment time**: 10-15 minutes
**Monthly cost**: ~$25 (scales with usage)
