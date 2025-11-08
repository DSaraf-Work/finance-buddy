# Gmail Push Notifications + Pub/Sub Integration on Vercel: Complete Implementation Guide

## Goal
Enable **real-time Gmail email notifications** in your Next.js app hosted on Vercel, using Google Cloud Pub/Sub to trigger serverless API routes when new mail arrives.

---

## Step 0: Prerequisites
- Google Cloud Platform project with billing enabled (free tier sufficient)
- Service account with Pub/Sub permissions
- Verified custom domain for Vercel app (recommended)
- Vercel project ready with Next.js API routes
- OAuth2 Gmail connection already set up in Supabase (existing system)

---

## Step 1: Google Cloud Pub/Sub Setup

1. **Create a Pub/Sub Topic**
   - Console: `Pub/Sub > Topics > Create Topic`
   - Name e.g. `gmail-notifications`
   - Topic format: `projects/{YOUR_PROJECT_ID}/topics/{TOPIC_NAME}`

2. **Create a Push Subscription**
   - Console: `Pub/Sub > Subscriptions > Create Subscription`
   - Subscription type: Push
   - Push Endpoint: `https://your-vercel-app.vercel.app/api/gmail-webhook`
   - Acknowledge protocol: HTTP POST
   - Optionally set Auth Token or verify header for security

3. **Grant Gmail Publish Permissions to Topic**
   - Service account: `gmail-api-push@system.gserviceaccount.com`
   - Console: IAM > Add principal > Role: `Pub/Sub Publisher`

   ```bash
   gcloud pubsub topics add-iam-policy-binding gmail-notifications \
       --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
       --role=roles/pubsub.publisher
   ```

---

## Step 2: Connect Pub/Sub to Your Vercel API

1. **Create `/api/gmail-webhook/route.ts` in Next.js**
   - Accepts POST webhook from Pub/Sub
   - Validates message and token (optional)
   - Parses notification data: check `message.data` (base64-encoded)
   - Process the push (extract `emailAddress`, `historyId`) and trigger your sync logic.

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const pubsubMessage = body.message;
    const dataStr = Buffer.from(pubsubMessage.data, 'base64').toString();
    const data = JSON.parse(dataStr);

    // { emailAddress, historyId }
    // Your app should fetch new messages using Gmail.history.list
    await fetchNewGmailMessages(data.emailAddress, data.historyId);

    return NextResponse.json({ received: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```

2. **Implement Sync Logic in Next.js**
   - When you receive a push, call Gmail API `users.history.list` with last historyId[133][135][130]
   - For each new message, process and store it using your existing extraction pipeline
   - Maintain last processed historyId (e.g. in Supabase)

```typescript
import { google } from 'googleapis';

async function fetchNewGmailMessages(emailAddress, historyId) {
  // google.auth.OAuth2 setup
  // Use Gmail API: users.history.list
  // See docs: https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.history/list
  // Process new MessageAdded events and call your extraction/DB save routines
}
```

---

## Step 3: Set Up Gmail Watch

1. **Initiate `users.watch` for Each Connected Gmail User**
   - Authenticate via OAuth2
   - Call Gmail API:

```typescript
await gmail.users.watch({
  userId: 'me',
  requestBody: {
    topicName: 'projects/YOUR_PROJECT_ID/topics/gmail-notifications',
    labelIds: ['INBOX']
  }
});
```

- Save response `historyId` for future sync.
- Store watch expiration time (watch requests expire every 7 days, must renew).

2. **Automate Watch Renewal**
   - Use Supabase Cron or Vercel Cron (or your preferred scheduler)
   - Call initial watch endpoint for each connected Gmail account every 3-6 days

---

## Step 4: Google Service Account Credential Management on Vercel

- Use [GCP-Vercel integration](https://vercel.com/integrations/gcp) or manually add env vars:
  - `GCP_PROJECT_ID`: your project ID
  - `GCP_PRIVATE_KEY`: from your credentials JSON file
  - `GCP_SERVICE_ACCOUNT_EMAIL`: email field from credentials
- If using JSON keys, base64 encode and store in Vercel secrets (see docs [132])
- Use Google Auth libraries to sign requests and access Pub/Sub API and Gmail API securely.

---

## Step 5: Verify Your Endpoint / Domain

- Domain verification is **recommended** to enhance security
- Use Google Search Console or API Console > Domain verification[44][117][124][121]
- Add your Vercel domain and verify ownership

---

## Step 6: Security Best Practices
- Validate webhook requests with tokens or headers
- Poll `users.history.list` only when a push is received (never blindly poll)
- Store last processed `historyId` per user
- Handle missing history gracefully (if outside retention duration, perform full sync)[135][130]
- Monitor Pub/Sub delivery and failure logs in GCP

---

## Step 7: Monitoring & Debugging
- Confirm push notifications are delivered to your endpoints
- Log all errors and notification attempts
- Use GCP logs and Vercel logs for debugging (alerts if failed)
- Test on staging before production

---

## Step 8: Cost & Free Tier Considerations
- GCP Pub/Sub is free up to 10GB messages per month[6][52]
- Vercel Functions: 100,000 requests/month free (well within range for small user base)
- Gmail API quotas **should not** be exceeded for basic sync/notification flow[15][30]

---

## Architecture Summary

```
Gmail (User) --> Gmail API (users.watch) --> GCP Pub/Sub (Topic) --> Vercel (Webhook API) --> Gmail API (users.history.list) --> Supabase (Store) --> AI Extraction --> UI
```

---

## Example Production Workflow
1. User connects Gmail via OAuth in your app
2. Your backend calls Gmail `users.watch` for this user (with topic pointing to GCP Pub/Sub)
3. Gmail pushes notifications to GCP Pub/Sub for each change
4. Pub/Sub pushes message to your Vercel webhook endpoint
5. Your serverless function receives the push, extracts relevant info
6. Calls Gmail API `users.history.list` (with previous historyId, gets new mails)
7. New emails are extracted and saved to Supabase
8. Repeat until user disconnects or disables integration

---

## Maintenance Plan
- Schedule weekly renewal of all Gmail watches (Supabase Cron recommended)
- Periodically verify Pub/Sub topic and subscription health
- Monitor logs and set alerts for failures
- Plan for Gmail API changes/deprecations

---

## Additional References
- [Gmail Push Notifications Guide](https://developers.google.com/workspace/gmail/api/guides/push)[15]
- [GCP Pub/Sub on Vercel](https://www.gcpvercel.com/docs/pub-sub)[116]
- [Credentials Setup](https://www.gcpvercel.com/docs/usage)[132]
- [GCP-Vercel Integration](https://vercel.com/integrations/gcp)[123]
- [users.watch API](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.watch)[45]
- [users.history.list API](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.history/list)[133]

---

## Final Thoughts
This plan enables Gmail push notification with **serverless real-time workflows** on Vercel using the free tiers for GCP and Vercel. Follow all security and credential management steps for best reliability and maintainability.
