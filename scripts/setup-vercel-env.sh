#!/bin/bash

# Push Notifications - Vercel Environment Variables Setup Script
# This script helps you add the required environment variables to Vercel

set -e

echo "🔔 Push Notifications - Vercel Environment Variables Setup"
echo "=========================================================="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found!"
    echo ""
    echo "Please install it first:"
    echo "  npm install -g vercel"
    echo ""
    echo "Or add variables manually via Vercel Dashboard:"
    echo "  https://vercel.com/dheerajs-projects-74ed43fb/finance-buddy/settings/environment-variables"
    exit 1
fi

echo "✅ Vercel CLI found"
echo ""

# Login to Vercel
echo "📝 Please login to Vercel..."
vercel login

echo ""
echo "🔧 Adding environment variables..."
echo ""

# Add NEXT_PUBLIC_VAPID_PUBLIC_KEY
echo "Adding NEXT_PUBLIC_VAPID_PUBLIC_KEY..."
echo "BCcx7G-GNmwQ_QheBTwZamrbgZ1MKpMF-4sXbcsDsipszYpHEQfDkPfUH9oqh8EkbzdVYnHzoj5uMpYnHWLa_M8" | vercel env add NEXT_PUBLIC_VAPID_PUBLIC_KEY production

# Add VAPID_PRIVATE_KEY
echo "Adding VAPID_PRIVATE_KEY..."
echo "pgiVr3V1r7BLtf9wu0OaBbTaNCCFVK_BnNxpIUtERzU" | vercel env add VAPID_PRIVATE_KEY production

# Add VAPID_SUBJECT
echo "Adding VAPID_SUBJECT..."
echo "mailto:dsaraf.adobe@gmail.com" | vercel env add VAPID_SUBJECT production

# Add PUSH_INTERNAL_SECRET
echo "Adding PUSH_INTERNAL_SECRET..."
echo "tiMaMHn8vlBfxzoI7wt5LFzDmryK2+07akf+5Hh2pig=" | vercel env add PUSH_INTERNAL_SECRET production

echo ""
echo "✅ All environment variables added successfully!"
echo ""
echo "📦 Next steps:"
echo "  1. Redeploy your application:"
echo "     vercel --prod"
echo ""
echo "  2. Or trigger redeploy via Git:"
echo "     git commit --allow-empty -m 'Trigger redeploy with env vars'"
echo "     git push origin main"
echo ""
echo "  3. Test the setup:"
echo "     https://finance-buddy-sand.vercel.app/settings"
echo ""

