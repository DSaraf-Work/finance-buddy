# Security Architecture

This document describes the defense-in-depth security model used in Finance Buddy.

## Overview

Finance Buddy implements a **multi-layered security approach** combining:
1. **Authentication** - JWT-based user verification
2. **Authorization** - Explicit application-level access control
3. **RLS (Row Level Security)** - Database-level protection

## Security Layers

### Layer 1: Authentication (withAuth Middleware)

All protected API routes use the `withAuth()` middleware which:
- Validates the JWT token from cookies
- Extracts and verifies the user identity
- Rejects requests without valid authentication
- Provides the authenticated user object to the route handler

```typescript
export default withAuth(async (req, res, user) => {
  // user is guaranteed to be authenticated
  // user.id contains the verified user ID
});
```

### Layer 2: Authorization (Application Code)

Every database query explicitly filters by `user_id`:

```typescript
const { data } = await supabaseAdmin
  .from('fb_gmail_connections')
  .select('*')
  .eq('user_id', user.id); // Explicit authorization check
```

**Why we use `supabaseAdmin` (service role):**
- **Performance**: Bypasses RLS overhead
- **Reliability**: No cookie/session issues
- **Clarity**: Authorization logic is explicit and visible
- **Control**: Full control over access patterns

### Layer 3: RLS (Defense-in-Depth)

Database RLS policies provide an additional security layer:

```sql
-- Example RLS policy
CREATE POLICY "own connections" ON fb_gmail_connections
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

**RLS protects against:**
- Accidental use of anon key instead of service role
- SQL injection attacks
- Developer errors in authorization logic
- Direct database access

## Current RLS Policies

### fb_gmail_connections
- **Policy**: `own connections`
- **Operations**: ALL (SELECT, INSERT, UPDATE, DELETE)
- **Rule**: `user_id = auth.uid()`

### fb_emails
- **Policy**: `own emails`
- **Operations**: ALL
- **Rule**: `user_id = auth.uid()`

### fb_extracted_transactions
- **Policy**: `own txns`
- **Operations**: ALL
- **Rule**: `user_id = auth.uid()`

### fb_rejected_emails
- **Policy**: Multiple policies for each operation
- **Operations**: SELECT, INSERT, UPDATE, DELETE
- **Rule**: `user_id = auth.uid()`

## Why This Approach?

### Service Role + Explicit Authorization

**Advantages:**
1. ✅ **Performance** - No RLS evaluation overhead
2. ✅ **Reliability** - No cookie/JWT propagation issues
3. ✅ **Clarity** - Authorization logic is explicit in code
4. ✅ **Flexibility** - Easy to implement complex authorization rules
5. ✅ **Debugging** - Easier to trace and debug access issues

**Security:**
- Authentication via `withAuth()` ensures only authenticated users access endpoints
- Explicit `.eq('user_id', user.id)` ensures users only see their own data
- RLS policies provide defense-in-depth protection

### Alternative: Anon Key + RLS

**Disadvantages:**
1. ❌ **Complexity** - Requires proper JWT propagation to database
2. ❌ **Cookie Issues** - SSR cookie handling can be fragile
3. ❌ **Performance** - RLS evaluation on every query
4. ❌ **Debugging** - Harder to debug RLS policy issues
5. ❌ **Limitations** - RLS doesn't support complex authorization logic

## Security Best Practices

### 1. Always Use withAuth()

```typescript
// ✅ GOOD
export default withAuth(async (req, res, user) => {
  // Protected route
});

// ❌ BAD
export default async function handler(req, res) {
  // Unprotected route
}
```

### 2. Always Filter by user_id

```typescript
// ✅ GOOD
const { data } = await supabaseAdmin
  .from('table')
  .select('*')
  .eq('user_id', user.id);

// ❌ BAD
const { data } = await supabaseAdmin
  .from('table')
  .select('*');
```

### 3. Never Trust Client Input

```typescript
// ✅ GOOD
const userId = user.id; // From authenticated session

// ❌ BAD
const userId = req.body.user_id; // From client
```

### 4. Validate All Inputs

```typescript
// ✅ GOOD
const page = Math.max(1, parseInt(req.query.page as string) || 1);

// ❌ BAD
const page = req.query.page;
```

## Testing RLS Policies

To verify RLS policies are working:

```sql
-- Test as authenticated user (should work)
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "user-id-here"}';
SELECT * FROM fb_gmail_connections;

-- Test as anon (should fail)
SET LOCAL role TO anon;
SELECT * FROM fb_gmail_connections;
```

## Audit and Monitoring

### What to Monitor

1. **Failed Authentication Attempts**
   - Log all 401 responses
   - Alert on unusual patterns

2. **Authorization Failures**
   - Log when queries return 0 results unexpectedly
   - Monitor for attempts to access other users' data

3. **RLS Policy Violations**
   - Monitor database logs for RLS denials
   - Alert on any RLS policy violations

### Logging Best Practices

```typescript
// Log security-relevant events
console.error('[Security] Unauthorized access attempt:', {
  userId: user.id,
  requestedResource: resourceId,
  timestamp: new Date().toISOString()
});
```

## Future Enhancements

### Potential Improvements

1. **Rate Limiting** - Prevent abuse
2. **IP Whitelisting** - Restrict access by IP
3. **Audit Logging** - Track all data access
4. **Encryption at Rest** - Encrypt sensitive fields
5. **Data Masking** - Mask sensitive data in logs

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Security Best Practices](https://nextjs.org/docs/authentication)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

