import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

console.log('🔧 Preparing project for cPanel deployment...');

// Create production environment file
const envTemplate = `# cPanel Production Environment Variables
NODE_ENV=production
PORT=3000

# Database Configuration (Update with your cPanel MySQL details)
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_cpanel_db_user
DB_PASSWORD=your_cpanel_db_password
DB_NAME=your_cpanel_db_name

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_here_make_it_long_and_random

# Frontend URL (Update with your domain)
FRONTEND_URL=https://yourdomain.com

# Gemini API Keys (Add your API keys)
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

# File Upload Configuration
MAX_FILE_SIZE=50MB
UPLOAD_DIR=uploads
`;

fs.writeFileSync(path.join(rootDir, '.env.cpanel'), envTemplate);

// Create deployment instructions
const deployInstructions = `# cPanel Deployment Instructions

## Prerequisites
1. cPanel hosting with Node.js support (version 16+)
2. MySQL database access
3. Domain name configured
4. Gemini API keys

## Step 1: Build the Project
\`\`\`bash
npm run build
\`\`\`

## Step 2: Upload Files
Upload these files/folders to your cPanel public_html directory:
- app.js (main server file)
- package-cpanel.json (rename to package.json)
- .htaccess
- .env.cpanel (rename to .env and update values)
- dist/ (React build folder)
- server/ (backend code)
- uploads/ (create empty folder)

## Step 3: Install Dependencies
In cPanel Node.js app manager:
1. Set startup file to: app.js
2. Install dependencies from package.json
3. Set environment variables from .env file

## Step 4: Configure Database
1. Create MySQL database in cPanel
2. Import database schema from server/scripts/initDatabase.js
3. Update .env with database credentials

## Step 5: Configure Domain
1. Point domain to public_html
2. Enable SSL certificate
3. Test the application

## File Structure in cPanel:
\`\`\`
public_html/
├── app.js
├── package.json
├── .env
├── .htaccess
├── dist/
│   ├── index.html
│   ├── assets/
│   └── ...
├── server/
│   ├── config/
│   ├── routes/
│   ├── services/
│   └── ...
└── uploads/
\`\`\`

## Important Notes:
- Update all environment variables in .env
- Ensure Node.js version is 16+ in cPanel
- Configure file upload limits in cPanel
- Test all API endpoints after deployment
`;

fs.writeFileSync(path.join(rootDir, 'CPANEL-DEPLOYMENT.md'), deployInstructions);

console.log('✅ cPanel preparation complete!');
console.log('📁 Files created:');
console.log('   - .env.cpanel (update with your values)');
console.log('   - CPANEL-DEPLOYMENT.md (deployment guide)');
console.log('');
console.log('🚀 Next steps:');
console.log('   1. Run: npm run build');
console.log('   2. Follow CPANEL-DEPLOYMENT.md instructions');
console.log('   3. Upload files to your cPanel hosting');
