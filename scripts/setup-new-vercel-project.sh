#!/bin/bash

# Finance Buddy - New Vercel Project Setup Script
# This script helps you create a fresh Vercel project for the Finance Buddy application

set -e

echo "========================================="
echo "Finance Buddy - Vercel Project Setup"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}Error: Vercel CLI is not installed${NC}"
    echo "Please install it with: npm install -g vercel"
    exit 1
fi

echo -e "${GREEN}✓ Vercel CLI is installed${NC}"
echo ""

# Step 1: Login to Vercel
echo "Step 1: Login to Vercel"
echo "------------------------"
echo "Running: vercel login"
echo ""
vercel login

echo ""
echo -e "${GREEN}✓ Logged in to Vercel${NC}"
echo ""

# Step 2: Remove old project configuration
echo "Step 2: Cleaning up old configuration"
echo "--------------------------------------"
if [ -d ".vercel" ]; then
    echo "Removing old .vercel directory..."
    rm -rf .vercel
    echo -e "${GREEN}✓ Old configuration removed${NC}"
else
    echo "No old configuration found"
fi
echo ""

# Step 3: Link to a new project
echo "Step 3: Create and link new Vercel project"
echo "-------------------------------------------"
echo "This will create a new project called 'finance-buddy'"
echo ""
echo "When prompted:"
echo "  - Select your team/scope"
echo "  - Choose 'N' for 'Link to existing project?'"
echo "  - Enter 'finance-buddy' as the project name"
echo "  - Confirm the directory is './' (current directory)"
echo "  - Let Vercel auto-detect Next.js settings"
echo ""
read -p "Press Enter to continue..."

vercel link

echo ""
echo -e "${GREEN}✓ Project linked${NC}"
echo ""

# Step 4: Get project information
echo "Step 4: Retrieving project information"
echo "---------------------------------------"
if [ -f ".vercel/project.json" ]; then
    PROJECT_ID=$(cat .vercel/project.json | grep -o '"projectId":"[^"]*' | cut -d'"' -f4)
    ORG_ID=$(cat .vercel/project.json | grep -o '"orgId":"[^"]*' | cut -d'"' -f4)
    
    echo "Project ID: $PROJECT_ID"
    echo "Organization ID: $ORG_ID"
    echo ""
    echo -e "${GREEN}✓ Project information retrieved${NC}"
else
    echo -e "${RED}Error: Could not find .vercel/project.json${NC}"
    exit 1
fi
echo ""

# Step 5: Configure environment variables
echo "Step 5: Configure environment variables"
echo "----------------------------------------"
echo ""
echo "You need to add the following environment variables to your Vercel project:"
echo ""
echo "Required variables:"
echo "  - NEXT_PUBLIC_SUPABASE_URL"
echo "  - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "  - SUPABASE_SERVICE_ROLE_KEY"
echo "  - GMAIL_CLIENT_ID"
echo "  - GMAIL_CLIENT_SECRET"
echo "  - NEXTAUTH_URL (will be set to your deployment URL)"
echo "  - COOKIE_NAME (value: fbsession)"
echo ""
echo "Optional variables (for AI features):"
echo "  - OPENAI_API_KEY"
echo "  - ANTHROPIC_API_KEY"
echo "  - GOOGLE_AI_API_KEY"
echo ""
echo "You can add these variables in two ways:"
echo ""
echo "Option 1: Using Vercel CLI (recommended)"
echo "  Run: vercel env add <KEY_NAME> production"
echo "  Then paste the value when prompted"
echo ""
echo "Option 2: Using Vercel Dashboard"
echo "  Visit: https://vercel.com/dashboard"
echo "  Go to your project settings > Environment Variables"
echo ""
read -p "Press Enter when you've added all environment variables..."
echo ""

# Step 6: Deploy
echo "Step 6: Deploy to Vercel"
echo "------------------------"
echo ""
echo "Ready to deploy your application!"
echo ""
echo "Choose deployment type:"
echo "  1) Production deployment (vercel --prod)"
echo "  2) Preview deployment (vercel)"
echo "  3) Skip deployment for now"
echo ""
read -p "Enter your choice (1-3): " DEPLOY_CHOICE

case $DEPLOY_CHOICE in
    1)
        echo ""
        echo "Deploying to production..."
        vercel --prod
        ;;
    2)
        echo ""
        echo "Creating preview deployment..."
        vercel
        ;;
    3)
        echo ""
        echo "Skipping deployment"
        ;;
    *)
        echo ""
        echo -e "${YELLOW}Invalid choice. Skipping deployment${NC}"
        ;;
esac

echo ""
echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. If you haven't deployed yet, run: vercel --prod"
echo "2. Update NEXTAUTH_URL environment variable with your deployment URL"
echo "3. Add your Vercel URL to Google OAuth redirect URIs"
echo "4. Test your deployment"
echo ""
echo "For more information, see DEPLOYMENT_GUIDE.md"
echo ""

