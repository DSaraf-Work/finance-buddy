# Agent Guidelines for Finance Buddy

## Project Overview
**Finance Buddy**: Gmail financial email automation system that connects multiple Gmail accounts via OAuth, enables manual syncs over date ranges, and stores emails with strict idempotency. Automatically extracts transaction data from financial emails using AI.

### Core Features
- **Gmail OAuth Integration**: Connect multiple Gmail accounts securely
- **Manual Sync**: Sync emails over date ranges with optional sender filters and paging
- **Idempotency**: Strict duplicate prevention across disconnect → reconnect flows
- **Transaction Extraction**: AI-powered extraction of transaction data from emails
- **Auto-Sync**: Automated background syncing with configurable schedules
- **RLS Security**: Row Level Security on all database tables
- **Database Workbenches**: Read/search APIs and DB exploration tools
- **User Authentication**: Supabase Auth with secure cookies (6-month sliding refresh)

### Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes (Node.js/TypeScript)
- **Auth**: Supabase Auth with secure cookies
- **Database**: PostgreSQL (Supabase) with Row Level Security (RLS)
- **Gmail Integration**: OAuth-only access using `messages.list` + `messages.get`
- **AI Integration**: OpenAI, Anthropic Claude, Google AI for transaction extraction
- **Deployment**: Vercel (follow Vercel conventions during local dev)

---

## Critical Workflow Rules

### 1. Testing Protocol
- **ALWAYS** test changes locally using Playwright MCP or Chrome MCP before delivering solutions
- Start local dev server on port 3000 and verify functionality end-to-end
- Use reasoned thinking to plan comprehensive testing including all edge cases
- Identify and fix issues using available MCP tools
- Only hand off solution after confirming everything works perfectly
- **Test credentials**: `dheerajsaraf1996@gmail.com` / `Abcd1234`

### 2. Database Management
- **ALWAYS** use Supabase MCP server for:
  - Configuring RLS policies
  - Updating database settings
  - Running migrations automatically
  - Any database schema changes
- Only ask user for manual intervention if MCP doesn't support the operation
- Never manually edit migration files - use Supabase MCP tools

### 3. Deployment & Production Testing
- **ALWAYS** use Vercel MCP to deploy changes
- After deployment, use Playwright MCP or Chrome MCP to test production environment
- Verify all features work in production (OAuth flows, email sync, transaction extraction)
- Fix any production issues using available MCP tools before marking complete
- Never ask user to deploy manually

### 4. Local Development Server Rules
- **ALWAYS** use port 3000 for local development
- If port 3000 is occupied:
  1. Kill the process using port 3000
  2. Restart dev server on port 3000
- **ALWAYS** use this command sequence to start server:
  ```bash
  kill -9 $(lsof -ti:3000) && npm run build && npm run dev
  ```
- Never use alternative ports - consistency is critical

---

## Development Environment

### Local Development Server
- **Port**: ALWAYS use port **3000** for local development
- **Starting the Server**:
  ```bash
  kill -9 $(lsof -ti:3000) && npm run build && npm run dev
  # This ensures clean build and port availability
  ```

### Test Credentials
**CRITICAL**: Always use these credentials for testing authentication flows:
- **Email**: `dheerajsaraf1996@gmail.com`
- **Password**: `Abcd1234`
- **Note**: This user is pre-verified and ready for testing
- **Usage**: Use these credentials in ALL testing scenarios:
  - Playwright/Chrome MCP tests
  - Manual testing
  - Gmail OAuth flows
  - Transaction extraction testing
  - Auto-sync testing
- **Never** create new test users unless explicitly requested by the user

---

## Development Workflow

### Feature Implementation Process
1. **Check for feature documentation**: Look in `dev/wiki/` or `dev/doc/` folders
2. **If no feature file exists**:
   - Review existing PRD/Tech docs in `docs/` folder
   - Create implementation plan if needed
3. **Implement feature** following the plan and existing patterns
4. **Update documentation** with changes
5. **Test thoroughly** using MCP tools before handoff:
   - **Local Testing**: Use Playwright/Chrome MCP with test credentials
   - **Database Changes**: Use Supabase MCP for migrations/policies
   - **Deployment**: Use Vercel MCP to deploy
   - **Production Testing**: Use Playwright/Chrome MCP on production URL
6. **Fix all issues** found during testing before handing off to user

### Workflow Checklist

For every code change, follow this checklist:
- [ ] Make the code changes
- [ ] Build and start local server on port 3000
- [ ] Test with Playwright/Chrome MCP locally
- [ ] Fix any issues found
- [ ] Configure Supabase (policies/migrations) via MCP if needed
- [ ] Deploy via Vercel MCP
- [ ] Test production with Playwright/Chrome MCP
- [ ] Fix any production issues
- [ ] Deliver solution to user

### Documentation Requirements
- **Technical Docs**: Located in `docs/` folder (PRD, ADRs, API specs)
- **Wiki**: Located in `dev/wiki/` for phase-specific documentation
- **Always update** relevant documentation on any feature implementation or code modifications
- **Architecture**: Keep architecture documents current with changes

---

## Code Quality Standards

### Modularity & Separation of Concerns
- ✅ Keep modules and functionalities **separate and independent**
- ✅ Strong, consistent separation of concerns
- ✅ Maximize code reuse, minimize duplication
- ✅ Refactor for extensibility and reusability when needed
- ✅ Follow existing patterns in the codebase (e.g., API routes, lib utilities)

### Backward Compatibility
- ✅ Maintain **complete and exhaustive** backward compatibility
- ✅ Cover **all edge cases** when refactoring
- ✅ Test existing functionality after changes
- ❌ Never break existing functionality
- ❌ Never break existing API contracts

### Code Reuse
- ✅ Reuse existing code wherever possible
- ✅ Refactor duplicated code into shared utilities in `src/lib/`
- ✅ Create abstractions for common patterns
- ✅ Use existing types from `src/types/`

---

## Testing Requirements

### Pre-Handoff Testing (MANDATORY)
- ✅ Use Playwright MCP or Chrome MCP stdio for comprehensive feature testing
- ✅ Test with actual test credentials: `dheerajsaraf1996@gmail.com` / `Abcd1234`
- ✅ Verify **no unexpected bugs** in both local and production environments
- ✅ Ensure **complete feature requirement fulfillment**
- ✅ Test all edge cases and user flows with reasoned thinking:
  - Authentication flows (login, logout, session management)
  - Gmail OAuth flows (connect, disconnect, reconnect)
  - Email sync (manual sync, auto-sync, error handling)
  - Transaction extraction (various email formats, AI processing)
  - Error states and recovery
  - Loading states and user feedback
- ✅ Test production deployment after using Vercel MCP
- ❌ Never hand off untested features
- ❌ Never skip production testing

### MCP Server Usage for Testing
- **Playwright MCP**: Preferred for automated, comprehensive testing
- **Chrome MCP stdio**: Alternative for interactive testing and debugging
- **Test both local (localhost:3000) and production (Vercel URL)**
- **Use reasoned thinking** to identify edge cases before testing

---

## File Organization

```
finance-buddy/
├── src/
│   ├── components/       # React components
│   ├── contexts/         # React contexts (Auth, AI)
│   ├── lib/             # Shared utilities (auth, gmail, supabase)
│   ├── middleware/      # Next.js middleware
│   ├── pages/           # Next.js pages and API routes
│   │   └── api/         # API endpoints
│   ├── styles/          # Global styles
│   └── types/           # TypeScript types and DTOs
├── dev/
│   ├── doc/             # Development documentation
│   └── wiki/            # Phase-specific wiki documentation
├── docs/                # Technical documentation (PRD, ADRs, specs)
├── infra/
│   ├── migrations/      # Database migrations
│   └── supabase/        # Supabase configuration
├── scripts/             # Utility scripts
├── openapi/             # OpenAPI specifications
├── AGENTS.md            # This file
└── README.md            # Project overview
```

---

## Key Principles

1. **MCP-First**: Use MCP servers for all operations (testing, database, deployment)
2. **Automate First**: Use MCP tools before asking user for manual intervention
3. **Test Always**: Never skip local or production testing
4. **Port 3000 Only**: Consistency in local development
5. **Build Before Dev**: Ensure clean builds every time
6. **Modular First**: Independent, loosely-coupled modules
7. **DRY**: Don't Repeat Yourself - reuse aggressively
8. **Document Changes**: Keep documentation current
9. **Test Before Handoff**: No untested features to user
10. **Vercel-Ready**: Follow Vercel conventions from day one
11. **Backward Compatible**: Never break existing functionality
12. **Security First**: Always maintain RLS policies and secure authentication

---

## Gmail Integration Specifics

### OAuth Flow
- OAuth-only access (no API keys or passwords)
- Store tokens with granted scopes
- PKCE flow for security
- HTTPS only
- Handle token refresh automatically

### Email Sync
- Manual sync with date ranges
- Optional sender filters
- Pagination support
- Strict idempotency (no duplicates)
- `internal_date` fidelity from Gmail

### Connection Management
- Hard delete on disconnect (revoke token, delete connection)
- Emails persist after disconnect
- Support multiple Gmail accounts per user

---

## AI Transaction Extraction

### Supported AI Providers
- OpenAI (GPT models)
- Anthropic (Claude models)
- Google AI (Gemini models)

### Extraction Process
- Automatic extraction from financial emails
- Structured transaction data (amount, merchant, category, etc.)
- Confidence scoring
- Version tracking for extraction algorithms
- User notes and AI notes support

---

## Security Requirements

### Row Level Security (RLS)
- All `fb_*` tables enforce `user_id = auth.uid()`
- Test RLS policies after any database changes
- Use Supabase MCP to configure policies

### Authentication
- Supabase Auth with email/password
- Secure cookies (`Secure` + `HttpOnly`)
- 6-month sliding refresh
- Session management

### Data Protection
- No sensitive data in logs
- Encrypted token storage
- Secure API endpoints

---

**Last Updated**: 2025-11-02

