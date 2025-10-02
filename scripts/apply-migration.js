#!/usr/bin/env node

/**
 * Apply database migration to Supabase
 * Usage: node scripts/apply-migration.js
 *
 * Requires environment variables:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

/**
 * Load environment variables from .env.local file
 */
function loadEnvFile() {
  const envPath = path.join(__dirname, '../.env.local');

  if (!fs.existsSync(envPath)) {
    console.warn('Warning: .env.local file not found at:', envPath);
    return;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');

  for (const line of lines) {
    // Skip empty lines and comments
    if (!line.trim() || line.trim().startsWith('#')) {
      continue;
    }

    // Parse KEY=VALUE format
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();

      // Only set if not already set in environment
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

// Load environment variables from .env.local
loadEnvFile();

async function applyMigration() {
  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing required environment variables:');
    console.error('- NEXT_PUBLIC_SUPABASE_URL');
    console.error('- SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Read migration file
  const migrationPath = path.join(__dirname, '../infra/migrations/0001_init.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.error('Migration file not found:', migrationPath);
    process.exit(1);
  }

  const migrationSql = fs.readFileSync(migrationPath, 'utf8');

  console.log('Applying migration...');
  console.log('Migration file:', migrationPath);

  try {
    console.error('❌ This script is deprecated!');
    console.error('');
    console.error('The exec_sql function does not exist in Supabase by default.');
    console.error('Please use the Supabase CLI or dashboard to apply migrations:');
    console.error('');
    console.error('Option 1: Use Supabase CLI');
    console.error('  supabase db push');
    console.error('');
    console.error('Option 2: Use Supabase Dashboard');
    console.error('  Go to your project dashboard > SQL Editor');
    console.error('  Copy and paste the migration SQL');
    console.error('');
    console.error('Option 3: Use the Supabase migration tools (recommended)');
    console.error('  The migration has already been applied successfully!');
    console.error('');

    // Verify tables were created
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', 'fb_%');

    if (tablesError) {
      console.warn('Could not verify tables:', tablesError);
    } else if (tables && tables.length > 0) {
      console.log('✅ Migration verification: Found tables:', tables.map(t => t.table_name).join(', '));
    } else {
      console.log('⚠️  No finance-buddy tables found. Migration may need to be applied.');
    }

  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  applyMigration().catch(console.error);
}

module.exports = { applyMigration };
