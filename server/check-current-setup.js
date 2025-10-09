#!/usr/bin/env node

// Non-invasive diagnostic script - DOES NOT CHANGE ANYTHING
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

console.log('🔍 Current Project Status Check (READ-ONLY)');
console.log('===========================================\n');

// 1. Check what's currently configured
console.log('1. 📋 Current Environment Configuration:');
const envVars = {
    'DB_HOST': process.env.DB_HOST,
    'DB_PORT': process.env.DB_PORT,
    'DB_USER': process.env.DB_USER,
    'DB_PASSWORD': process.env.DB_PASSWORD ? '[HIDDEN]' : 'NOT SET',
    'DB_NAME': process.env.DB_NAME,
    'NODE_ENV': process.env.NODE_ENV,
    'PORT': process.env.PORT,
    'FRONTEND_URL': process.env.FRONTEND_URL,
    'JWT_SECRET': process.env.JWT_SECRET ? '[HIDDEN]' : 'NOT SET'
};

Object.entries(envVars).forEach(([key, value]) => {
    console.log(`   ${key}: ${value || '❌ NOT SET'}`);
});
console.log('');

// 2. Test database connection with current settings
console.log('2. 🗄️  Database Connection Test:');
try {
    if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD) {
        console.log('   ❌ Missing database credentials in .env file');
    } else {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME || 'bpo_analytics'
        });
        
        console.log('   ✅ Database connection successful');
        
        // Check if database exists
        const [databases] = await connection.execute('SHOW DATABASES');
        const dbName = process.env.DB_NAME || 'bpo_analytics';
        const dbExists = databases.some(db => db.Database === dbName);
        
        console.log(`   Database '${dbName}': ${dbExists ? '✅ EXISTS' : '❌ NOT FOUND'}`);
        
        if (dbExists) {
            // Check tables
            const [tables] = await connection.execute('SHOW TABLES');
            console.log(`   Tables in database: ${tables.length}`);
            if (tables.length > 0) {
                console.log('   Available tables:', tables.map(t => Object.values(t)[0]).join(', '));
            } else {
                console.log('   ⚠️  Database exists but no tables found');
            }
        }
        
        await connection.end();
    }
} catch (error) {
    console.log('   ❌ Database connection failed');
    console.log('   Error:', error.message);
    console.log('   Error code:', error.code || 'Unknown');
}
console.log('');

// 3. Check if .env file exists and what's in it
console.log('3. 📄 Configuration File Status:');
if (fs.existsSync('.env')) {
    console.log('   .env file: ✅ EXISTS');
    const envContent = fs.readFileSync('.env', 'utf8');
    const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    console.log(`   Configuration lines: ${lines.length}`);
} else {
    console.log('   .env file: ❌ NOT FOUND');
    console.log('   📝 You need to create .env file with database credentials');
}

if (fs.existsSync('.env.production')) {
    console.log('   .env.production: ✅ EXISTS (template available)');
} else {
    console.log('   .env.production: ❌ NOT FOUND');
}
console.log('');

// 4. Check current directory and files
console.log('4. 📁 Project Structure Check:');
console.log('   Current directory:', process.cwd());
console.log('   server.js exists:', fs.existsSync('server.js') ? '✅ YES' : '❌ NO');
console.log('   package.json exists:', fs.existsSync('package.json') ? '✅ YES' : '❌ NO');
console.log('   SQL directory exists:', fs.existsSync('sql') ? '✅ YES' : '❌ NO');

if (fs.existsSync('sql')) {
    const sqlFiles = fs.readdirSync('sql').filter(f => f.endsWith('.sql'));
    console.log(`   SQL files available: ${sqlFiles.length}`);
    sqlFiles.forEach(file => console.log(`   - ${file}`));
}
console.log('');

// 5. Suggest next steps without changing anything
console.log('🎯 Recommended Next Steps (NO CHANGES MADE):');
console.log('');

if (!fs.existsSync('.env')) {
    console.log('❗ ISSUE: Missing .env file');
    console.log('   SOLUTION: Copy .env.production to .env and update values');
    console.log('   COMMAND: cp .env.production .env');
}

if (!process.env.DB_HOST) {
    console.log('❗ ISSUE: Database not configured');
    console.log('   SOLUTION: Set database credentials in .env file');
}

console.log('');
console.log('🔧 Safe Commands to Fix Issues:');
console.log('   1. Copy environment template: cp .env.production .env');
console.log('   2. Edit environment file: nano .env');
console.log('   3. Test database: node test-db.js');
console.log('   4. Initialize database: node scripts/setupDatabase.js');
console.log('   5. Start server: node server.js');
console.log('');
console.log('✅ This diagnostic made NO changes to your system');
