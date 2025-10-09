# 🔧 Backend & Database Troubleshooting Guide

## 🚨 Current Issue: Frontend runs but backend/database not working

### 📋 Quick Diagnosis Checklist

1. **✅ Frontend Status**: Working (you confirmed this)
2. **❌ Backend Status**: Not working
3. **❌ Database Status**: Not connecting
4. **❌ Logs**: Not showing proper startup

## 🔍 Step-by-Step Troubleshooting

### Step 1: Check DigitalOcean App Platform Logs

1. Go to your DigitalOcean App Platform dashboard
2. Click on your app → **"Runtime Logs"**
3. Select **"api"** service (backend)
4. Look for these specific log messages:

**✅ Good logs should show:**
```
🗄️ Setting up database...
✅ Database bpo_analytics created or already exists
✅ Database schema created successfully
👤 Creating default admin user...
✅ Default admin user created
🚀 BPO Analytics Server running on port 3001
```

**❌ Bad logs might show:**
```
❌ Database connection failed: ECONNREFUSED
❌ Failed to connect to database
Error: Cannot find module @rollup/rollup-linux-x64-gnu
```

### Step 2: Verify Database Connection

#### Check if database is created and linked:
1. Go to **DigitalOcean Databases**
2. Verify your database exists and is running
3. Check **"Users & Databases"** tab
4. Ensure database name matches your app configuration

#### Check App Platform database linking:
1. In your app → **"Settings"** → **"Components"**
2. Click on **"api"** service
3. Scroll to **"Resources"**
4. Verify database is linked and shows: `${db.HOSTNAME}`, `${db.PORT}`, etc.

### Step 3: Environment Variables Check

In App Platform → **"Settings"** → **"App-Level Environment Variables"**

**Required variables:**
```bash
# Database (auto-populated when database is linked)
DB_HOST=${db.HOSTNAME}
DB_PORT=${db.PORT}
DB_USER=${db.USERNAME}
DB_PASSWORD=${db.PASSWORD}
DB_NAME=${db.DATABASE}

# Application
NODE_ENV=production
JWT_SECRET=your_jwt_secret_here
FRONTEND_URL=${frontend.PUBLIC_URL}
CORS_ORIGIN=${frontend.PUBLIC_URL}

# API Keys (add your actual keys)
API_KEY=your_gemini_api_key_1
API_KEY_2=your_gemini_api_key_2
# ... etc
```

### Step 4: Common Fixes

#### Fix 1: Rebuild with Correct Configuration
1. Go to **"Settings"** → **"App Spec"**
2. Verify the configuration matches our updated `.do/app.yaml`
3. Click **"Save"** → **"Deploy"**

#### Fix 2: Database Connection Issues
If database connection fails:
1. Check database is in same region as app
2. Verify database is running (not paused)
3. Check database firewall allows App Platform connections

#### Fix 3: Backend Build Issues
If backend fails to build:
1. Check build logs for npm install errors
2. Verify `server/package.json` exists
3. Ensure all dependencies are listed

#### Fix 4: Port Configuration
Ensure backend service:
- **Build Command**: `npm install`
- **Run Command**: `npm start`
- **HTTP Port**: `3001`

### Step 5: Manual Testing

#### Test Backend Locally (if possible):
```bash
cd server
npm install
npm start
```

Then test: `http://localhost:3001/health`

#### Test Database Connection:
```bash
cd server
node test-health.js
```

### Step 6: Force Redeploy

If nothing works:
1. Go to **"Settings"** → **"General"**
2. Click **"Force Rebuild and Deploy"**
3. Monitor build and runtime logs carefully

## 🚨 Emergency Fixes

### If Backend Won't Start:

1. **Simplify the server startup** - temporarily remove database setup:
   ```javascript
   // Comment out in server.js temporarily
   // await setupDatabase();
   ```

2. **Check basic server startup**:
   ```javascript
   app.listen(PORT, () => {
     console.log(`Server running on port ${PORT}`);
   });
   ```

3. **Add more logging**:
   ```javascript
   console.log('Environment variables:', {
     NODE_ENV: process.env.NODE_ENV,
     PORT: process.env.PORT,
     DB_HOST: process.env.DB_HOST,
     hasDB_PASSWORD: !!process.env.DB_PASSWORD
   });
   ```

### If Database Won't Connect:

1. **Check database status** in DigitalOcean dashboard
2. **Verify region matching** between app and database
3. **Test with simpler connection**:
   ```javascript
   // Temporary simple connection test
   const testSimpleConnection = async () => {
     try {
       const connection = await mysql.createConnection({
         host: process.env.DB_HOST,
         port: process.env.DB_PORT,
         user: process.env.DB_USER,
         password: process.env.DB_PASSWORD
       });
       console.log('✅ Basic connection works');
       await connection.end();
     } catch (error) {
       console.error('❌ Basic connection failed:', error);
     }
   };
   ```

## 📞 Next Steps

1. **Check the logs first** - this will tell you exactly what's failing
2. **Verify database is created and linked** in DigitalOcean
3. **Ensure environment variables are set** correctly
4. **Try force rebuild** if configuration looks correct
5. **Contact me with specific error messages** from the logs

## 🔍 Log Analysis

When you check the logs, look for:
- **Build phase errors**: npm install failures, missing dependencies
- **Runtime errors**: Database connection failures, missing environment variables
- **Port binding issues**: Server not starting on correct port
- **SSL/TLS errors**: Database connection security issues

Share the specific error messages you see, and I can provide targeted fixes! 🚀
