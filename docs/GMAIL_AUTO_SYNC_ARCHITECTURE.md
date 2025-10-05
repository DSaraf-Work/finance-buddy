# Gmail Auto-Sync Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Finance Buddy Application                      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐          ┌───────────────┐          ┌───────────────┐
│  User Actions │          │  Cron Jobs    │          │  Webhooks     │
│               │          │  (Scheduled)  │          │  (Push)       │
│ - Create      │          │               │          │               │
│   Filters     │          │ Every 5-15    │          │ Gmail Pub/Sub │
│ - Enable      │          │ minutes       │          │ Notifications │
│   Auto-Sync   │          │               │          │ (Phase 2)     │
└───────┬───────┘          └───────┬───────┘          └───────┬───────┘
        │                          │                          │
        │                          │                          │
        └──────────────────────────┼──────────────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │   Auto-Sync Orchestrator │
                    │                          │
                    │ - Filter Manager         │
                    │ - Sync Scheduler         │
                    │ - Sync Executor          │
                    └──────────┬───────────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ▼              ▼              ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │ Database │   │ Gmail API│   │ Job Queue│
        │          │   │          │   │          │
        │ Filters  │   │ List     │   │ fb_jobs  │
        │ Configs  │   │ Fetch    │   │          │
        │ Emails   │   │ Watch    │   │ Retry    │
        └──────────┘   └──────────┘   └──────────┘
```

---

## Data Flow Diagrams

### Phase 1: Polling-Based Auto-Sync

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User Creates Filter                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ POST /api/gmail/│
                    │ sync-filters    │
                    └────────┬────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │ Filter Manager       │
                  │ - Validate input     │
                  │ - Build Gmail query  │
                  │ - Store in DB        │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │ fb_sync_filters      │
                  │ - filter_name        │
                  │ - filter_type        │
                  │ - gmail_query        │
                  └──────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 2. Scheduled Sync Execution                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Vercel Cron     │
                    │ Every 15 min    │
                    └────────┬────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │ GET /api/cron/       │
                  │ gmail-auto-sync      │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │ Sync Scheduler       │
                  │ - Find eligible      │
                  │   connections        │
                  │ - Check last sync    │
                  │ - Create sync jobs   │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │ For each connection: │
                  │                      │
                  │ 1. Get filters       │
                  │ 2. Build queries     │
                  │ 3. Execute sync      │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │ Sync Executor        │
                  │ - Refresh token      │
                  │ - Call Gmail API     │
                  │ - Fetch messages     │
                  │ - Check duplicates   │
                  │ - Store new emails   │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │ fb_emails            │
                  │ - message_id         │
                  │ - from_address       │
                  │ - subject            │
                  │ - plain_body         │
                  └──────────────────────┘
```

### Phase 2: Push Notification Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Setup Gmail Watch                                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ POST /api/gmail/│
                    │ auto-sync/enable│
                    └────────┬────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │ Gmail API            │
                  │ users.watch()        │
                  │ - topic: gmail-notif │
                  │ - expiration: 7 days │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │ fb_gmail_watch_      │
                  │ subscriptions        │
                  │ - history_id         │
                  │ - expiration         │
                  └──────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 2. Receive Push Notification                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Gmail receives  │
                    │ new email       │
                    └────────┬────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │ Google Cloud Pub/Sub │
                  │ Publishes message    │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │ POST /api/gmail/     │
                  │ webhook              │
                  │ - Verify JWT         │
                  │ - Parse payload      │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │ Sync Executor        │
                  │ - Get history        │
                  │ - Apply filters      │
                  │ - Fetch matching     │
                  │ - Store emails       │
                  └──────────────────────┘
```

---

## Module Structure

```
src/lib/gmail-auto-sync/
│
├── index.ts                    # Public API exports
│   └── Exports: FilterManager, SyncExecutor, SyncScheduler
│
├── types.ts                    # TypeScript type definitions
│   ├── SyncFilter
│   ├── AutoSyncConfig
│   ├── SyncJob
│   └── SyncResult
│
├── filter-manager.ts           # Filter CRUD operations
│   ├── createFilter()
│   ├── getFilters()
│   ├── updateFilter()
│   └── deleteFilter()
│
├── query-builder.ts            # Gmail query construction
│   ├── buildQuery()
│   ├── validateQuery()
│   └── combineQueries()
│
├── sync-scheduler.ts           # Scheduling logic
│   ├── findEligibleConnections()
│   ├── shouldSync()
│   └── createSyncJobs()
│
├── sync-executor.ts            # Email fetching and storage
│   ├── executeSyncForFilter()
│   ├── fetchAndStoreMessage()
│   └── buildTimeQuery()
│
└── __tests__/                  # Unit tests
    ├── filter-manager.test.ts
    ├── query-builder.test.ts
    ├── sync-scheduler.test.ts
    └── sync-executor.test.ts
```

---

## Database Schema Relationships

```
┌─────────────────────────┐
│ auth.users              │
│ - id (PK)               │
│ - email                 │
└───────┬─────────────────┘
        │
        │ 1:N
        │
        ▼
┌─────────────────────────┐
│ fb_gmail_connections    │
│ - id (PK)               │
│ - user_id (FK)          │
│ - access_token          │
│ - refresh_token         │
│ - auto_sync_enabled     │◄─────┐
│ - auto_sync_interval    │      │
│ - last_auto_sync_at     │      │
└───────┬─────────────────┘      │
        │                        │
        │ 1:N                    │
        │                        │
        ▼                        │
┌─────────────────────────┐      │
│ fb_sync_filters         │      │
│ - id (PK)               │      │
│ - user_id (FK)          │      │
│ - connection_id (FK) ───┘      │
│ - filter_name           │      │
│ - filter_type           │      │
│ - filter_value          │      │
│ - gmail_query           │      │
│ - enabled               │      │
│ - last_sync_at          │      │
└─────────────────────────┘      │
                                 │
┌─────────────────────────┐      │
│ fb_gmail_watch_         │      │
│ subscriptions           │      │
│ - id (PK)               │      │
│ - user_id (FK)          │      │
│ - connection_id (FK) ───┘
│ - history_id            │
│ - expiration            │
│ - status                │
└─────────────────────────┘

┌─────────────────────────┐
│ fb_emails               │
│ - id (PK)               │
│ - user_id (FK)          │
│ - connection_id (FK)    │
│ - message_id            │
│ - from_address          │
│ - subject               │
│ - plain_body            │
│ - status                │
└─────────────────────────┘
```

---

## Sequence Diagram: Auto-Sync Execution

```
User          Cron          Scheduler       Executor        Gmail API      Database
 │             │                │               │               │             │
 │             │ (every 15min) │               │               │             │
 │             ├───────────────►│               │               │             │
 │             │                │               │               │             │
 │             │                │ Find eligible │               │             │
 │             │                │ connections   │               │             │
 │             │                ├───────────────┼───────────────┼────────────►│
 │             │                │               │               │             │
 │             │                │◄──────────────┼───────────────┼─────────────┤
 │             │                │ [connections] │               │             │
 │             │                │               │               │             │
 │             │                │ For each connection:          │             │
 │             │                │               │               │             │
 │             │                │ Get filters   │               │             │
 │             │                ├───────────────┼───────────────┼────────────►│
 │             │                │◄──────────────┼───────────────┼─────────────┤
 │             │                │ [filters]     │               │             │
 │             │                │               │               │             │
 │             │                │ Execute sync  │               │             │
 │             │                ├──────────────►│               │             │
 │             │                │               │               │             │
 │             │                │               │ Refresh token │             │
 │             │                │               ├──────────────►│             │
 │             │                │               │◄──────────────┤             │
 │             │                │               │               │             │
 │             │                │               │ List messages │             │
 │             │                │               ├──────────────►│             │
 │             │                │               │◄──────────────┤             │
 │             │                │               │ [message_ids] │             │
 │             │                │               │               │             │
 │             │                │               │ Check existing│             │
 │             │                │               ├───────────────┼────────────►│
 │             │                │               │◄──────────────┼─────────────┤
 │             │                │               │               │             │
 │             │                │               │ Fetch new     │             │
 │             │                │               ├──────────────►│             │
 │             │                │               │◄──────────────┤             │
 │             │                │               │               │             │
 │             │                │               │ Store emails  │             │
 │             │                │               ├───────────────┼────────────►│
 │             │                │               │               │             │
 │             │                │               │ Update filter │             │
 │             │                │               ├───────────────┼────────────►│
 │             │                │               │               │             │
 │             │                │◄──────────────┤               │             │
 │             │                │ [sync_result] │               │             │
 │             │◄───────────────┤               │               │             │
 │             │ [200 OK]       │               │               │             │
```

---

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ Sync Execution                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Try: Execute    │
                    │ Sync            │
                    └────────┬────────┘
                             │
                ┌────────────┼────────────┐
                │            │            │
                ▼            ▼            ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ Success  │  │ Transient│  │ Permanent│
        │          │  │ Error    │  │ Error    │
        └────┬─────┘  └────┬─────┘  └────┬─────┘
             │             │             │
             │             │             │
             ▼             ▼             ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ Update   │  │ Retry    │  │ Mark     │
        │ last_sync│  │ with     │  │ filter   │
        │ _at      │  │ backoff  │  │ as error │
        └──────────┘  └──────────┘  └──────────┘
                             │
                             │
                    ┌────────┴────────┐
                    │ Max retries     │
                    │ reached?        │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                    ▼                 ▼
              ┌──────────┐      ┌──────────┐
              │ Yes:     │      │ No:      │
              │ Disable  │      │ Schedule │
              │ filter   │      │ retry    │
              └──────────┘      └──────────┘
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ Security Layers                                                 │
└─────────────────────────────────────────────────────────────────┘

1. Authentication
   ├── User authentication (existing)
   ├── OAuth 2.0 for Gmail
   └── Service account for Pub/Sub (Phase 2)

2. Authorization
   ├── Row-Level Security (RLS) on all tables
   ├── User can only access their own filters
   └── Connection ownership validation

3. Input Validation
   ├── Filter type validation
   ├── Gmail query sanitization
   └── Rate limiting on API endpoints

4. Token Management
   ├── Encrypted storage of access tokens
   ├── Automatic token refresh
   └── Secure token rotation

5. Webhook Security (Phase 2)
   ├── JWT verification for Pub/Sub messages
   ├── HTTPS only
   └── Request signature validation
```

---

## Scalability Considerations

```
┌─────────────────────────────────────────────────────────────────┐
│ Scalability Strategy                                            │
└─────────────────────────────────────────────────────────────────┘

Current Scale: ~10-100 users
Target Scale: ~1,000 users

1. Database
   ├── Indexes on frequently queried columns
   ├── Partitioning by user_id (future)
   └── Connection pooling

2. API Rate Limiting
   ├── Per-user quotas
   ├── Exponential backoff
   └── Queue-based processing

3. Cron Jobs
   ├── Batch processing (50 connections/run)
   ├── Parallel execution (where safe)
   └── Distributed cron (future)

4. Caching
   ├── Cache filter queries
   ├── Cache connection tokens
   └── Redis for distributed cache (future)
```

---

## Monitoring Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│ Monitoring Metrics                                              │
└─────────────────────────────────────────────────────────────────┘

1. Sync Health
   ├── Success rate (target: >95%)
   ├── Average sync latency
   ├── Failed sync count
   └── Retry count

2. API Usage
   ├── Gmail API quota usage
   ├── Requests per minute
   ├── Error rate
   └── Response time

3. User Metrics
   ├── Active auto-sync connections
   ├── Total filters created
   ├── Emails synced per day
   └── User engagement

4. System Health
   ├── Cron job execution time
   ├── Database query performance
   ├── Memory usage
   └── Error logs
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ Production Environment                                          │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│ Vercel       │
│ - Next.js    │
│ - API Routes │
│ - Cron Jobs  │
└──────┬───────┘
       │
       ├─────────────┐
       │             │
       ▼             ▼
┌──────────┐   ┌──────────┐
│ Supabase │   │ Gmail API│
│ - Postgres│   │          │
│ - RLS     │   │          │
└──────────┘   └──────────┘
       │
       │ (Phase 2)
       ▼
┌──────────────┐
│ Google Cloud │
│ - Pub/Sub    │
│ - IAM        │
└──────────────┘
```

This architecture provides a clear, scalable foundation for the Gmail auto-sync feature!

