# Phase 7: Monitoring & Maintenance

## 🎯 Objective
Implement comprehensive monitoring, logging, alerting, and maintenance procedures for Gmail watch system.

---

## 📊 Monitoring Components

### **1. Watch Health Dashboard**

**File**: `src/pages/admin/watch-health.tsx`

Display real-time watch health metrics:

```typescript
interface WatchHealthMetrics {
  totalConnections: number;
  watchEnabled: number;
  watchActive: number;
  watchExpired: number;
  watchFailed: number;
  expiringSoon: number; // < 24 hours
  avgNotificationLatency: number; // seconds
  webhookSuccessRate: number; // percentage
  lastWebhookReceived: Date;
}
```

**Dashboard Sections:**
- Overview cards (total, active, failed)
- Expiring watches table
- Recent webhook activity
- Error log
- Performance metrics chart

---

### **2. Webhook Activity Logger**

**File**: `src/lib/gmail-watch/webhook-logger.ts`

```typescript
export class WebhookLogger {
  /**
   * Log webhook received
   */
  async logWebhook(data: {
    emailAddress: string;
    historyId: string;
    receivedAt: Date;
    processedAt?: Date;
    success: boolean;
    newMessages?: number;
    error?: string;
  }): Promise<void> {
    await supabaseAdmin
      .from('fb_webhook_logs')
      .insert({
        email_address: data.emailAddress,
        history_id: data.historyId,
        received_at: data.receivedAt.toISOString(),
        processed_at: data.processedAt?.toISOString(),
        success: data.success,
        new_messages: data.newMessages || 0,
        error_message: data.error,
      });
  }

  /**
   * Get recent webhook activity
   */
  async getRecentActivity(limit: number = 50): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from('fb_webhook_logs')
      .select('*')
      .order('received_at', { ascending: false })
      .limit(limit);

    return data || [];
  }

  /**
   * Get webhook success rate
   */
  async getSuccessRate(hours: number = 24): Promise<number> {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    const { data } = await supabaseAdmin
      .from('fb_webhook_logs')
      .select('success')
      .gte('received_at', since.toISOString());

    if (!data || data.length === 0) return 100;

    const successCount = data.filter(log => log.success).length;
    return (successCount / data.length) * 100;
  }
}
```

**Database Table:**
```sql
CREATE TABLE IF NOT EXISTS fb_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_address TEXT NOT NULL,
  history_id TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL,
  processed_at TIMESTAMPTZ,
  success BOOLEAN NOT NULL,
  new_messages INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhook_logs_received 
  ON fb_webhook_logs(received_at DESC);

CREATE INDEX idx_webhook_logs_email 
  ON fb_webhook_logs(email_address, received_at DESC);
```

---

### **3. Alert System**

**File**: `src/lib/gmail-watch/alert-manager.ts`

```typescript
export class AlertManager {
  /**
   * Check for watches expiring soon
   */
  async checkExpiringWatches(): Promise<void> {
    const threshold = new Date();
    threshold.setHours(threshold.getHours() + 6); // 6 hours

    const { data: expiring } = await supabaseAdmin
      .from('fb_gmail_watch_subscriptions')
      .select('*, fb_gmail_connections(email_address)')
      .eq('status', 'active')
      .lt('expiration', threshold.toISOString());

    if (expiring && expiring.length > 0) {
      await this.sendAlert({
        type: 'watch_expiring',
        severity: 'warning',
        message: `${expiring.length} watches expiring in < 6 hours`,
        data: expiring,
      });
    }
  }

  /**
   * Check for failed watches
   */
  async checkFailedWatches(): Promise<void> {
    const { data: failed } = await supabaseAdmin
      .from('fb_gmail_watch_subscriptions')
      .select('*, fb_gmail_connections(email_address)')
      .eq('status', 'failed')
      .gte('renewal_attempts', 3);

    if (failed && failed.length > 0) {
      await this.sendAlert({
        type: 'watch_failed',
        severity: 'error',
        message: `${failed.length} watches failed after 3 attempts`,
        data: failed,
      });
    }
  }

  /**
   * Check webhook health
   */
  async checkWebhookHealth(): Promise<void> {
    const logger = new WebhookLogger();
    const successRate = await logger.getSuccessRate(1); // Last hour

    if (successRate < 90) {
      await this.sendAlert({
        type: 'webhook_health',
        severity: 'error',
        message: `Webhook success rate: ${successRate.toFixed(1)}% (< 90%)`,
      });
    }
  }

  /**
   * Send alert (implement your preferred method)
   */
  private async sendAlert(alert: {
    type: string;
    severity: 'info' | 'warning' | 'error';
    message: string;
    data?: any;
  }): Promise<void> {
    console.error(`🚨 ALERT [${alert.severity}]:`, alert.message);
    
    // TODO: Implement alert delivery
    // Options:
    // - Email to admin
    // - Slack webhook
    // - Discord webhook
    // - SMS via Twilio
    // - Store in database for dashboard
  }
}
```

---

### **4. Health Check Cron**

**File**: `src/pages/api/cron/watch-health-check.ts`

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { AlertManager } from '@/lib/gmail-watch/alert-manager';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify cron secret
  const cronSecret = req.headers['authorization'];
  if (cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('🏥 Running watch health check...');

  try {
    const alertManager = new AlertManager();

    // Run all health checks
    await Promise.all([
      alertManager.checkExpiringWatches(),
      alertManager.checkFailedWatches(),
      alertManager.checkWebhookHealth(),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Health check completed',
    });
  } catch (error: any) {
    console.error('❌ Health check failed:', error);
    return res.status(500).json({ error: error.message });
  }
}
```

**Vercel Cron Configuration** (`vercel.json`):
```json
{
  "crons": [
    {
      "path": "/api/cron/gmail-watch-renewal",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/watch-health-check",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

---

## 📈 Performance Metrics

### **Key Metrics to Track**

1. **Notification Latency**
   - Time from email received to notification created
   - Target: < 30 seconds
   - Alert if > 60 seconds

2. **Webhook Success Rate**
   - Percentage of successful webhook deliveries
   - Target: > 99%
   - Alert if < 95%

3. **Watch Uptime**
   - Percentage of time watches are active
   - Target: > 99.9%
   - Alert if < 99%

4. **Gmail API Quota Usage**
   - Daily quota consumption
   - Target: < 50% of quota
   - Alert if > 80%

5. **Processing Time**
   - Time to process each email
   - Target: < 5 seconds
   - Alert if > 10 seconds

---

## 🔧 Maintenance Procedures

### **Daily Tasks**
- [ ] Review webhook logs
- [ ] Check for failed watches
- [ ] Monitor Gmail API quota
- [ ] Review error logs

### **Weekly Tasks**
- [ ] Analyze performance metrics
- [ ] Review watch renewal success rate
- [ ] Check for expired watches
- [ ] Update documentation

### **Monthly Tasks**
- [ ] Review GCP costs
- [ ] Analyze user feedback
- [ ] Update monitoring dashboards
- [ ] Plan optimizations

---

## 🚨 Incident Response

### **Watch Failure**
1. Check watch subscription status
2. Attempt manual renewal
3. If renewal fails, fallback to cron sync
4. Investigate root cause
5. Fix and re-enable watch

### **Webhook Downtime**
1. Check Vercel deployment status
2. Check GCP Pub/Sub status
3. Review webhook logs
4. Test webhook endpoint manually
5. If needed, trigger manual sync

### **High Latency**
1. Check Vercel function logs
2. Check Gmail API response times
3. Review processing pipeline
4. Optimize if needed
5. Scale if necessary

---

## 📚 Documentation

### **Operational Runbook**
Create `docs/WATCH_OPERATIONS.md` with:
- Common issues and solutions
- Escalation procedures
- Contact information
- Emergency procedures

### **API Documentation**
Update `docs/API_ENDPOINTS.md` with:
- Watch management endpoints
- Webhook endpoint
- Health check endpoints

---

## ✅ Monitoring Checklist

- [ ] Watch health dashboard created
- [ ] Webhook logger implemented
- [ ] Alert system configured
- [ ] Health check cron configured
- [ ] Performance metrics tracked
- [ ] Incident response procedures documented
- [ ] Operational runbook created
- [ ] Team trained on monitoring tools

---

## 🎉 Success!

With Phase 7 complete, you now have:
- ✅ Real-time Gmail push notifications
- ✅ Comprehensive monitoring
- ✅ Automated alerting
- ✅ Maintenance procedures
- ✅ Incident response plan

**The Gmail Pub/Sub integration is production-ready!**

---

**Implementation Complete** 🚀

