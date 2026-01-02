# Confirmation Logic Bugfix

## Problem
AI command feature was incorrectly requiring confirmation for safe actions like CREATE, causing "Confirmation token is required" errors.

## Root Cause
- `requiresConfirm` flag was being accepted from OpenAI/parser output
- No server-side validation of confirmation requirements
- Frontend tried to call confirm endpoint for all actions

## Solution
Implemented single source of truth for confirmation logic with server-side computation.

## Files Modified

### New Files
1. **`src/lib/ai/confirm.ts`**
   - `computeRequiresConfirm()` - Single source of truth
   - `checkAmbiguousDeletes()` - Detects multiple matches for delete actions
   - Only `delete` and `bulk_delete_all` require confirmation

### Modified Files
1. **`src/app/api/ai/task-command/route.ts`**
   - Ignores `requiresConfirm` from OpenAI/parser
   - Computes `requiresConfirm` server-side using `computeRequiresConfirm()`
   - Executes safe actions immediately (create, update, rename, mark)
   - Only returns `confirmToken` for destructive actions
   - Checks for ambiguous deletes before requiring confirmation

2. **`src/app/api/ai/task-command/confirm/route.ts`**
   - Updated to use token store properly
   - Returns consistent response format
   - Handles expired tokens gracefully

3. **`src/lib/ai/confirmTokenStore.ts`**
   - Stores preview with pending actions
   - Token expiration: 10 minutes
   - Returns both actions and preview

4. **`src/components/AICommandBar.tsx`**
   - Handles immediate execution (no confirmation)
   - Shows result message immediately for safe actions
   - Only shows Confirm/Cancel for destructive actions
   - Better error handling for expired tokens

5. **`src/lib/ai-command/schema.ts`**
   - Added `resultMessage` and `actionsExecutedCount` to response schema
   - Actions array always present (may be empty for immediate execution)

## Behavior Changes

### Before
- All actions could require confirmation
- CREATE actions showed "Confirmation token is required" error
- Frontend always tried to call confirm endpoint

### After
- **Safe actions execute immediately:**
  - `create` → Executes immediately, shows result
  - `update` → Executes immediately, shows result
  - `rename` → Executes immediately, shows result
  - `mark complete/pending` → Executes immediately, shows result
  - `set due date` → Executes immediately, shows result

- **Destructive actions require confirmation:**
  - `delete` → Shows Confirm/Cancel buttons
  - `bulk_delete_all` → Shows Confirm/Cancel buttons
  - Ambiguous deletes → Returns noop with helpful message

## Test Cases (All Pass)

1. ✅ `"buy milk"` → Creates immediately, no confirm
2. ✅ `"ride to toronto on 3rd jan 2026"` → Creates immediately, no confirm
3. ✅ `"mark buy milk complete"` → Updates immediately, no confirm
4. ✅ `"rename buy milk to buy almond milk"` → Updates immediately, no confirm
5. ✅ `"delete buy milk"` → Requires confirmation, then deletes
6. ✅ `"clear all tasks"` → Requires confirmation, then deletes all
7. ✅ Delete with multiple matches → Returns noop with helpful message

## Security

- Confirmation tokens expire after 10 minutes
- Tokens are one-time use (deleted after retrieval)
- User verification on token retrieval
- Server-side computation prevents client manipulation

## Guest User Support

- Works for anonymous users (via `signInAnonymously()`)
- Token store includes userId for verification
- All operations scoped to current user


