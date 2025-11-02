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

## README Version Control Protocol

### Overview

The Finance Buddy project maintains **version-controlled documentation** in `README.md` with metadata tracked in `README-version.md`. This ensures documentation stays synchronized with codebase changes while preventing unnecessary updates.

### Critical Rules

**⚠️ NEVER auto-update README.md during regular development**

README.md should **ONLY** be updated when the user **explicitly requests**:
- "update README"
- "refresh README documentation"
- "sync README with latest changes"
- "update README version"
- "regenerate README"

**DO NOT update README.md when**:
- Implementing new features
- Fixing bugs
- Updating dependencies
- Changing configuration
- Refactoring code
- Making any code changes

### Version Control Files

1. **README.md**: Main documentation (no version metadata inside)
2. **README-version.md**: Version control metadata and history

### Update Process

When user requests README update, follow this **mandatory** process:

#### Step 1: Retrieve Current Version Info

```bash
# Get current commit SHA from README-version.md
current_sha=$(grep "Commit SHA" README-version.md | head -1 | awk '{print $NF}')

# Get current version
current_version=$(grep "Current Version" README-version.md | head -1 | awk '{print $NF}')

# Get latest commit SHA
latest_sha=$(git rev-parse --short=7 HEAD)
```

#### Step 2: Analyze Codebase Changes

```bash
# Get all changes since last README update
git diff $current_sha $latest_sha --name-status

# Get detailed statistics
git diff $current_sha $latest_sha --stat

# Get commit messages
git log $current_sha..$latest_sha --oneline
```

**Categorize changes**:
- ✨ **New Features**: New files, components, API endpoints, features
- 🗑️ **Removed Features**: Deleted files, deprecated endpoints, removed functionality
- 🔧 **API Changes**: Modified endpoints, new parameters, changed responses
- ⚙️ **Configuration Changes**: New env vars, updated configs, settings
- 📦 **Dependency Updates**: package.json changes, version bumps
- 🗂️ **Structural Changes**: New directories, reorganized files, renamed folders
- 📝 **Documentation**: New docs, updated guides, README changes
- 🐛 **Bug Fixes**: Fixed issues, resolved bugs
- ♻️ **Refactoring**: Code improvements, optimizations

#### Step 3: Show Summary to User

**ALWAYS** confirm with user before updating:

```
📋 README Update Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Current Version: v1.0.0
Current Commit: f38b051
Latest Commit: abc1234

Commits Since Last Update: 15
Files Changed: 23
  - Added: 8 files
  - Modified: 12 files
  - Deleted: 3 files

Detected Changes:
  ✨ New Features: 3
     - Auto-sync system (src/lib/gmail-auto-sync/)
     - Notification system (src/lib/notifications/)
     - Keyword management (src/lib/keywords/)

  🔧 API Changes: 5
     - Added: POST /api/notifications
     - Added: GET /api/keywords
     - Modified: POST /api/transactions/search (added keywords param)
     - Added: POST /api/cron/gmail-auto-sync
     - Added: GET /api/notifications/unread-count

  📦 Dependencies: 2
     - Added: @anthropic-ai/sdk@0.65.0
     - Updated: next@14.0.0 → next@15.0.0

  🗂️ Structure: 1
     - Added: src/lib/notifications/ directory

  📝 Documentation: 4
     - Added: docs/AUTO_SYNC_*.md
     - Updated: docs/Finance-Buddy-PRD-Tech.md

Suggested Version: v1.1.0 (Minor - New features added)

Sections Requiring Updates:
  ✅ Key Features (add 3 new features)
  ✅ API Endpoints (add 5 new endpoints)
  ✅ Tech Stack (update Next.js version)
  ✅ Project Structure (add notifications directory)
  ✅ Features Deep Dive (add auto-sync, notifications, keywords)
  ✅ Dependencies (update versions)
  ✅ Changelog (add v1.1.0 entry)
  ✅ Roadmap (move features from planned to completed)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Proceed with README update? (y/n)
```

#### Step 4: Update README Sections

Based on user confirmation, update relevant sections:

**For New Features**:
1. Add to "Key Features" section
2. Add to "Features Deep Dive" section
3. Update "Roadmap" (move from planned to completed)
4. Add to "Changelog"

**For API Changes**:
1. Update "API Endpoints" section
2. Update request/response examples
3. Add new endpoints with full documentation
4. Add deprecation notices if endpoints removed

**For Configuration Changes**:
1. Update "Configuration" section
2. Update "Environment Variables" table
3. Update "Setup & Installation" if needed

**For Dependency Updates**:
1. Update "Tech Stack" section
2. Update version numbers
3. Update "Setup & Installation" if breaking changes
4. Add migration notes if needed

**For Structural Changes**:
1. Update "Project Structure" section
2. Update file/folder tree
3. Update path references

**For Removed Features**:
1. Remove from all relevant sections
2. Add to "Deprecated Features" section
3. Update "Changelog" with removal notice
4. Add migration guide if breaking change

#### Step 5: Determine Version Increment

**Major Version (X.0.0)** - Breaking Changes:
- API endpoint removals
- Database schema breaking changes
- Major feature overhauls
- Incompatible dependency updates
- Removed core functionality

**Minor Version (1.X.0)** - New Features:
- New API endpoints
- New features added
- New dependencies
- Enhanced functionality
- Non-breaking improvements

**Patch Version (1.0.X)** - Fixes & Docs:
- Documentation improvements
- Bug fixes
- Minor tweaks
- Typo corrections
- Small enhancements

#### Step 6: Update README-version.md

Update version metadata:

```markdown
<!-- README Version Metadata -->
**Current Version**: v1.1.0
**Last Updated**: 2025-11-03T10:00:00Z
**Commit SHA**: abc1234
**Updated By**: AI Agent
<!-- End Version Metadata -->
```

Add version history entry:

```markdown
### v1.1.0 (2025-11-03)
**Commit SHA**: abc1234
**Type**: Minor Release

**Changes**:
- ✨ Added auto-sync feature with 15-minute polling
- ✨ Added notification system with real-time alerts
- ✨ Added keyword management system
- 🔧 Updated transaction search API with keyword filtering
- 📦 Upgraded Next.js from v14 to v15
- 📝 Enhanced auto-sync documentation

**Files Changed**: 23
**Commits**: 15

**Sections Updated**:
- Key Features
- API Endpoints
- Tech Stack
- Project Structure
- Features Deep Dive
- Changelog
- Roadmap
```

#### Step 7: Validation Checklist

Before finalizing, verify:

- [ ] All new features documented in relevant sections
- [ ] All removed features cleaned up from all sections
- [ ] API documentation matches current implementation
- [ ] Configuration section reflects current .env variables
- [ ] Project structure matches actual file system
- [ ] No duplicate information across sections
- [ ] All outdated references removed
- [ ] Version number increment is appropriate
- [ ] Changelog entry added with details
- [ ] README-version.md updated with new metadata
- [ ] User confirmed all changes
- [ ] No information loss from previous version

### Example User Commands

Users should use these commands to trigger README updates:

```bash
# Standard update
"update README"

# Explicit refresh
"refresh README documentation"

# Sync with latest changes
"sync README with latest changes"

# Version-specific update
"update README to version 1.2.0"

# Regenerate from scratch
"regenerate README documentation"
```

### What NOT to Do

❌ **NEVER** update README.md when:
- User asks to "implement feature X"
- User asks to "fix bug Y"
- User asks to "add API endpoint Z"
- User asks to "update dependencies"
- User asks to "refactor code"
- Making any code changes
- Committing code changes
- Deploying to production

✅ **ONLY** update README.md when:
- User explicitly says "update README"
- User explicitly says "refresh README"
- User explicitly says "sync README"

### Version Control Best Practices

1. **Always analyze git diff** before updating
2. **Always confirm with user** before making changes
3. **Always update README-version.md** with new metadata
4. **Always add changelog entry** for new version
5. **Always validate** all sections are consistent
6. **Never skip** the confirmation step
7. **Never auto-update** without explicit request
8. **Never lose information** from previous version

### Troubleshooting

**If user asks "why isn't README updated?"**
- Explain that README only updates on explicit request
- Show them the correct command: "update README"
- Explain the version control system

**If changes seem missing from README**:
- Check README-version.md for last update date
- Run git diff to see what changed since then
- Suggest user run "update README"

**If version number seems wrong**:
- Review the changes with user
- Discuss whether it's major/minor/patch
- Adjust version number accordingly

---

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

