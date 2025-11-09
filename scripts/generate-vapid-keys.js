#!/usr/bin/env node

/**
 * Generate VAPID keys for Web Push notifications
 * Run: node scripts/generate-vapid-keys.js
 */

const webpush = require('web-push');

console.log('🔑 Generating VAPID keys for Web Push notifications...\n');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('✅ VAPID keys generated successfully!\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📋 Add these to your .env.local file:\n');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:your-email@example.com`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('⚠️  IMPORTANT:');
console.log('   - Keep the VAPID_PRIVATE_KEY secret and never commit it to git');
console.log('   - The NEXT_PUBLIC_VAPID_PUBLIC_KEY can be public');
console.log('   - Update VAPID_SUBJECT with your actual email address');
console.log('   - Add these to .env.local for local development');
console.log('   - Add these to Vercel environment variables for production\n');

