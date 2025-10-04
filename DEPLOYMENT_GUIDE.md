# Finance Buddy - Vercel Deployment Guide

## Current Status

The Finance Buddy application is configured for deployment on Vercel. The project structure uses an npm workspace monorepo with the Next.js application located in `apps/web`.

## Vercel Project Information

- **Project Name**: finance-buddy-1
- **Team**: dheerajs-projects-74ed43fb
- **Project URL**: https://vercel.com/dheerajs-projects-74ed43fb/finance-buddy-1

## Required Environment Variables

You need to configure the following environment variables in your Vercel project settings:

### 1. Navigate to Environment Variables Settings

Go to: https://vercel.com/dheerajs-projects-74ed43fb/finance-buddy-1/settings/environment-variables

### 2. Add the Following Variables

Copy the values from your local `.env.local` file:

#### Required Variables:

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Description: Your Supabase project URL
   - Example: `https://your-project.supabase.co`
   - Environment: Production, Preview, Development

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Description: Your Supabase anonymous key
   - Environment: Production, Preview, Development

3. **SUPABASE_SERVICE_ROLE_KEY**
   - Description: Your Supabase service role key (keep this secret!)
   - Environment: Production, Preview, Development

4. **GMAIL_CLIENT_ID**
   - Description: Google OAuth client ID for Gmail integration
   - Environment: Production, Preview, Development
   - Note: Make sure to add your Vercel deployment URL to the authorized redirect URIs in Google Cloud Console

5. **GMAIL_CLIENT_SECRET**
   - Description: Google OAuth client secret
   - Environment: Production, Preview, Development

6. **NEXTAUTH_URL**
   - Description: The URL of your deployed application
   - Value for Production: `https://finance-buddy-1-dheerajs-projects-74ed43fb.vercel.app` (or your custom domain)
   - Value for Preview: Leave empty (Vercel will auto-detect)
   - Value for Development: `http://localhost:3000`

7. **COOKIE_NAME**
   - Description: Session cookie name
   - Value: `fb_session`
   - Environment: Production, Preview, Development

#### Optional Variables (for AI features):

8. **OPENAI_API_KEY** (optional)
   - Description: OpenAI API key for transaction extraction
   - Environment: Production, Preview, Development

9. **ANTHROPIC_API_KEY** (optional)
   - Description: Anthropic API key for transaction extraction
   - Environment: Production, Preview, Development

10. **GOOGLE_AI_API_KEY** (optional)
    - Description: Google AI API key for transaction extraction
    - Environment: Production, Preview, Development

## Google OAuth Configuration

After deploying to Vercel, you need to update your Google OAuth settings:

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your OAuth 2.0 Client ID
3. Add the following to **Authorized redirect URIs**:
   - `https://finance-buddy-1-dheerajs-projects-74ed43fb.vercel.app/api/gmail/callback`
   - (Or your custom domain if you have one)

## Deployment Process

### Automatic Deployment

The project is configured to automatically deploy when you push to the `main` branch on GitHub.

### Manual Deployment

You can trigger a manual deployment from the Vercel dashboard:
1. Go to https://vercel.com/dheerajs-projects-74ed43fb/finance-buddy-1
2. Click on the "Deployments" tab
3. Click "Redeploy" on any previous deployment

## Vercel Configuration

The project uses a custom `vercel.json` configuration file to handle the monorepo structure:

```json
{
  "installCommand": "cd ../.. && npm install && cd apps/web && npm install",
  "buildCommand": "npm run build",
  "rootDirectory": "apps/web",
  "headers": [...]
}
```

This configuration:
- Installs dependencies from the monorepo root
- Installs dependencies for the web app
- Builds the Next.js application
- Sets the root directory to `apps/web`

## Troubleshooting

### Build Failures

If you encounter build failures:

1. **Check Environment Variables**: Ensure all required environment variables are set in Vercel
2. **Check Build Logs**: View the build logs in the Vercel dashboard for specific errors
3. **Verify Dependencies**: Make sure all dependencies are properly installed

### Runtime Errors

If the deployment succeeds but the app doesn't work:

1. **Check Environment Variables**: Verify that `NEXTAUTH_URL` is set to your deployment URL
2. **Check Google OAuth**: Ensure your Vercel URL is added to Google OAuth redirect URIs
3. **Check Supabase**: Verify that your Supabase project is accessible and the keys are correct

## Next Steps

1. Configure all environment variables in Vercel
2. Update Google OAuth redirect URIs
3. Trigger a new deployment
4. Test the deployed application
5. Monitor for any errors in the Vercel logs

## Support

For issues with:
- **Vercel Deployment**: Check the Vercel dashboard and build logs
- **Environment Variables**: Verify all values are correctly copied from `.env.local`
- **Google OAuth**: Check Google Cloud Console settings
- **Supabase**: Verify your Supabase project settings

