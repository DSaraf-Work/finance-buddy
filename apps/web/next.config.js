/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ['@finance-buddy/shared'],
  // Using pages router (default in Next.js 14)
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY,
  },
}

module.exports = nextConfig
