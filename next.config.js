/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ['@finance-buddy/shared'],
  // Using pages router (default in Next.js 14)

  // Note: 'output: standalone' is removed for Vercel deployment
  // Vercel handles the deployment automatically without standalone mode
  // Force rebuild: 2025-10-05

  // Environment variables exposed to the browser
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY,
  },

  // Optimizations
  experimental: {
    // Enable optimized package imports
    optimizePackageImports: ['@supabase/supabase-js'],
  },

  // Headers for security and CORS
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: process.env.NEXTAUTH_URL || '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Cookie' },
        ],
      },
    ];
  },
}

module.exports = nextConfig
