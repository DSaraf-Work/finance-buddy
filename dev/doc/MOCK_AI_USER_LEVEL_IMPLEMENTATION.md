# Mock AI User-Level Implementation

## Overview

Mock AI preference is now stored at the **user level** in Supabase `auth.users.raw_user_meta_data`, making it persistent across sessions and specific to each user.

---

## Architecture

### Storage Location

**Database**: Supabase Auth
**Table**: `auth.users`
**Column**: `raw_user_meta_data` (JSONB)
**Key**: `mock_ai_enabled` (boolean)
**Default**: `false` (Real AI)

### Why `raw_user_meta_data`?

- ✅ Built-in Supabase Auth column (no migration needed)
- ✅ Automatically synced with user sessions
- ✅ Accessible via Supabase Admin API
- ✅ Persists across sessions
- ✅ User-specific (not global)

---

## Implementation Details

### 1. MockAIConfig Class (`src/lib/config/mock-ai-config.ts`)

**Changed from**: Global in-memory state
**Changed to**: User-specific database reads/writes

**Key Methods**:
```typescript
// Check if mock AI is enabled for a user
static async isEnabledForUser(userId: string): Promise<boolean>

// Enable mock AI for a user
static async enableForUser(userId: string): Promise<void>

// Disable mock AI for a user
static async disableForUser(userId: string): Promise<void>

// Toggle mock AI for a user
static async toggleForUser(userId: string): Promise<boolean>

// Get status for a user
static async getStatusForUser(userId: string): Promise<{enabled, source, description}>
```

### 2. API Endpoint (`src/pages/api/admin/mock-ai.ts`)

**Changed**: Now requires authentication via `withAuth` middleware

**GET `/api/admin/mock-ai`**:
- Returns current user's mock AI preference from database
- Response includes `userId` for verification

**POST `/api/admin/mock-ai`**:
- Accepts: `{ action: 'enable' | 'disable' | 'toggle' }`
- Updates user's `raw_user_meta_data.mock_ai_enabled` in database
- Returns updated status

### 3. MockAIContext (`src/contexts/MockAIContext.tsx`)

**Changed from**: localStorage-based state
**Changed to**: Database-backed state

**Behavior**:
- On mount: Fetches user's preference from `/api/admin/mock-ai`
- On toggle: Updates database via POST request
- Optimistic UI updates with rollback on error
- No localStorage usage

### 4. AIManager (`src/lib/ai/manager.ts`)

**Changed**: Now checks user-specific mock AI flag

**Flow**:
```typescript
async generateResponse(request: AIRequest) {
  const userId = request.metadata?.userId;
  
  if (userId) {
    const mockAIEnabled = await MockAIConfig.isEnabledForUser(userId);
    
    if (mockAIEnabled) {
      // Use mock AI (pattern-based extraction)
      return await MockAIResponses.generateMockResponse(...);
    }
  }
  
  // Use real AI (OpenAI/Anthropic/Google)
  // ... existing logic
}
```

---

## Data Flow

### Toggle Mock AI

```
User clicks toggle in /admin page
  ↓
MockAIContext.toggleMockAI()
  ↓
POST /api/admin/mock-ai { action: 'toggle' }
  ↓
MockAIConfig.toggleForUser(userId)
  ↓
Supabase Admin API: updateUserById()
  ↓
Updates auth.users.raw_user_meta_data.mock_ai_enabled
  ↓
Returns new status to client
  ↓
UI updates with new state
```

### AI Extraction Request

```
User triggers transaction extraction
  ↓
API endpoint (e.g., /api/emails/process)
  ↓
SchemaAwareTransactionExtractor.extractTransaction(content, { userId, ... })
  ↓
AIManager.generateResponse({ metadata: { userId, ... } })
  ↓
MockAIConfig.isEnabledForUser(userId)
  ↓
Supabase Admin API: getUserById()
  ↓
Reads auth.users.raw_user_meta_data.mock_ai_enabled
  ↓
If true: Use MockAIResponses (pattern-based)
If false: Use real AI providers (OpenAI/Anthropic/Google)
```

---

## Migration Notes

### No Database Migration Required

Since we're using `auth.users.raw_user_meta_data`, no schema changes are needed.

### Existing Users

All existing users will default to `mock_ai_enabled: false` (Real AI) until they explicitly enable it.

---

## Testing

### Manual Testing

1. **Login** as test user: `dheerajsaraf1996@gmail.com` / `Abcd1234`
2. **Navigate** to `/admin` page
3. **Toggle** Mock AI switch
4. **Verify** state persists across page reloads
5. **Process** an email and verify correct AI is used
6. **Check** logs for confirmation messages

### Expected Log Messages

**Mock AI Enabled**:
```
🎭 Mock AI enabled for user <userId> - using pattern-based extraction
```

**Mock AI Disabled**:
```
🧠 Mock AI disabled for user <userId> - using real AI extraction
```

---

## Benefits

✅ **User-Specific**: Each user can choose their own preference
✅ **Persistent**: Survives server restarts and deployments
✅ **Serverless-Safe**: Works in Vercel/serverless environments
✅ **No Migration**: Uses existing Supabase Auth infrastructure
✅ **Secure**: Requires authentication to change
✅ **Auditable**: Changes tracked in Supabase Auth logs

---

## Future Enhancements

- [ ] Add admin UI to view/manage all users' mock AI preferences
- [ ] Add analytics to track mock AI usage
- [ ] Add per-request override (e.g., force real AI for specific emails)
- [ ] Add A/B testing support (random assignment)

