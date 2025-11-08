# Phase 4: History-Based Sync Optimization

## 🎯 Objective
Optimize history-based sync for efficiency, handle edge cases, and implement fallback mechanisms.

---

## 🔧 Optimizations to Implement

### **1. History Gap Detection**

Handle cases where history is too old or unavailable.

**File**: `src/lib/gmail-watch/history-sync.ts` (enhancement)

```typescript
/**
 * Detect if history gap is too large
 */
private async detectHistoryGap(
  gmail: any,
  startHistoryId: string
): Promise<boolean> {
  try {
    const response = await gmail.users.history.list({
      userId: 'me',
      startHistoryId: startHistoryId,
      maxResults: 1,
    });
    return false; // History available
  } catch (error: any) {
    if (error.code === 404 || error.message?.includes('history')) {
      console.warn('⚠️ History gap detected - history too old');
      return true;
    }
    throw error;
  }
}

/**
 * Perform full sync as fallback
 */
private async performFullSync(connectionId: string): Promise<void> {
  console.log('🔄 Performing full sync due to history gap');
  
  // Calculate sync window (last 7 days)
  const syncFrom = new Date();
  syncFrom.setDate(syncFrom.getDate() - 7);
  
  const timeQuery = `after:${Math.floor(syncFrom.getTime() / 1000)}`;
  
  // Use existing manual sync logic
  const { data: connection } = await supabaseAdmin
    .from('fb_gmail_connections')
    .select('*')
    .eq('id', connectionId)
    .single();
  
  if (!connection) return;
  
  // Trigger manual sync
  await fetch(`${process.env.NEXTAUTH_URL}/api/gmail/manual-sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      connection_id: connectionId,
      user_id: connection.user_id,
      date_from: syncFrom.toISOString().split('T')[0],
      date_to: new Date().toISOString().split('T')[0],
    }),
  });
}
```

### **2. Batch Processing**

Process multiple history records efficiently.

```typescript
/**
 * Batch process history records
 */
private async batchProcessHistory(
  history: any[],
  batchSize: number = 10
): Promise<string[]> {
  const allMessageIds: string[] = [];
  
  for (let i = 0; i < history.length; i += batchSize) {
    const batch = history.slice(i, i + batchSize);
    
    for (const record of batch) {
      if (record.messagesAdded) {
        for (const added of record.messagesAdded) {
          if (added.message?.id) {
            allMessageIds.push(added.message.id);
          }
        }
      }
    }
  }
  
  return allMessageIds;
}
```

### **3. Rate Limiting**

Respect Gmail API quotas.

```typescript
/**
 * Rate limiter for Gmail API calls
 */
class RateLimiter {
  private lastCall: number = 0;
  private readonly minInterval: number = 100; // ms between calls
  
  async throttle(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCall;
    
    if (timeSinceLastCall < this.minInterval) {
      await new Promise(resolve => 
        setTimeout(resolve, this.minInterval - timeSinceLastCall)
      );
    }
    
    this.lastCall = Date.now();
  }
}
```

### **4. Deduplication**

Ensure no duplicate processing.

```typescript
/**
 * Check for duplicate messages before processing
 */
private async filterDuplicates(
  messageIds: string[],
  userId: string
): Promise<string[]> {
  if (messageIds.length === 0) return [];
  
  const { data: existing } = await supabaseAdmin
    .from('fb_emails')
    .select('message_id')
    .eq('user_id', userId)
    .in('message_id', messageIds);
  
  const existingSet = new Set(existing?.map(e => e.message_id) || []);
  return messageIds.filter(id => !existingSet.has(id));
}
```

---

## 🔄 Enhanced History Sync

**Updated**: `src/lib/gmail-watch/history-sync.ts`

```typescript
async syncFromHistory(
  connectionId: string,
  startHistoryId: string
): Promise<HistorySyncResult> {
  try {
    console.log(`📜 Starting optimized history sync from ${startHistoryId}`);

    // Step 1: Get connection
    const { data: connection } = await supabaseAdmin
      .from('fb_gmail_connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (!connection) {
      throw new Error('Connection not found');
    }

    // Step 2: Refresh token if needed
    let accessToken = connection.access_token;
    if (new Date(connection.token_expiry) <= new Date()) {
      const tokens = await refreshAccessToken(connection.refresh_token);
      accessToken = tokens.access_token;
    }

    const gmail = createGmailClient(accessToken);

    // Step 3: Check for history gap
    const hasGap = await this.detectHistoryGap(gmail, startHistoryId);
    
    if (hasGap) {
      console.warn('⚠️ History gap detected, performing full sync');
      await this.performFullSync(connectionId);
      
      // Get new history ID after full sync
      const watchResponse = await gmail.users.getProfile({ userId: 'me' });
      const newHistoryId = watchResponse.data.historyId;
      
      return {
        success: true,
        newMessages: 0,
        processedTransactions: 0,
        newHistoryId,
      };
    }

    // Step 4: Fetch history with pagination
    let allHistory: any[] = [];
    let pageToken: string | undefined;
    const rateLimiter = new RateLimiter();
    
    do {
      await rateLimiter.throttle();
      
      const historyResponse = await gmail.users.history.list({
        userId: 'me',
        startHistoryId: startHistoryId,
        historyTypes: ['messageAdded'],
        labelId: 'INBOX',
        maxResults: 100,
        pageToken,
      });
      
      allHistory = allHistory.concat(historyResponse.data.history || []);
      pageToken = historyResponse.data.nextPageToken;
      
    } while (pageToken);

    console.log(`📬 Found ${allHistory.length} history records`);

    // Step 5: Batch process history
    const newMessageIds = await this.batchProcessHistory(allHistory);
    console.log(`🆕 ${newMessageIds.length} new messages found`);

    if (newMessageIds.length === 0) {
      return {
        success: true,
        newMessages: 0,
        processedTransactions: 0,
        newHistoryId: historyResponse.data.historyId,
      };
    }

    // Step 6: Filter duplicates
    const trulyNewIds = await this.filterDuplicates(
      newMessageIds,
      connection.user_id
    );
    
    console.log(`✨ ${trulyNewIds.length} truly new messages`);

    if (trulyNewIds.length === 0) {
      return {
        success: true,
        newMessages: 0,
        processedTransactions: 0,
        newHistoryId: historyResponse.data.historyId,
      };
    }

    // Step 7: Fetch and process (reuse existing logic)
    const syncResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/gmail/manual-sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        connection_id: connectionId,
        user_id: connection.user_id,
        message_ids: trulyNewIds,
      }),
    });

    if (!syncResponse.ok) {
      throw new Error('Failed to sync messages');
    }

    // Step 8: Process with AI
    const processedCount = await this.processNewMessages(
      trulyNewIds,
      connection.user_id
    );

    // Step 9: Update history ID
    const newHistoryId = historyResponse.data.historyId;
    
    await supabaseAdmin
      .from('fb_gmail_connections')
      .update({ last_history_id: newHistoryId })
      .eq('id', connectionId);

    await supabaseAdmin
      .from('fb_gmail_watch_subscriptions')
      .update({ history_id: newHistoryId })
      .eq('connection_id', connectionId);

    return {
      success: true,
      newMessages: trulyNewIds.length,
      processedTransactions: processedCount,
      newHistoryId,
    };
  } catch (error: any) {
    console.error('❌ History sync failed:', error);
    return {
      success: false,
      newMessages: 0,
      processedTransactions: 0,
      error: error.message,
    };
  }
}
```

---

## 📊 Performance Metrics

Add logging for performance tracking:

```typescript
/**
 * Log sync performance metrics
 */
private async logSyncMetrics(result: HistorySyncResult, duration: number): Promise<void> {
  console.log('📊 Sync Performance Metrics:', {
    duration_ms: duration,
    new_messages: result.newMessages,
    processed_transactions: result.processedTransactions,
    messages_per_second: result.newMessages / (duration / 1000),
  });
  
  // Store metrics in database (optional)
  await supabaseAdmin
    .from('fb_sync_metrics')
    .insert({
      sync_type: 'history',
      duration_ms: duration,
      messages_synced: result.newMessages,
      transactions_processed: result.processedTransactions,
    });
}
```

---

## ✅ Testing Checklist

- [ ] History gap detection tested
- [ ] Full sync fallback tested
- [ ] Batch processing verified
- [ ] Rate limiting working
- [ ] Deduplication tested
- [ ] Performance metrics logged
- [ ] Edge cases handled
- [ ] Error recovery tested

---

**Next Phase**: Phase 5 - GCP Setup & Configuration

