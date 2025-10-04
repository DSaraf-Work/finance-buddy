# Authentication System

This document describes the authentication system used in Finance Buddy, which is built on **Supabase SSR** for seamless integration with Next.js and Vercel.

## Overview

The authentication system provides:

- ✅ **Supabase SSR Integration** - Native cookie handling for Next.js API routes
- ✅ **Row Level Security (RLS)** - Automatic enforcement of data access policies
- ✅ **Clean Middleware Pattern** - Simple `withAuth()` wrapper for protecting routes
- ✅ **Vercel Compatible** - Works seamlessly on Vercel's serverless platform
- ✅ **Type-Safe** - Full TypeScript support with proper types

## Architecture

### Module Structure

```
src/lib/auth/
├── index.ts          # Main exports
├── middleware.ts     # Authentication middleware
└── client.ts         # Client utilities
```

### Key Components

1. **`withAuth()`** - Higher-order function to protect API routes
2. **`requireAuth()`** - Manual authentication check
3. **`getAuthUser()`** - Get authenticated user from request
4. **`createUserClient()`** - Create Supabase client with user session

## Usage

### Protecting API Routes

The simplest way to protect an API route is using the `withAuth()` wrapper:

```typescript
import { withAuth } from '@/lib/auth';

export default withAuth(async (req, res, user) => {
  // user is guaranteed to be authenticated here
  // user.id and user.email are available
  
  res.json({
    message: 'Hello authenticated user!',
    userId: user.id,
    email: user.email
  });
});
```

### Manual Authentication Check

For more control, use `requireAuth()`:

```typescript
import { requireAuth } from '@/lib/auth';

export default async function handler(req, res) {
  const user = await requireAuth(req, res);
  if (!user) {
    // 401 response already sent
    return;
  }
  
  // Continue with authenticated logic
  res.json({ userId: user.id });
}
```

### Using Supabase Client with RLS

To query the database with Row Level Security enforcement:

```typescript
import { withAuth, createUserClient } from '@/lib/auth';

export default withAuth(async (req, res, user) => {
  // Create a Supabase client with the user's session
  const supabase = createUserClient(req, res);
  
  // This query will automatically enforce RLS policies
  const { data, error } = await supabase
    .from('fb_gmail_connections')
    .select('*')
    .eq('user_id', user.id);
  
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  
  res.json({ connections: data });
});
```

### Getting User Access Token

For external API calls (like Gmail API):

```typescript
import { withAuth, getUserAccessToken } from '@/lib/auth';

export default withAuth(async (req, res, user) => {
  const accessToken = await getUserAccessToken(req, res);
  
  if (!accessToken) {
    return res.status(401).json({ error: 'No access token' });
  }
  
  // Use accessToken for external API calls
});
```

## Client-Side Authentication

### AuthContext

The `AuthContext` provides client-side authentication state:

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, loading, error, signIn, signOut } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>Not authenticated</div>;
  
  return (
    <div>
      <p>Welcome, {user.email}!</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Session Synchronization

The client automatically synchronizes sessions with the server:

1. User signs in via Supabase Auth (client-side)
2. `AuthContext` detects the sign-in event
3. Calls `/api/auth/session` with access and refresh tokens
4. Server sets session cookies using Supabase SSR
5. Subsequent API requests include session cookies automatically

## API Endpoints

### POST /api/auth/session

Establishes a server-side session from client-side authentication.

**Request:**
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "v1.MR..."
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

### DELETE /api/auth/session

Clears the server-side session.

**Response:**
```json
{
  "success": true
}
```

### GET /api/auth/session

Checks the current session status.

**Response (authenticated):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

**Response (not authenticated):**
```json
{
  "error": "No session"
}
```

## Security Features

### Row Level Security (RLS)

All database queries use the user's session, automatically enforcing RLS policies:

```sql
-- Example RLS policy
CREATE POLICY "Users can only access their own data"
ON fb_gmail_connections
FOR ALL
USING (auth.uid() = user_id);
```

### HttpOnly Cookies

Session cookies are:
- **HttpOnly** - Not accessible via JavaScript
- **Secure** - Only sent over HTTPS
- **SameSite=Strict** - CSRF protection
- **Max-Age=6 months** - Long-lived sessions

### Token Refresh

Supabase SSR automatically handles token refresh:
- Access tokens expire after 1 hour
- Refresh tokens are used to get new access tokens
- Happens transparently in the background

## Migration from Old System

The old authentication system used manual cookie management with Base64-encoded JWT tokens. This caused issues with special characters in cookies on Vercel.

### What Changed

**Before:**
```typescript
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export default withAuth(async (req, res, user) => {
  const { data } = await supabaseAdmin
    .from('table')
    .select('*');
});
```

**After:**
```typescript
import { withAuth, createUserClient } from '@/lib/auth';

export default withAuth(async (req, res, user) => {
  const supabase = createUserClient(req, res);
  const { data } = await supabase
    .from('table')
    .select('*');
});
```

### Key Differences

1. **No more manual cookie encoding** - Supabase SSR handles it
2. **Use `createUserClient()` instead of `supabaseAdmin`** - For RLS enforcement
3. **Cleaner imports** - Everything from `@/lib/auth`
4. **Better error handling** - Automatic 401 responses

## Troubleshooting

### 401 Unauthorized Errors

**Symptom:** API endpoints return 401 even when logged in

**Solutions:**
1. Check that cookies are being set (inspect browser DevTools)
2. Verify session endpoint is working: `POST /api/auth/session`
3. Check that the endpoint uses `withAuth()` or `requireAuth()`
4. Ensure `createUserClient()` is used for database queries

### Session Not Persisting

**Symptom:** User gets logged out on page refresh

**Solutions:**
1. Check that `AuthContext` is calling `/api/auth/session` on sign-in
2. Verify cookies are being set with correct attributes
3. Check browser console for cookie errors
4. Ensure `NEXTAUTH_URL` environment variable is set correctly

### RLS Policy Errors

**Symptom:** Database queries fail with "permission denied"

**Solutions:**
1. Verify RLS policies are correctly defined in Supabase
2. Ensure `createUserClient()` is used (not `supabaseAdmin`)
3. Check that `user_id` matches `auth.uid()` in policies
4. Test policies in Supabase SQL editor

## Best Practices

1. **Always use `withAuth()`** for protected routes
2. **Use `createUserClient()`** for database queries (RLS enforcement)
3. **Use `supabaseAdmin`** only for admin operations (bypasses RLS)
4. **Never expose service role key** to the client
5. **Log authentication events** for debugging
6. **Handle errors gracefully** with proper status codes

## Environment Variables

Required environment variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Next.js
NEXTAUTH_URL=http://localhost:3000  # or your production URL
```

## References

- [Supabase SSR Documentation](https://supabase.com/docs/guides/auth/server-side-rendering)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

