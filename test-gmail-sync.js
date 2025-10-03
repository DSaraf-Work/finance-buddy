#!/usr/bin/env node

// Test script to verify Gmail connection status and guide setup
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ewvzppahjocjpipaywlg.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3dnpwcGFoam9janBpcGF5d2xnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzEwNjg4MywiZXhwIjoyMDcyNjgyODgzfQ.aSQuObM0WeoLH3k3BVdzr72ixe_K7z0oQO9krVV06Os';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkGmailConnectionStatus() {
  console.log('🔍 Checking Gmail connection status...\n');

  // Check if Gmail connection exists
  const { data: connections, error } = await supabase
    .from('fb_gmail_connections')
    .select('*')
    .eq('user_id', '19ebbae0-475b-4043-85f9-438cd07c3677');

  if (error) {
    console.error('❌ Error fetching Gmail connections:', error);
    return;
  }

  console.log('📧 Gmail Connection Status:');
  console.log('=' .repeat(50));

  if (!connections || connections.length === 0) {
    console.log('❌ NO GMAIL CONNECTIONS FOUND');
    console.log('\n🎯 TO ESTABLISH GMAIL CONNECTION:');
    console.log('1. Open browser and go to: http://localhost:3000');
    console.log('2. Sign in to Finance Buddy');
    console.log('3. Click "🔗 Connect Gmail Account" button');
    console.log('4. Complete Google OAuth with one of your 2 Gmail accounts');
    console.log('5. Grant permissions for Gmail access');
    console.log('6. You\'ll be redirected back to Finance Buddy');
    console.log('\n✅ Once connected, Gmail sync will work with real tokens!');
    return;
  }

  // Display connection details
  connections.forEach((conn, index) => {
    console.log(`\n📧 Connection ${index + 1}:`);
    console.log(`   Email: ${conn.email_address}`);
    console.log(`   Google User ID: ${conn.google_user_id}`);
    console.log(`   Has Access Token: ${!!conn.access_token ? '✅' : '❌'}`);
    console.log(`   Has Refresh Token: ${!!conn.refresh_token ? '✅' : '❌'}`);
    console.log(`   Token Expiry: ${conn.token_expiry}`);
    console.log(`   Granted Scopes: ${conn.granted_scopes?.length || 0} scopes`);

    // Check if token is expired
    if (conn.token_expiry) {
      const isExpired = new Date(conn.token_expiry) <= new Date();
      console.log(`   Token Status: ${isExpired ? '⚠️ EXPIRED' : '✅ VALID'}`);
    }

    // Check if token looks real
    const isRealToken = conn.access_token &&
      conn.access_token.startsWith('ya29.') &&
      conn.access_token.length > 50 &&
      !conn.access_token.includes('test') &&
      !conn.access_token.includes('fake') &&
      !conn.access_token.includes('placeholder');

    console.log(`   Token Type: ${isRealToken ? '✅ REAL OAUTH TOKEN' : '❌ TEST/FAKE TOKEN'}`);
  });

  // Check if we have any real connections
  const realConnections = connections.filter(conn => {
    const isRealToken = conn.access_token &&
      conn.access_token.startsWith('ya29.') &&
      conn.access_token.length > 50 &&
      !conn.access_token.includes('test') &&
      !conn.access_token.includes('fake') &&
      !conn.access_token.includes('placeholder');
    return isRealToken;
  });

  console.log('\n🎯 SUMMARY:');
  console.log('=' .repeat(50));

  if (realConnections.length > 0) {
    console.log('✅ REAL GMAIL CONNECTION FOUND!');
    console.log('✅ Gmail sync should work with real tokens');
    console.log('✅ Test the email search with db_only: false');
  } else {
    console.log('❌ NO REAL GMAIL CONNECTIONS FOUND');
    console.log('⚠️  Found test/fake connections that need to be replaced');
    console.log('\n🔧 TO FIX:');
    console.log('1. Delete fake connections (if any)');
    console.log('2. Establish real Gmail connection via OAuth flow');
    console.log('3. Use browser to complete: http://localhost:3000');
  }
}

checkGmailConnectionStatus().catch(console.error);
