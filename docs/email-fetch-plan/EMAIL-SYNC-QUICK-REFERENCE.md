# Email Sync - Quick Reference

**Last Updated**: 2025-11-09

---

## 🚀 **Quick Start**

### **Enable Auto-Sync for a Connection**

```sql
UPDATE fb_gmail_connections
SET auto_sync_enabled = true,
    auto_sync_interval_minutes = 15
WHERE email_address = 'user@gmail.com';
```

### **Trigger Manual Sync**

```bash
curl -X POST https://your-domain.vercel.app/api/gmail/manual-sync \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=..." \
  -d '{
    "connection_id": "uuid",
    "start_date": "2025-01-01T00:00:00Z",
    "end_date": "2025-01-31T23:59:59Z"
  }'
```

---

## 📋 **API Endpoints**

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/cron/gmail-auto-sync` | GET | Auto-sync cron | Cron secret |
| `/api/gmail/manual-sync` | POST | Manual sync | User auth |
| `/api/emails/search` | POST | Search + sync | User auth |
| `/api/gmail/auto-sync/status` | GET | Check status | User auth |
| `/api/gmail/auto-sync/toggle` | POST | Enable/disable | User auth |

---

## 🔄 **Sync Flow (Simplified)**

```
Cron (every 15 min)
    ↓
Find enabled connections
    ↓
For each connection:
    ↓
    Refresh token if needed
    ↓
    Call Gmail API
    ↓
    Get new message IDs
    ↓
    Fetch full messages
    ↓
    Store in fb_emails
    ↓
    Process for transactions (optional)
    ↓
    Create notifications
```

---

## 📊 **Database Quick Queries**

### **Check Auto-Sync Status**

```sql
SELECT 
  email_address,
  auto_sync_enabled,
  last_auto_sync_at,
  last_error
FROM fb_gmail_connections
WHERE user_id = auth.uid();
```

### **Recent Emails**

```sql
SELECT 
  from_address,
  subject,
  internal_date,
  status
FROM fb_emails
WHERE user_id = auth.uid()
ORDER BY internal_date DESC
LIMIT 10;
```

### **Sync Statistics (Last 24h)**

```sql
SELECT 
  c.email_address,
  COUNT(e.id) as emails_synced,
  MAX(e.created_at) as last_sync
FROM fb_gmail_connections c
LEFT JOIN fb_emails e ON e.connection_id = c.id
  AND e.created_at > NOW() - INTERVAL '24 hours'
WHERE c.user_id = auth.uid()
GROUP BY c.email_address;
```

---

## ⚙️ **Configuration**

### **Cron Schedule**

```json
{
  "crons": [
    {
      "path": "/api/cron/gmail-auto-sync",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

**Cron Syntax**:
- `*/15 * * * *` - Every 15 minutes
- `0 * * * *` - Every hour
- `0 */6 * * *` - Every 6 hours

### **Environment Variables**

```bash
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=...
CRON_SECRET=...
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## 🚨 **Common Issues**

### **Emails Not Syncing**

```sql
-- Check if auto-sync is enabled
SELECT auto_sync_enabled, last_error
FROM fb_gmail_connections
WHERE email_address = 'user@gmail.com';

-- Enable auto-sync
UPDATE fb_gmail_connections
SET auto_sync_enabled = true
WHERE email_address = 'user@gmail.com';
```

### **Token Expired**

```sql
-- Check token expiry
SELECT email_address, token_expiry
FROM fb_gmail_connections
WHERE token_expiry < NOW();

-- User must reconnect via UI
-- No manual fix available
```

### **Cron Not Running**

1. Check Vercel Dashboard → Cron Jobs
2. Verify `CRON_SECRET` is set
3. Check Vercel logs for errors

---

## 📈 **Monitoring**

### **Vercel Logs**

```bash
# Follow logs
vercel logs --follow

# Filter for auto-sync
vercel logs | grep "auto-sync"
```

### **Key Log Messages**

```
✅ "Auto-sync cron job started"
✅ "Found X connections with auto-sync enabled"
✅ "Syncing connection: user@gmail.com"
✅ "Sync completed: X new emails"
❌ "Failed to sync: error message"
```

---

## 🔐 **Security**

### **Cron Authentication**

```typescript
// In cron endpoint
const cronSecret = req.headers['authorization'];
const expectedSecret = `Bearer ${process.env.CRON_SECRET}`;

if (cronSecret !== expectedSecret) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

### **User Authentication**

```typescript
// In user endpoints
const user = await requireAuth(req, res);
if (!user) return; // 401 already sent
```

### **Row Level Security**

```sql
-- All tables enforce this
CREATE POLICY "Users can only access their own data"
  ON fb_emails FOR ALL
  USING (user_id = auth.uid());
```

---

## 🛠️ **Useful Commands**

### **Enable Auto-Sync for All Connections**

```sql
UPDATE fb_gmail_connections
SET auto_sync_enabled = true,
    auto_sync_interval_minutes = 15
WHERE user_id = auth.uid();
```

### **Disable Auto-Sync**

```sql
UPDATE fb_gmail_connections
SET auto_sync_enabled = false
WHERE email_address = 'user@gmail.com';
```

### **Reset Last Sync Time**

```sql
UPDATE fb_gmail_connections
SET last_auto_sync_at = NULL
WHERE email_address = 'user@gmail.com';
```

### **Clear Error Messages**

```sql
UPDATE fb_gmail_connections
SET last_error = NULL
WHERE email_address = 'user@gmail.com';
```

---

## 📝 **Testing**

### **Test Cron Locally**

```bash
# Start dev server
npm run dev

# Call cron endpoint
curl http://localhost:3000/api/cron/gmail-auto-sync \
  -H "Authorization: Bearer your-cron-secret"
```

### **Test Manual Sync**

```bash
curl -X POST http://localhost:3000/api/gmail/manual-sync \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=..." \
  -d '{
    "connection_id": "uuid",
    "start_date": "2025-01-01T00:00:00Z",
    "end_date": "2025-01-31T23:59:59Z"
  }'
```

---

## 🎯 **Best Practices**

1. ✅ Enable auto-sync for all active connections
2. ✅ Use 15-minute interval (default)
3. ✅ Configure sync filters to reduce API calls
4. ✅ Monitor Vercel logs regularly
5. ✅ Handle token refresh automatically
6. ✅ Check for duplicates before inserting
7. ✅ Use idempotency keys (message_id)

---

## 📚 **Related Documentation**

- [EMAIL-SYNC-WORKFLOW.md](./EMAIL-SYNC-WORKFLOW.md) - Complete workflow documentation
- [Finance-Buddy-PRD-Tech.md](./Finance-Buddy-PRD-Tech.md) - Technical specification
- [GMAIL_AUTO_SYNC_DESIGN.md](./GMAIL_AUTO_SYNC_DESIGN.md) - Auto-sync design

---

## 🆘 **Support**

**Common Questions**:

**Q: How often does auto-sync run?**  
A: Every 15 minutes by default (configurable per connection)

**Q: Can I sync older emails?**  
A: Yes, use manual sync with date range

**Q: What happens if Gmail API is down?**  
A: Sync fails, error logged, retries on next cron run

**Q: How do I know if sync is working?**  
A: Check `last_auto_sync_at` timestamp and Vercel logs

**Q: Can I disable auto-sync?**  
A: Yes, set `auto_sync_enabled = false`

---

**For detailed information, see [EMAIL-SYNC-WORKFLOW.md](./EMAIL-SYNC-WORKFLOW.md)**

