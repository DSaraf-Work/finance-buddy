# Agent Rules for Finance Buddy

## Critical Workflow Rules

### 1. Testing Protocol
- **ALWAYS** test changes locally using Playwright MCP before delivering solutions
- Start local dev server and verify functionality end-to-end
- Identify and fix issues using available MCP tools
- Only hand off solution after confirming everything works

### 2. Database Management
- **ALWAYS** use Supabase MCP server for:
  - Configuring RLS policies
  - Updating database settings
  - Running migrations automatically
- Only ask user for manual intervention if MCP doesn't support the operation

### 3. Deployment & Production Testing
- **ALWAYS** use Vercel MCP to deploy changes
- After deployment, use Playwright MCP to test production environment
- Fix any production issues using available MCP tools before marking complete

### 4. Local Development Server Rules
- **ALWAYS** use port 3000 for local development
- If port 3000 is occupied:
  1. Kill the process using port 3000
  2. Restart dev server on port 3000
- **ALWAYS** use this command sequence to start server:
  ```bash
  npm run build && npm run dev
  ```

## Workflow Checklist

For every code change:
- [ ] Make the code changes
- [ ] Build and start local server on port 3000
- [ ] Test with Playwright MCP locally
- [ ] Fix any issues found
- [ ] Configure Supabase (policies/migrations) via MCP
- [ ] Deploy via Vercel MCP
- [ ] Test production with Playwright MCP
- [ ] Fix any production issues
- [ ] Deliver solution to user

## Key Principles
- **Automate first**: Use MCP tools before asking user
- **Test always**: Never skip local or production testing
- **Port 3000 only**: Consistency in local development
- **Build before dev**: Ensure clean builds every time

