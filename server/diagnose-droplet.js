#!/usr/bin/env node

// DigitalOcean Droplet Diagnostic Script
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

console.log('🔍 DigitalOcean Droplet Diagnostic Tool');
console.log('=====================================\n');

// 1. Check Environment Variables
console.log('1. 📋 Environment Variables Check:');
console.log('   DB_HOST:', process.env.DB_HOST || '❌ NOT SET');
console.log('   DB_PORT:', process.env.DB_PORT || '❌ NOT SET');
console.log('   DB_USER:', process.env.DB_USER || '❌ NOT SET');
console.log('   DB_PASSWORD:', process.env.DB_PASSWORD ? '✅ SET' : '❌ NOT SET');
console.log('   DB_NAME:', process.env.DB_NAME || '❌ NOT SET');
console.log('   NODE_ENV:', process.env.NODE_ENV || '❌ NOT SET');
console.log('   PORT:', process.env.PORT || '❌ NOT SET');
console.log('   FRONTEND_URL:', process.env.FRONTEND_URL || '❌ NOT SET');
console.log('   JWT_SECRET:', process.env.JWT_SECRET ? '✅ SET' : '❌ NOT SET');
console.log('   API_KEY:', process.env.API_KEY ? '✅ SET' : '❌ NOT SET');
console.log('');

// 2. Check .env file exists
console.log('2. 📄 Configuration Files Check:');
const envPath = '.env';
if (fs.existsSync(envPath)) {
    console.log('   .env file: ✅ EXISTS');
    const envContent = fs.readFileSync(envPath, 'utf8');
    console.log(`   .env file size: ${envContent.length} bytes`);
} else {
    console.log('   .env file: ❌ MISSING');
}
console.log('');

// 3. Test Database Connection
console.log('3. 🗄️  Database Connection Test:');
try {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'bpo_analytics'
    });
    
    console.log('   Connection: ✅ SUCCESS');
    
    // Test database exists
    const [databases] = await connection.execute('SHOW DATABASES');
    const dbExists = databases.some(db => db.Database === (process.env.DB_NAME || 'bpo_analytics'));
    console.log(`   Database exists: ${dbExists ? '✅ YES' : '❌ NO'}`);
    
    if (dbExists) {
        // Test tables exist
        const [tables] = await connection.execute('SHOW TABLES');
        console.log(`   Tables count: ${tables.length}`);
        if (tables.length > 0) {
            console.log('   Tables:', tables.map(t => Object.values(t)[0]).join(', '));
        }
    }
    
    await connection.end();
} catch (error) {
    console.log('   Connection: ❌ FAILED');
    console.log('   Error:', error.message);
    console.log('   Code:', error.code);
}
console.log('');

// 4. Check Port Availability
console.log('4. 🔌 Port Check:');
const port = process.env.PORT || 3001;
console.log(`   Configured port: ${port}`);

// 5. Check SQL Files
console.log('5. 📁 SQL Files Check:');
const sqlDir = 'sql';
if (fs.existsSync(sqlDir)) {
    const sqlFiles = fs.readdirSync(sqlDir).filter(f => f.endsWith('.sql'));
    console.log(`   SQL files found: ${sqlFiles.length}`);
    sqlFiles.forEach(file => {
        const filePath = path.join(sqlDir, file);
        const stats = fs.statSync(filePath);
        console.log(`   - ${file}: ${stats.size} bytes`);
    });
} else {
    console.log('   SQL directory: ❌ NOT FOUND');
}
console.log('');

// 6. System Information
console.log('6. 💻 System Information:');
console.log('   Node.js version:', process.version);
console.log('   Platform:', process.platform);
console.log('   Architecture:', process.arch);
console.log('   Current directory:', process.cwd());
console.log('   Memory usage:', JSON.stringify(process.memoryUsage(), null, 2));
console.log('');

console.log('🎯 Diagnostic Complete!');
console.log('');
console.log('📋 Common Issues & Solutions:');
console.log('');
console.log('❌ If database connection fails:');
console.log('   1. Check if MySQL is installed and running: sudo systemctl status mysql');
console.log('   2. Create database: mysql -u root -p -e "CREATE DATABASE bpo_analytics;"');
console.log('   3. Check user permissions: mysql -u root -p -e "SHOW GRANTS FOR \'root\'@\'localhost\';"');
console.log('');
console.log('❌ If environment variables are missing:');
console.log('   1. Copy .env.production to .env: cp .env.production .env');
console.log('   2. Update FRONTEND_URL with your droplet IP');
console.log('');
console.log('❌ If backend won\'t start:');
console.log('   1. Check logs: pm2 logs bpo-backend');
console.log('   2. Restart: pm2 restart bpo-backend');
console.log('   3. Check port: netstat -tlnp | grep 3001');
