#!/usr/bin/env node

/**
 * Deployment Validation Script
 * 
 * This script validates that all required configuration is in place
 * before deploying to Vercel.
 * 
 * Usage: node scripts/validate-deployment.js
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function checkmark() {
  return `${colors.green}✓${colors.reset}`;
}

function crossmark() {
  return `${colors.red}✗${colors.reset}`;
}

// Load environment variables from .env.local if it exists
function loadEnvFile() {
  const envPath = path.join(__dirname, '../.env.local');
  
  if (!fs.existsSync(envPath)) {
    log('⚠️  No .env.local file found. Checking process.env only.', 'yellow');
    return;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');

  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) {
      continue;
    }

    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

// Check if required files exist
function checkRequiredFiles() {
  logSection('📁 Checking Required Files');

  const requiredFiles = [
    'package.json',
    'apps/web/package.json',
    'apps/web/next.config.js',
    'apps/web/tsconfig.json',
    'vercel.json',
    '.vercelignore',
    'VERCEL_DEPLOYMENT.md',
  ];

  let allFilesExist = true;

  requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    const exists = fs.existsSync(filePath);
    
    if (exists) {
      log(`${checkmark()} ${file}`, 'green');
    } else {
      log(`${crossmark()} ${file} - MISSING`, 'red');
      allFilesExist = false;
    }
  });

  return allFilesExist;
}

// Check environment variables
function checkEnvironmentVariables() {
  logSection('🔐 Checking Environment Variables');

  const requiredVars = [
    { name: 'NEXT_PUBLIC_SUPABASE_URL', description: 'Supabase project URL' },
    { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', description: 'Supabase anonymous key' },
    { name: 'SUPABASE_SERVICE_ROLE_KEY', description: 'Supabase service role key' },
    { name: 'GMAIL_CLIENT_ID', description: 'Gmail OAuth client ID' },
    { name: 'GMAIL_CLIENT_SECRET', description: 'Gmail OAuth client secret' },
    { name: 'NEXTAUTH_URL', description: 'Application base URL' },
  ];

  const optionalVars = [
    { name: 'OPENAI_API_KEY', description: 'OpenAI API key (for GPT models)' },
    { name: 'ANTHROPIC_API_KEY', description: 'Anthropic API key (for Claude)' },
    { name: 'GOOGLE_AI_API_KEY', description: 'Google AI API key (for Gemini)' },
    { name: 'COOKIE_NAME', description: 'Session cookie name' },
  ];

  let allRequiredSet = true;

  log('\nRequired Variables:', 'yellow');
  requiredVars.forEach(({ name, description }) => {
    const value = process.env[name];
    const isSet = !!value;
    
    if (isSet) {
      const preview = value.length > 20 ? `${value.substring(0, 20)}...` : value;
      log(`${checkmark()} ${name}: ${preview}`, 'green');
    } else {
      log(`${crossmark()} ${name} - NOT SET (${description})`, 'red');
      allRequiredSet = false;
    }
  });

  log('\nOptional Variables:', 'yellow');
  optionalVars.forEach(({ name, description }) => {
    const value = process.env[name];
    const isSet = !!value;
    
    if (isSet) {
      const preview = value.length > 20 ? `${value.substring(0, 20)}...` : value;
      log(`${checkmark()} ${name}: ${preview}`, 'green');
    } else {
      log(`  ${name} - Not set (${description})`, 'yellow');
    }
  });

  return allRequiredSet;
}

// Check package.json configuration
function checkPackageJson() {
  logSection('📦 Checking package.json Configuration');

  const packageJsonPath = path.join(__dirname, '../package.json');
  const webPackageJsonPath = path.join(__dirname, '../apps/web/package.json');

  let isValid = true;

  // Check root package.json
  const rootPackage = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  if (rootPackage.workspaces) {
    log(`${checkmark()} Workspaces configured`, 'green');
  } else {
    log(`${crossmark()} Workspaces not configured`, 'red');
    isValid = false;
  }

  if (rootPackage.scripts && rootPackage.scripts.build) {
    log(`${checkmark()} Build script exists: ${rootPackage.scripts.build}`, 'green');
  } else {
    log(`${crossmark()} Build script missing`, 'red');
    isValid = false;
  }

  // Check web package.json
  const webPackage = JSON.parse(fs.readFileSync(webPackageJsonPath, 'utf8'));
  
  const requiredDeps = ['next', 'react', 'react-dom', '@supabase/supabase-js'];
  requiredDeps.forEach(dep => {
    if (webPackage.dependencies && webPackage.dependencies[dep]) {
      log(`${checkmark()} Dependency: ${dep}`, 'green');
    } else {
      log(`${crossmark()} Missing dependency: ${dep}`, 'red');
      isValid = false;
    }
  });

  return isValid;
}

// Check Next.js configuration
function checkNextConfig() {
  logSection('⚙️  Checking Next.js Configuration');

  const nextConfigPath = path.join(__dirname, '../apps/web/next.config.js');
  
  if (!fs.existsSync(nextConfigPath)) {
    log(`${crossmark()} next.config.js not found`, 'red');
    return false;
  }

  const configContent = fs.readFileSync(nextConfigPath, 'utf8');
  
  const checks = [
    { pattern: /transpilePackages.*@finance-buddy\/shared/, message: 'Transpile packages configured' },
    { pattern: /output.*standalone/, message: 'Standalone output configured' },
    { pattern: /reactStrictMode/, message: 'React strict mode enabled' },
  ];

  let isValid = true;

  checks.forEach(({ pattern, message }) => {
    if (pattern.test(configContent)) {
      log(`${checkmark()} ${message}`, 'green');
    } else {
      log(`  ${message} - Not found (optional)`, 'yellow');
    }
  });

  return isValid;
}

// Check Vercel configuration
function checkVercelConfig() {
  logSection('🔺 Checking Vercel Configuration');

  const vercelConfigPath = path.join(__dirname, '../vercel.json');
  
  if (!fs.existsSync(vercelConfigPath)) {
    log(`${crossmark()} vercel.json not found`, 'red');
    return false;
  }

  const config = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
  
  let isValid = true;

  if (config.buildCommand) {
    log(`${checkmark()} Build command: ${config.buildCommand}`, 'green');
  } else {
    log(`  Build command not specified (will use default)`, 'yellow');
  }

  if (config.framework === 'nextjs') {
    log(`${checkmark()} Framework: Next.js`, 'green');
  } else {
    log(`  Framework not specified`, 'yellow');
  }

  if (config.functions) {
    log(`${checkmark()} Function configuration present`, 'green');
  } else {
    log(`  Function configuration not specified`, 'yellow');
  }

  return isValid;
}

// Main validation function
async function validate() {
  log('\n🚀 Finance Buddy - Deployment Validation\n', 'cyan');
  
  // Load environment variables
  loadEnvFile();

  // Run all checks
  const results = {
    files: checkRequiredFiles(),
    env: checkEnvironmentVariables(),
    package: checkPackageJson(),
    nextConfig: checkNextConfig(),
    vercelConfig: checkVercelConfig(),
  };

  // Summary
  logSection('📊 Validation Summary');

  const allPassed = Object.values(results).every(result => result);

  if (allPassed) {
    log('\n✅ All checks passed! Ready to deploy to Vercel.', 'green');
    log('\nNext steps:', 'cyan');
    log('  1. Commit your changes: git add . && git commit -m "chore: prepare for Vercel deployment"', 'blue');
    log('  2. Push to repository: git push', 'blue');
    log('  3. Deploy to Vercel: vercel --prod', 'blue');
    log('\nOr use the Vercel dashboard to import your repository.', 'blue');
    process.exit(0);
  } else {
    log('\n❌ Some checks failed. Please fix the issues above before deploying.', 'red');
    log('\nFailed checks:', 'yellow');
    Object.entries(results).forEach(([check, passed]) => {
      if (!passed) {
        log(`  - ${check}`, 'red');
      }
    });
    log('\nSee VERCEL_DEPLOYMENT.md for detailed setup instructions.', 'cyan');
    process.exit(1);
  }
}

// Run validation
validate().catch(error => {
  log(`\n❌ Validation error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

