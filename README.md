# Finance Buddy

Finance Buddy is a Gmail financial email automation system that connects multiple Gmail accounts via OAuth, enables manual syncs over date ranges, and stores emails with strict idempotency. Built with Next.js, Supabase, and TypeScript.

## Architecture

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes (Node.js/TypeScript)
- **Auth**: Supabase Auth with secure cookies (6-month sliding refresh)
- **Database**: PostgreSQL (Supabase) with Row Level Security (RLS)
- **Gmail Integration**: OAuth-only access using `messages.list` + `messages.get`

## Features (L1 Implementation)

### ✅ Completed Features

1. **Gmail OAuth Integration**
   - PKCE-based OAuth flow
   - Token storage with automatic refresh
   - Scope management and user info extraction

2. **Manual Sync API**
   - Date range filtering with optional sender filters
   - Pagination support (oldest→newest ordering)
   - Idempotency via database probing
   - Gmail API integration with rate limiting

3. **Backfill Orchestration**
   - Resumable job management
   - Chunked processing for large date ranges
   - Job status tracking and error handling

4. **Connection Management**
   - List Gmail connections
   - Hard delete connections (per ADR-06)
   - Token revocation with Google

5. **Read APIs**
   - Email search with filtering and pagination
   - Transaction search (placeholder for L2+)
   - RLS enforcement for data isolation

6. **Database Schema**
   - Complete PostgreSQL schema with RLS policies
   - Proper indexing for performance
   - Foreign key relationships with cascading

## Project Structure

```
finance-buddy/
├── apps/web/                 # Next.js web application
│   ├── src/
│   │   ├── lib/             # Shared utilities
│   │   │   ├── auth.ts      # Authentication helpers
│   │   │   ├── gmail.ts     # Gmail API integration
│   │   │   └── supabase.ts  # Supabase client
│   │   └── pages/api/       # API routes
│   │       ├── gmail/       # Gmail OAuth and sync APIs
│   │       ├── emails/      # Email search APIs
│   │       └── transactions/ # Transaction search APIs
├── packages/shared/          # Shared types and DTOs
│   └── src/
│       ├── dto/             # API request/response types
│       └── types/           # Database and external API types
├── infra/migrations/         # Database migrations
├── openapi/                 # OpenAPI specification
├── docs/                    # Architecture documentation
└── scripts/                 # Utility scripts
```

## Setup Instructions

### 1. Environment Configuration

Copy the example environment file and fill in your values:

```bash
cp .env.example .env.local
```

Required environment variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Gmail OAuth Configuration
GMAIL_CLIENT_ID=your_gmail_client_id
GMAIL_CLIENT_SECRET=your_gmail_client_secret

# Application Configuration
NEXTAUTH_URL=http://localhost:3000
COOKIE_NAME=fb_session
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Apply Database Migration

```bash
node scripts/apply-migration.js
```

This will create all necessary tables and RLS policies in your Supabase database.

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### 5. Test API Endpoints

```bash
node scripts/test-apis.js
```

## API Documentation

### Gmail OAuth Flow

1. **Connect**: `GET /api/gmail/connect`
   - Initiates OAuth flow with PKCE
   - Redirects to Google OAuth consent screen

2. **Callback**: `GET /api/gmail/callback`
   - Handles OAuth callback
   - Stores tokens and user info in database

3. **List Connections**: `GET /api/gmail/connections`
   - Returns user's Gmail connections
   - Excludes sensitive token data

4. **Disconnect**: `POST /api/gmail/disconnect`
   - Revokes tokens and hard-deletes connection
   - Preserves historical email data

### Manual Sync

**Endpoint**: `POST /api/gmail/manual-sync`

**Request Body**:
```json
{
  "connection_id": "uuid",
  "date_from": "2024-01-01",
  "date_to": "2024-01-31",
  "senders": ["bank@example.com"],
  "page": 1,
  "pageSize": 50,
  "sort": "asc"
}
```

**Response**:
```json
{
  "items": [...],
  "nextPageToken": "page_2",
  "stats": {
    "probed": 50,
    "fetched": 25,
    "upserts": 25
  }
}
```

### Backfill Orchestration

**Endpoint**: `POST /api/gmail/backfill`

Creates a resumable job that processes large date ranges in chunks.

### Search APIs

- **Email Search**: `POST /api/emails/search`
- **Transaction Search**: `POST /api/transactions/search`

Both support filtering, pagination, and sorting with RLS enforcement.

## Architecture Decisions (ADRs)

1. **ADR-01**: Supabase Auth with secure cookies
2. **ADR-02**: Gmail OAuth-only access
3. **ADR-03**: Manual sync only (no polling/webhooks)
4. **ADR-04**: Idempotency via unique constraints
5. **ADR-05**: Gmail internal_date fidelity
6. **ADR-06**: Hard delete connections on disconnect
7. **ADR-07**: RLS enforcement on all user data

See `docs/Finance-Buddy-ADRs.md` for detailed explanations.

## Security Features

- **Row Level Security (RLS)**: All user data is isolated
- **Secure Cookies**: HttpOnly, Secure, SameSite=Strict
- **Token Management**: Automatic refresh with secure storage
- **CSRF Protection**: State parameter validation in OAuth flow
- **Input Validation**: Comprehensive request validation

## Performance Optimizations

- **Database Indexing**: Optimized for time-based queries
- **Pagination**: Server-side pagination for all list endpoints
- **Idempotency**: Single probe query using `ANY($ids)`
- **Token Refresh**: Automatic token refresh before expiry

## Development

### Building

```bash
npm run build
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## Next Steps (L2+)

- Email content extraction and transaction parsing
- Real-time sync capabilities
- Advanced filtering and categorization
- Dashboard UI implementation
- Webhook support for Gmail push notifications

## Contributing

1. Follow the established architecture patterns
2. Maintain TypeScript strict mode compliance
3. Add tests for new functionality
4. Update documentation for API changes
5. Ensure RLS policies are properly enforced

## License

Private - Finance Buddy Project
