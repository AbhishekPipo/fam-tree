#!/usr/bin/env node

const crypto = require('crypto');

console.log('🔐 JWT Secret Generator for Family Tree App');
console.log('='.repeat(50));
console.log('');

// Generate secure random secrets
const jwtSecret = crypto.randomBytes(32).toString('hex');
const jwtRefreshSecret = crypto.randomBytes(32).toString('hex');

console.log('📋 Copy these to your .env file:');
console.log('');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`JWT_REFRESH_SECRET=${jwtRefreshSecret}`);
console.log('');

console.log('✅ Security Check:');
console.log(`   JWT_SECRET length: ${jwtSecret.length} characters (✓ >= 32)`);
console.log(`   JWT_REFRESH_SECRET length: ${jwtRefreshSecret.length} characters (✓ >= 32)`);
console.log('');

console.log('📝 Complete .env configuration:');
console.log('');
console.log('# Server Configuration');
console.log('PORT=3000');
console.log('NODE_ENV=development');
console.log('');
console.log('# JanusGraph Configuration');
console.log('JANUS_HOST=localhost');
console.log('JANUS_PORT=8182');
console.log('JANUS_PATH=/gremlin');
console.log('');
console.log('# JWT Configuration');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`JWT_REFRESH_SECRET=${jwtRefreshSecret}`);
console.log('JWT_ACCESS_EXPIRY=24h');
console.log('JWT_REFRESH_EXPIRY=7d');
console.log('');
console.log('# OTP Configuration');
console.log('STATIC_OTP=123456');
console.log('');
console.log('# Optional: Docker Configuration');
console.log('JANUSGRAPH_CONTAINER_NAME=janusgraph-default');
console.log('JANUSGRAPH_MEMORY_OPTS=-Xms512m -Xmx1024m');
console.log('');

console.log('🚀 Next Steps:');
console.log('1. Copy the JWT secrets to your .env file');
console.log('2. Make sure .env is in your .gitignore');
console.log('3. Use different secrets for production');
console.log('4. Start your server: npm start');
console.log('');

console.log('⚠️  Security Notes:');
console.log('- Never commit these secrets to version control');
console.log('- Use different secrets for each environment');
console.log('- Rotate secrets periodically (every 3-6 months)');
console.log('- Keep secrets secure and restrict access');