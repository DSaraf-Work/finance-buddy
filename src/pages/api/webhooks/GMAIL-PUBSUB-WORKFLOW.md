# Gmail Pub/Sub Webhook Workflow

**Endpoint**: `POST /api/webhooks/gmail-pubsub`

**Purpose**: Receives push notifications from Google Cloud Pub/Sub when new emails arrive in connected Gmail accounts and syncs them to the database.

---

## 📋 Current Workflow (Step-by-Step)

### **Step 1: Validate HTTP Method**
```typescript
if (req.method !== 'POST') {
  return res.status(405).json({ error: 'Method not allowed' });
}
```
- ✅ **Keep**: Only POST requests allowed
- ❌ **Remove**: N/A

---

### **Step 2: Log Request Details**
```typescript
console.log('🔔 Received Gmail Pub/Sub notification');
console.log('📨 REQUEST HEADERS:', JSON.stringify(req.headers, null, 2));
console.log('📦 REQUEST BODY:', JSON.stringify(req.body, null, 2));
```
- ✅ **Keep**: Useful for debugging
- ⚠️ **Modify**: Can reduce verbosity in production
- ❌ **Remove**: If logs are too noisy

---

### **Step 3: Validate Webhook Token (Optional Security)**
```typescript
const token = req.headers['x-webhook-token'] as string;
if (!validator.verifyToken(token)) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```
**Current Behavior**:
- If `PUBSUB_WEBHOOK_TOKEN` env var is NOT set → **Skips validation** ⚠️
- If `PUBSUB_WEBHOOK_TOKEN` env var IS set → **Validates token**

**Options**:
- ✅ **Keep**: Add `PUBSUB_WEBHOOK_TOKEN` to Vercel env vars for security
- ⚠️ **Modify**: Make token validation mandatory (fail if not set)
- ❌ **Remove**: If you trust the source (not recommended)

---

### **Step 4: Validate Message Structure**
```typescript
if (!validator.validateMessage(req.body)) {
  return res.status(400).json({ error: 'Invalid message format' });
}

update vladiate mesag structure 

{
  message: {
    data: Utilities.base64Encode(message.getPlainBody()),
    messageId: message.getId(),
    publishTime: message.getDate().toISOString(),
    attributes: {
      emailAddress: Session.getActiveUser().getEmail(),
      messageId: message.getId(),
      subject: message.getSubject(),
      from: senderEmail,
      historyId: thread.getId()
    }
  }
}

the message is a gmail message. 


```
**Validates**:
- `body.message` exists
- `body.message.data` exists (base64-encoded)
- `body.message.messageId` exists

**Options**:
- ✅ **Keep**: Essential validation
- ❌ **Remove**: Not recommended

---

### **Step 5: Decode & Log Message Data**
```typescript
const decodedData = Buffer.from(req.body.message.data, 'base64').toString('utf-8');
console.log('🔓 DECODED MESSAGE DATA:', decodedData);

const parsedData = JSON.parse(decodedData);
console.log('📋 PARSED MESSAGE DATA:', JSON.stringify(parsedData, null, 2));
```

update paersed data
**Options**:
- ✅ **Keep**: Helpful for debugging
- ⚠️ **Modify**: Remove console.logs in production
- ❌ **Remove**: If logs are too verbose

---

### **Step 6: Test Message Detection**
```typescript
if (dataStr.includes('test') || dataStr.includes('Test') || dataStr.includes('TEST')) {
  console.log('📨 Detected test message from GCP Console:', dataStr);
  return res.status(200).json({
    success: true,
    message: 'Test message received',
    note: 'This was a test message from GCP Console'
  });
}
```
**Options**:
- ✅ **Keep**: Prevents errors from manual GCP Console testing
- ⚠️ **Modify**: Use a specific test token instead of string matching
- ❌ **Remove**: If you never send test messages

---


ignore step 7
### **Step 7: Parse Gmail Notification**
```typescript

use emailAddress to find the connection id and fetch the message details using the messgae id messageId 

notification = validator.parseMessage(req.body);
// Returns: { emailAddress: "user@gmail.com", historyId: "12345678" }
```
**Options**:
- ✅ **Keep**: Essential for processing
- ❌ **Remove**: Not possible

---

ignore step 8
### **Step 8: Find Gmail Connection**
```typescript
const { data: connection } = await supabaseAdmin
  .from('fb_gmail_connections')
  .select('*')
  .eq('email_address', notification.emailAddress)
  .eq('watch_enabled', true)
  .single();

if (!connection) {
  return res.status(200).json({
    success: false,
    message: 'No active watch found'
  });
}
```
**Options**:
- ✅ **Keep**: Essential - need connection to sync emails
- ⚠️ **Modify**: Add retry logic if connection temporarily unavailable
- ❌ **Remove**: Not possible

---

new step -  
  use emailAddress to find the connection id and fetch the message details using the messgae id messageId 
  store in fb_emails as per current structure
  trigger tranasaction processing using ai (keep commented for now)



### **Step 9: Create Audit Log**
```typescript
auditLogId = await AuditLogger.logWebhookReceived(req, {
  messageId: req.body?.message?.messageId,
  subscriptionName: req.body?.subscription,
  publishTime: req.body?.message?.publishTime,
  emailAddress: notification.emailAddress,
  historyId: notification.historyId,
  connectionId: connection.id,
  userId: connection.user_id,
  requestHeaders: req.headers,
  requestBody: req.body,
});
```
**Stores in**: `fb_gmail_webhook_audit`

### **Step 12: Update Audit Log - Processing Started**
```typescript
if (auditLogId) {
  await AuditLogger.updateAuditLog(auditLogId, {
    status: 'processing',
    historyStartId: lastHistoryId,
  });
}
```
**Options**:
- ✅ **Keep**: Good for tracking processing state
- ⚠️ **Modify**: Combine with final update to reduce DB calls
- ❌ **Remove**: If you don't need intermediate status updates

---
// ignore
### **Step 13: Sync Emails from Gmail History** 🔄 CORE FUNCTIONALITY
```typescript
const syncStartTime = Date.now();
const syncResult = await historySync.syncFromHistory(
  connection.id,
  lastHistoryId
);
const syncDuration = Date.now() - syncStartTime;
```

**What `syncFromHistory()` does**:
1. Refreshes access token if expired
2. Calls Gmail API `users.history.list` to get changes since `lastHistoryId`
3. Filters for `messagesAdded` events
4. Batch fetches full message details (up to 10 at a time)
5. Stores emails in `fb_emails` table
6. ~~Processes emails for transaction extraction~~ **CURRENTLY DISABLED**
7. Updates connection's `last_history_id`

**Returns**:
```typescript
{
  success: true,
  newMessages: 3,
  processedTransactions: 0, // Disabled
  newHistoryId: "10806733",
  emailIds: ["uuid1", "uuid2", "uuid3"],
  transactionIds: [] // Disabled
}
```

**Options**:
- ✅ **Keep**: Core functionality - essential
- ⚠️ **Modify**:
  - Add error retry logic
  - Implement rate limiting
  - Add timeout handling
  - Process in background for large syncs
- ❌ **Remove**: Not possible

---
// ignore
### **Step 14: Update Audit Log with Results**
```typescript
if (auditLogId) {
  await AuditLogger.updateAuditLog(auditLogId, {
    status: syncResult.success ? 'success' : 'failed',
    success: syncResult.success,
    errorMessage: syncResult.error || undefined,
    newMessagesCount: syncResult.newMessages || 0,
    transactionsExtracted: 0, // Transaction processing disabled
    historyEndId: notification.historyId,
    gmailApiDurationMs: syncDuration,
    emailIds: syncResult.emailIds || [],
    transactionIds: [], // No transactions extracted (processing disabled)
    metadata: {
      syncResult,
      notification,
      note: 'Transaction processing temporarily disabled',
    },
  });
}
```
**Options**:
- ✅ **Keep**: Essential for monitoring and debugging
- ⚠️ **Modify**: Reduce metadata size if too large
- ❌ **Remove**: Not recommended

---
// ignore
### **Step 15: Update Legacy Webhook Log** 🗑️ DEPRECATED
```typescript
if (webhookLog) {
  await supabaseAdmin
    .from('fb_webhook_logs')
    .update({
      processed_at: new Date().toISOString(),
      success: syncResult.success,
      new_messages: syncResult.newMessages,
      error_message: syncResult.error || null,
    })
    .eq('id', webhookLog.id);
}
```
**Options**:
- ⚠️ **Modify**: Keep for backward compatibility
- ❌ **Remove**: Recommended - use `fb_gmail_webhook_audit` instead

---

### **Step 16: Return Success Response**
```typescript
console.log('✅ Webhook processed:', syncResult);
console.log('⚠️ Transaction processing is currently disabled');

return res.status(200).json({
  success: syncResult.success,
  newMessages: syncResult.newMessages,
  processedTransactions: 0, // Transaction processing disabled
  emailIds: syncResult.emailIds || [],
  note: 'Emails stored successfully. Transaction processing is temporarily disabled.',
});
```
**Options**:
- ✅ **Keep**: Essential response
- ⚠️ **Modify**:
  - Remove console.logs in production
  - Add more details to response
  - Remove transaction-related fields if permanently disabled
- ❌ **Remove**: Not possible

---

### **Error Handling**
```typescript
catch (error: any) {
  console.error('❌ Webhook processing failed:', error);

  if (auditLogId) {
    await AuditLogger.logError(auditLogId, error);
  }

  return res.status(500).json({
    error: error.message,
    success: false,
  });
}
```
**Options**:
- ✅ **Keep**: Essential error handling
- ⚠️ **Modify**:
  - Add retry logic for transient errors
  - Send alerts for critical errors
  - Return 200 to Pub/Sub (prevent retries) for non-retryable errors
- ❌ **Remove**: Not possible

---

## 📊 Database Tables Used

| Table | Usage | Status | Recommendation |
|-------|-------|--------|----------------|
| `fb_gmail_webhook_audit` | Primary audit log | ✅ Active | **Keep** - comprehensive tracking |
| `fb_webhook_logs` | Legacy webhook log | 🗑️ Deprecated | **Remove** - redundant with audit table |
| `fb_emails` | Stores synced emails | ✅ Active | **Keep** - core data |
| `fb_gmail_connections` | Gmail account connections | ✅ Active | **Keep** - essential |
| `fb_gmail_watch_subscriptions` | Watch subscription tracking | ⚠️ Partial | **Fix** - currently not being updated |
| `fb_extracted_transactions` | Transaction data | ❌ Disabled | **Enable or Remove** - decide on transaction processing |

---

## 🔄 Transaction Processing (Currently Disabled)

### **What's Disabled**
```typescript
// In history-sync.ts (line 270-279)
// TODO: TRANSACTION PROCESSING TEMPORARILY DISABLED
// const extractedTransactionIds = await this.emailProcessor.processEmail(emailId);
// if (extractedTransactionIds && extractedTransactionIds.length > 0) {
//   transactionIds.push(...extractedTransactionIds);
// }

console.log(`📧 Email stored (ID: ${emailId}) - Transaction processing disabled`);
```

### **Options**
1. ✅ **Re-enable**: Uncomment the code to extract transactions from emails
2. ⚠️ **Process Async**: Move to background job (recommended for performance)
3. ❌ **Remove Permanently**: Delete transaction extraction code if not needed

---

## 🗑️ Deprecated Components (Recommended for Removal)

### **1. Legacy Webhook Logs Table**
- **Table**: `fb_webhook_logs`
- **Reason**: Redundant with `fb_gmail_webhook_audit`
- **Action**:
  - Remove Step 10 (create legacy log)
  - Remove Step 15 (update legacy log)
  - Deprecate `fb_webhook_logs` table
  - Migrate any dependent queries to use `fb_gmail_webhook_audit`

### **2. Watch Subscription Updates**
- **Issue**: `fb_gmail_watch_subscriptions` table exists but not being updated
- **Current**: History sync updates `fb_gmail_connections.last_history_id` only
- **Action**:
  - Either update `fb_gmail_watch_subscriptions.history_id` in sync
  - Or remove the table if not needed

---

## 🎯 Recommended Workflow Modifications

### **High Priority**
1. ❌ **Remove legacy webhook logs** (Steps 10 & 15)
2. ✅ **Add webhook token security** (set `PUBSUB_WEBHOOK_TOKEN`)
3. ⚠️ **Decide on transaction processing** (enable, async, or remove)
4. ✅ **Fix watch subscription tracking** (update `fb_gmail_watch_subscriptions`)

### **Medium Priority**
5. ⚠️ **Reduce logging verbosity** in production
6. ⚠️ **Add retry logic** for transient Gmail API errors
7. ⚠️ **Add timeout handling** for long-running syncs
8. ⚠️ **Return 200 to Pub/Sub** for non-retryable errors (prevent infinite retries)

### **Low Priority**
9. ⚠️ **Optimize audit log storage** (reduce metadata size)
10. ⚠️ **Add performance monitoring** (track sync duration trends)

---

## 📝 How to Modify This Workflow

1. **Edit this file** with your desired changes
2. **Mark steps** as:
   - ✅ **Keep** - No changes needed
   - ⚠️ **Modify** - Needs changes (describe what)
   - ❌ **Remove** - Delete this step
3. **Update the code** in `src/pages/api/webhooks/gmail-pubsub.ts`
4. **Test thoroughly** with test webhook logger
5. **Deploy and monitor**

---

## 🧪 Testing

Use the test webhook logger to verify changes:
```bash
curl -X POST http://localhost:3000/api/webhooks/test-logger \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "data": "eyJlbWFpbEFkZHJlc3MiOiJkaGVlcmFqc2FyYWYxOTk2QGdtYWlsLmNvbSIsImhpc3RvcnlJZCI6MTIzNDU2Nzh9",
      "messageId": "test-123"
    }
  }'
```

Then test the actual webhook:
```bash
curl -X POST http://localhost:3000/api/webhooks/gmail-pubsub \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "data": "eyJlbWFpbEFkZHJlc3MiOiJkaGVlcmFqc2FyYWYxOTk2QGdtYWlsLmNvbSIsImhpc3RvcnlJZCI6MTIzNDU2Nzh9",
      "messageId": "test-123"
    }
  }'
```


**Options**:
- ✅ **Keep**: Essential for debugging and monitoring
- ⚠️ **Modify**: Reduce stored data (e.g., don't store full headers/body)
- ❌ **Remove**: Not recommended - lose audit trail

---

### **Step 10: Create Legacy Webhook Log** 🗑️ DEPRECATED
```typescript
const { data: webhookLog } = await supabaseAdmin
  .from('fb_webhook_logs')
  .insert({
    email_address: notification.emailAddress,
    history_id: notification.historyId,
    received_at: new Date().toISOString(),
    success: false,
    new_messages: 0,
  })
  .select()
  .single();
```
**Stores in**: `fb_webhook_logs` (legacy table)

**Options**:
- ⚠️ **Modify**: Keep for backward compatibility
- ❌ **Remove**: If you don't need `fb_webhook_logs` table anymore
  - **Recommendation**: Remove this step and deprecate `fb_webhook_logs` table
  - Use `fb_gmail_webhook_audit` instead (more comprehensive)

---

### **Step 11: Check Last History ID**
```typescript
const lastHistoryId = connection.last_history_id;

if (!lastHistoryId) {
  return res.status(200).json({
    success: false,
    message: 'No last history ID'
  });
}
```
**Options**:
- ✅ **Keep**: Essential - need starting point for sync
- ⚠️ **Modify**: Handle first-time setup better (fetch all recent emails)
- ❌ **Remove**: Not possible

---


