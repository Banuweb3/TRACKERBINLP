#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

console.log('🚀 DigitalOcean Deployment Preparation');
console.log('=====================================');

// Check if required files exist
const requiredFiles = [
  '.do/app.yaml',
  'package.json',
  'server/package.json',
  'DIGITALOCEAN-DEPLOYMENT.md'
];

console.log('\n📋 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  const filePath = path.join(rootDir, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ Some required files are missing. Please ensure all files are created.');
  process.exit(1);
}

// Check package.json scripts
console.log('\n🔧 Checking package.json configuration...');
const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));

if (packageJson.scripts.start && packageJson.scripts.build) {
  console.log('✅ Production scripts configured');
} else {
  console.log('❌ Missing production scripts in package.json');
}

if (packageJson.engines && packageJson.engines.node) {
  console.log('✅ Node.js version specified');
} else {
  console.log('⚠️  Node.js version not specified (recommended: >=18.0.0)');
}

// Check server package.json
console.log('\n🔧 Checking server configuration...');
const serverPackageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'server/package.json'), 'utf8'));

if (serverPackageJson.scripts.start) {
  console.log('✅ Server start script configured');
} else {
  console.log('❌ Missing start script in server/package.json');
}

// Create deployment checklist
const checklist = `
# 🚀 DigitalOcean Deployment Checklist

## Pre-Deployment
- [ ] Code pushed to GitHub repository
- [ ] All environment variables prepared
- [ ] Gemini API keys ready (up to 20)
- [ ] Domain name ready (optional)

## DigitalOcean Setup
- [ ] DigitalOcean account created
- [ ] GitHub repository connected
- [ ] App configuration reviewed (.do/app.yaml)
- [ ] Environment variables added (especially API keys)
- [ ] Database configuration confirmed

## Post-Deployment
- [ ] Health endpoint tested: /api/health
- [ ] User registration tested: /api/auth/register
- [ ] Audio analysis tested
- [ ] SSL certificate active
- [ ] Custom domain configured (if applicable)

## Environment Variables to Set in DigitalOcean:
\`\`\`
JWT_SECRET=your_super_secure_jwt_secret_key_here
API_KEY=your_gemini_api_key_1
API_KEY_2=your_gemini_api_key_2
... (up to API_KEY_20)
\`\`\`

## Estimated Costs:
- Frontend App: $5/month
- API App: $5/month  
- MySQL Database: $15/month
- **Total: ~$25/month**

## Next Steps:
1. Visit: https://cloud.digitalocean.com/apps
2. Click "Create App"
3. Connect your GitHub repository
4. Follow the deployment guide: DIGITALOCEAN-DEPLOYMENT.md
`;

fs.writeFileSync(path.join(rootDir, 'DEPLOYMENT-CHECKLIST.md'), checklist);

console.log('\n✅ Deployment preparation complete!');
console.log('\n📁 Files ready for deployment:');
console.log('   - .do/app.yaml (DigitalOcean configuration)');
console.log('   - package.json (updated with production scripts)');
console.log('   - DIGITALOCEAN-DEPLOYMENT.md (complete guide)');
console.log('   - DEPLOYMENT-CHECKLIST.md (step-by-step checklist)');

console.log('\n🚀 Next Steps:');
console.log('1. Push your code to GitHub:');
console.log('   git add .');
console.log('   git commit -m "Ready for DigitalOcean deployment"');
console.log('   git push origin main');
console.log('');
console.log('2. Visit DigitalOcean Apps: https://cloud.digitalocean.com/apps');
console.log('3. Follow the deployment guide: DIGITALOCEAN-DEPLOYMENT.md');
console.log('');
console.log('💰 Estimated monthly cost: $25');
console.log('⏱️  Deployment time: 10-15 minutes');
console.log('🌐 Your app will be live at: https://your-app-name.ondigitalocean.app');

console.log('\n🎉 Good luck with your deployment!');
