# Gmail Auto-Sync Module - Executive Summary

## Overview

This document summarizes the proposed Gmail automatic email synchronization feature for Finance Buddy.

---

## Current State Analysis

### Existing Infrastructure
✅ **Database**: Supabase PostgreSQL with tables for:
- `fb_gmail_connections`: OAuth tokens and connection details
- `fb_emails`: Synced email storage
- `fb_jobs`: Background job processing

✅ **Email Sync**: Manual sync via API endpoints:
- `/api/gmail/manual-sync`: On-demand email fetching
- `/api/gmail/backfill`: Batch historical sync
- `/api/emails/search`: Search with auto-sync

✅ **Tech Stack**:
- Next.js 14 (Pages Router) on Vercel
- Gmail API with OAuth 2.0
- Existing email processing pipeline

### Current Limitations
❌ **No automatic sync**: All syncing is manual or on-demand
❌ **No real-time detection**: Users must trigger sync manually
❌ **No filter configuration**: Cannot specify which emails to sync
❌ **No background processing**: No scheduled or event-driven sync

---

## Proposed Solution

### Architecture: Hybrid Polling + Push Notifications

**Phase 1 (MVP)**: Polling-based auto-sync
- Scheduled polling every 5-15 minutes
- Configurable per-connection filters
- Minimal infrastructure changes
- **Timeline**: 2-3 weeks

**Phase 2 (Enhancement)**: Gmail push notifications
- Real-time email detection via Google Cloud Pub/Sub
- Reduced API calls and latency
- Requires additional infrastructure
- **Timeline**: 1-2 weeks (after Phase 1)

---

## Key Features

### 1. Configurable Email Filters
Users can create filters to specify which emails to auto-sync:

| Filter Type | Example | Gmail Query |
|-------------|---------|-------------|
| Sender | `statements@bank.com` | `from:statements@bank.com` |
| Subject | `Invoice` | `subject:Invoice` |
| Label | `IMPORTANT` | `label:IMPORTANT` |
| Custom Query | `from:bank.com has:attachment` | `from:bank.com has:attachment` |

### 2. Auto-Sync Configuration
Per-connection settings:
- **Enable/Disable**: Toggle auto-sync on/off
- **Interval**: Polling frequency (5-60 minutes)
- **Filters**: Multiple filters per connection
- **Status**: Last sync time, error tracking

### 3. Background Processing
- **Job Queue**: Async processing using existing `fb_jobs` table
- **Deduplication**: Prevent duplicate email syncs
- **Retry Logic**: Automatic retry on failures
- **Rate Limiting**: Respect Gmail API quotas

---

## Database Schema Changes

### New Tables

#### `fb_sync_filters`
Stores email filter configurations.

```sql
CREATE TABLE fb_sync_filters (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  connection_id UUID REFERENCES fb_gmail_connections(id),
  filter_name TEXT NOT NULL,
  filter_type TEXT CHECK (filter_type IN ('sender', 'subject', 'label', 'query')),
  filter_value TEXT NOT NULL,
  gmail_query TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Extended Tables

#### `fb_gmail_connections`
Add auto-sync configuration columns.

```sql
ALTER TABLE fb_gmail_connections
ADD COLUMN auto_sync_enabled BOOLEAN DEFAULT false,
ADD COLUMN auto_sync_interval_minutes INTEGER DEFAULT 15,
ADD COLUMN last_auto_sync_at TIMESTAMPTZ;
```

---

## API Endpoints

### Filter Management
- `POST /api/gmail/sync-filters` - Create filter
- `GET /api/gmail/sync-filters?connection_id=uuid` - List filters
- `PATCH /api/gmail/sync-filters/:id` - Update filter
- `DELETE /api/gmail/sync-filters/:id` - Delete filter

### Auto-Sync Control
- `POST /api/gmail/auto-sync/enable` - Enable auto-sync
- `POST /api/gmail/auto-sync/disable` - Disable auto-sync
- `GET /api/gmail/auto-sync/status` - Get sync status

### Background Jobs
- `GET /api/cron/gmail-auto-sync` - Cron endpoint (Vercel Cron)
- `POST /api/gmail/webhook` - Webhook for push notifications (Phase 2)

---

## Implementation Plan

### Phase 1: Polling-Based Auto-Sync (MVP)

**Week 1: Database & Core Logic**
- [ ] Create database migration
- [ ] Implement filter manager module
- [ ] Implement Gmail query builder
- [ ] Unit tests

**Week 2: API & Sync Execution**
- [ ] Implement filter CRUD endpoints
- [ ] Implement sync executor
- [ ] Implement cron endpoint
- [ ] Integration tests

**Week 3: Testing & Deployment**
- [ ] End-to-end testing
- [ ] Deploy to staging
- [ ] User acceptance testing
- [ ] Production deployment

### Phase 2: Gmail Push Notifications (Enhancement)

**Week 4: Infrastructure Setup**
- [ ] Set up Google Cloud Pub/Sub
- [ ] Create webhook endpoint
- [ ] Implement watch subscription management

**Week 5: Integration & Testing**
- [ ] Integrate push notifications with sync executor
- [ ] Test notification delivery
- [ ] Deploy and monitor

---

## Technical Considerations

### 1. Gmail API Rate Limits
- **Quota**: 1 billion units/day (default)
- **Per-user**: 250 units/second
- **Strategy**: Batch processing, exponential backoff

### 2. Vercel Serverless Constraints
- **Execution time**: 10s (Hobby), 60s (Pro)
- **Strategy**: Process in batches, use job queue

### 3. Deduplication
- **Unique constraint**: `(user_id, google_user_id, message_id)`
- **Check before fetch**: Query `fb_emails` before calling Gmail API

### 4. Security
- **Filter validation**: Sanitize user input
- **Rate limiting**: Prevent abuse
- **Webhook verification**: Validate Pub/Sub messages (Phase 2)

---

## User Experience

### Setup Flow
1. User connects Gmail account (existing)
2. User navigates to "Auto-Sync Settings" (new)
3. User creates filters:
   - "Bank Statements" → `from:statements@bank.com`
   - "Credit Card Alerts" → `from:alerts@creditcard.com`
4. User enables auto-sync with 15-minute interval
5. System automatically syncs matching emails in background

### Monitoring
- Dashboard showing:
  - Active filters
  - Last sync time
  - Sync status (success/error)
  - Number of emails synced

---

## Benefits

### For Users
✅ **Automatic sync**: No manual intervention required
✅ **Selective sync**: Only sync relevant emails
✅ **Real-time updates**: Near real-time email detection (Phase 2)
✅ **Reduced clutter**: Filter out unwanted emails

### For System
✅ **Efficient**: Only fetch emails matching filters
✅ **Scalable**: Modular design, easy to extend
✅ **Reliable**: Retry logic, error handling
✅ **Observable**: Comprehensive logging and monitoring

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Gmail API quota exceeded | High | Rate limiting, batch processing |
| Vercel timeout | Medium | Job queue, async processing |
| Duplicate emails | Low | Unique constraint, deduplication |
| Filter misconfiguration | Low | Validation, preview feature |
| Push notification failure | Medium | Polling fallback |

---

## Cost Estimate

### Infrastructure
- **Vercel**: No additional cost (existing plan)
- **Supabase**: Minimal storage increase
- **Google Cloud Pub/Sub** (Phase 2): ~$0.40/million messages

### Development
- **Phase 1**: 2-3 weeks (1 developer)
- **Phase 2**: 1-2 weeks (1 developer)

---

## Success Metrics

### Technical Metrics
- Sync job success rate > 95%
- Average sync latency < 5 minutes (polling) / < 30 seconds (push)
- Gmail API quota usage < 50% of limit
- Zero duplicate emails synced

### User Metrics
- % of users enabling auto-sync
- Average number of filters per user
- User satisfaction score

---

## Alternatives Considered

### 1. Pure Polling
- **Pros**: Simple, no dependencies
- **Cons**: Higher latency, more API calls
- **Decision**: Use as MVP, add push later

### 2. Pure Push Notifications
- **Pros**: Real-time, efficient
- **Cons**: Complex setup, single point of failure
- **Decision**: Add in Phase 2

### 3. IMAP Idle
- **Pros**: Real-time, standard protocol
- **Cons**: Requires long-running connections
- **Decision**: Not suitable for serverless

---

## Recommendations

### Immediate Actions
1. ✅ **Approve design documents**
2. ✅ **Create database migration**
3. ✅ **Implement Phase 1 (Polling)**
4. ⏳ **Test with small user group**
5. ⏳ **Monitor and iterate**

### Future Enhancements
- **Phase 2**: Gmail push notifications
- **Phase 3**: Advanced filter logic (AND/OR combinations)
- **Phase 4**: AI-powered filter suggestions
- **Phase 5**: Multi-account support

---

## Questions for Review

1. **Scope**: Is polling-based auto-sync sufficient for MVP?
2. **Timing**: Should we implement Phase 2 immediately or wait?
3. **Limits**: Should we limit the number of filters per user?
4. **Default**: Should auto-sync be opt-in or opt-out?
5. **Interval**: What is the acceptable sync interval (5, 15, 30 minutes)?

---

## Conclusion

The proposed Gmail auto-sync module is a **well-scoped, incremental enhancement** that:
- ✅ Builds on existing infrastructure
- ✅ Follows modular design principles
- ✅ Minimizes risk with phased approach
- ✅ Provides immediate value to users
- ✅ Allows for future enhancements

**Recommendation**: Proceed with Phase 1 implementation.

---

## Related Documents

- [Design Document](./GMAIL_AUTO_SYNC_DESIGN.md) - Detailed technical design
- [Implementation Plan](./GMAIL_AUTO_SYNC_IMPLEMENTATION_PLAN.md) - Step-by-step implementation guide
- [Existing Email Fetch Documentation](./EMAILS_FETCH_ROUTE_DOCUMENTATION.md) - Current email sync logic

---

## Contact

For questions or clarifications, please contact the development team.

