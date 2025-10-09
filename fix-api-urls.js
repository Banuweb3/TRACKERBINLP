// Quick fix script to update API URLs in built files
const fs = require('fs');
const path = require('path');

// Find the main JS file in dist
const distDir = './dist/assets';
const files = fs.readdirSync(distDir);
const jsFile = files.find(f => f.startsWith('main-') && f.endsWith('.js'));

if (jsFile) {
  const filePath = path.join(distDir, jsFile);
  let content = fs.readFileSync(filePath, 'utf8');
  
  console.log('🔧 Fixing API URLs in:', jsFile);
  
  // Replace relative /api URLs with absolute URLs
  content = content.replace(/["'`]\/api/g, '"http://165.22.158.48:3001/api');
  
  fs.writeFileSync(filePath, content);
  console.log('✅ API URLs fixed!');
  console.log('🔄 Restart frontend: pm2 restart bpo-frontend');
} else {
  console.log('❌ Main JS file not found');
}
