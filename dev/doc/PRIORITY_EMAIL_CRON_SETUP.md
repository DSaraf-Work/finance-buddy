# Priority Email Cron Job Setup

## Overview

Automated cron job that runs **every minute** to fetch and process unread emails from priority senders. This ensures critical financial transaction emails are processed immediately.

## Priority Senders

The system monitors these email addresses for unread emails:
- `alerts@dcbbank.com`
- `alerts@yes.bank.in`
- `alerts@hdfcbank.net`

## How It Works

### Flow
1. **Cron Trigger**: Vercel Cron calls `/api/cron/priority-email-check` every minute
2. **Configuration Check**: Verifies if priority email checking is enabled
3. **Connection Scan**: Finds all active Gmail connections
4. **Email Search**: Searches for unread emails from priority senders
5. **Processing**: For each unread email:
   - Fetches email details from Gmail
   - Checks for duplicates in database
   - Stores email in `fb_emails_fetched`
   - Processes with AI to extract transaction
   - Creates notification for user
   - Marks email as read in Gmail
6. **Result**: Returns summary of processed emails

### Key Features
- ✅ **Automatic Processing**: No manual intervention needed
- ✅ **Idempotency**: Duplicate emails are skipped
- ✅ **Mark as Read**: Processed emails are marked as read
- ✅ **AI Extraction**: Automatic transaction extraction
- ✅ **Notifications**: User gets notified of new transactions
- ✅ **Error Handling**: Continues processing even if one email fails

## Configuration

### Vercel Cron Schedule

**File**: `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/priority-email-check",
      "schedule": "*/1 * * * *"
    }
  ]
}
```

**Schedule**: `*/1 * * * *` = Every 1 minute

### Environment Variables

**Required**:
- `CRON_SECRET` - Secret token for authenticating cron requests

**Example**:
```bash
# Generate a secure random secret
openssl rand -base64 32

# Add to .env.local and Vercel environment variables
CRON_SECRET=your-random-secret-here
```

### Database Configuration

The system uses `fb_config` table for runtime configuration:

| Config Key | Type | Default | Description |
|------------|------|---------|-------------|
| `priority_email_check_enabled` | boolean | false | Enable/disable priority email checking |
| `priority_email_check_interval` | number | 1 | Interval in minutes (for reference only) |

**Enable Priority Email Checking**:
```sql
INSERT INTO fb_config (config_key, config_value, description)
VALUES 
  ('priority_email_check_enabled', 'true', 'Enable/disable priority email checking'),
  ('priority_email_check_interval', '1', 'Interval in minutes for priority email checking')
ON CONFLICT (config_key) DO UPDATE SET config_value = EXCLUDED.config_value;
```

## API Endpoints

### 1. Cron Endpoint (Automated)

**Endpoint**: `POST /api/cron/priority-email-check`

**Authentication**: Bearer token (CRON_SECRET)

**Headers**:
```
Authorization: Bearer <CRON_SECRET>
```

**Response**:
```json
{
  "success": true,
  "result": {
    "success": true,
    "connectionsProcessed": 2,
    "emailsFound": 5,
    "emailsProcessed": 5,
    "emailsMarkedRead": 5,
    "errors": []
  },
  "config": {
    "enabled": true,
    "intervalMinutes": 1
  },
  "timestamp": "2025-11-15T10:00:00.000Z"
}
```

### 2. Manual Trigger (Testing)

**Endpoint**: `POST /api/priority-emails/trigger`

**Authentication**: User session (withAuth middleware)

**Usage**: Allows users to manually trigger priority email check from UI

**Response**: Same as cron endpoint

### 3. Configuration Management

**Endpoint**: `GET/POST /api/priority-emails/config`

**GET Response**:
```json
{
  "success": true,
  "config": {
    "enabled": true,
    "intervalMinutes": 1
  }
}
```

**POST Request**:
```json
{
  "enabled": true,
  "intervalMinutes": 1
}
```

## Testing

### 1. Enable Priority Email Checking

```bash
curl -X POST https://your-app.vercel.app/api/priority-emails/config \
  -H "Content-Type: application/json" \
  -H "Cookie: fb_session=your-session-cookie" \
  -d '{"enabled": true, "intervalMinutes": 1}'
```

### 2. Manual Trigger

```bash
curl -X POST https://your-app.vercel.app/api/priority-emails/trigger \
  -H "Cookie: fb_session=your-session-cookie"
```

### 3. Test Cron Endpoint

```bash
curl -X POST https://your-app.vercel.app/api/cron/priority-email-check \
  -H "Authorization: Bearer your-cron-secret"
```

## Monitoring

### Logs

Check Vercel logs for cron execution:

```bash
vercel logs --follow
```

**Look for**:
- `🕐 [PriorityEmailCheck] Cron job started`
- `📧 [PriorityEmailCheck] Priority email checking is enabled`
- `✅ [PriorityEmailCheck] Cron job completed`

### Metrics

Monitor these metrics:
- **Connections Processed**: Number of Gmail connections checked
- **Emails Found**: Number of unread priority emails found
- **Emails Processed**: Number of emails successfully processed
- **Emails Marked Read**: Number of emails marked as read
- **Errors**: Any errors encountered

## Deployment

### Vercel Setup

1. **Add Cron Secret to Vercel**:
   ```bash
   vercel env add CRON_SECRET
   ```

2. **Deploy**:
   ```bash
   git push origin main
   ```

3. **Verify Cron**:
   - Go to Vercel Dashboard → Project → Settings → Cron Jobs
   - Verify `/api/cron/priority-email-check` is listed
   - Check schedule: `*/1 * * * *`

### Enable in Database

```sql
UPDATE fb_config 
SET config_value = true 
WHERE config_key = 'priority_email_check_enabled';
```

## Troubleshooting

### Cron Not Running

**Check**:
1. Verify `CRON_SECRET` is set in Vercel environment variables
2. Check Vercel Dashboard → Cron Jobs for execution history
3. Review Vercel logs for errors

### No Emails Processed

**Check**:
1. Verify priority email checking is enabled in database
2. Check if there are unread emails from priority senders
3. Verify Gmail connections are active
4. Check access token is valid

### Emails Not Marked as Read

**Check**:
1. Verify Gmail API permissions include `gmail.modify`
2. Check logs for "Marked email as read" messages
3. Verify access token has correct scopes

## Related Files

- `vercel.json` - Cron configuration
- `src/pages/api/cron/priority-email-check.ts` - Cron endpoint
- `src/lib/priority-email-processor.ts` - Core processing logic
- `src/pages/api/priority-emails/trigger.ts` - Manual trigger
- `src/pages/api/priority-emails/config.ts` - Configuration API

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Add CRON_SECRET to environment variables
3. ✅ Enable priority email checking in database
4. ✅ Test with manual trigger
5. ✅ Monitor logs for first cron execution
6. ✅ Verify emails are being processed and marked as read

