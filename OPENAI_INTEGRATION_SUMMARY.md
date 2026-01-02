# OpenAI Integration for AI Task Commands

## Summary
Successfully integrated OpenAI into the AI command feature with safe fallback to rule-based parser.

## Files Added/Modified

### New Files
1. **`src/lib/ai/openaiTaskParser.ts`**
   - OpenAI parser using official SDK
   - Server-side only (never exposes API key)
   - Strict JSON output with Zod validation
   - Defaults to CREATE for general sentences
   - Handles date/time extraction from natural language

2. **`src/lib/ai/confirmTokenStore.ts`**
   - In-memory token store for confirmation flow
   - Auto-cleanup of expired tokens (5 minutes)
   - One-time use tokens

### Modified Files
1. **`src/app/api/ai/task-command/route.ts`**
   - Uses `OPENAI_API_KEY` environment variable
   - Tries OpenAI first, falls back to rule-based parser
   - Improved confirmation token handling
   - Stores pending actions with tokens

2. **`src/app/api/ai/task-command/confirm/route.ts`**
   - Uses token store to retrieve pending actions
   - Validates user matches token owner
   - One-time token use (deleted after retrieval)

3. **`src/lib/ai-command/executor.ts`**
   - Improved title matching: exact → case-insensitive → contains
   - Better error messages for multiple matches
   - Handles confirmation requirements

4. **`package.json`**
   - Added `openai` dependency

## Environment Variables

Required (for OpenAI):
- `OPENAI_API_KEY` - Your OpenAI API key
- `OPENAI_MODEL` (optional) - Model to use, defaults to `gpt-4o-mini`

If `OPENAI_API_KEY` is not set, the feature automatically falls back to the rule-based parser.

## Security Features

1. **Server-side only**: OpenAI API key never exposed to client
2. **Zod validation**: All OpenAI responses validated before execution
3. **Confirmation required**: Destructive actions (delete, bulk_delete_all) require confirmation
4. **User isolation**: All operations scoped to current user (including anonymous)
5. **Token expiration**: Confirmation tokens expire after 5 minutes
6. **One-time tokens**: Tokens are deleted after use

## How It Works

1. **User enters command** → Frontend sends to `/api/ai/task-command`
2. **API tries OpenAI first** (if `OPENAI_API_KEY` is set):
   - Sends command to OpenAI with strict JSON schema
   - Validates response with Zod
   - Falls back to rule-based parser if OpenAI fails
3. **If confirmation required**:
   - Generate token and store pending actions
   - Return token to client
   - Client shows Confirm/Cancel buttons
4. **On confirmation**:
   - Client sends token to `/api/ai/task-command/confirm`
   - Server retrieves actions from token store
   - Executes actions and returns result

## Example Commands

### Test Cases (from requirements)
- ✅ `"buy milk"` → create task
- ✅ `"ride to toronto on 2nd jan 2026 at 3pm"` → create with dueDate
- ✅ `"mark buy milk complete"` → update status
- ✅ `"rename buy milk to buy almond milk"` → update title
- ✅ `"delete buy milk"` → requiresConfirm then delete
- ✅ `"clear all tasks"` → requiresConfirm then delete all

## Default Behavior

- **General sentences default to CREATE**: If command doesn't explicitly say delete/rename/mark, OpenAI will create a task
- **Date extraction**: Natural language dates are parsed (e.g., "tomorrow", "2nd jan 2026 at 3pm")
- **Ambiguous matches**: Return noop with helpful reason

## Fallback Behavior

If OpenAI:
- Is not configured (`OPENAI_API_KEY` missing)
- Throws an error
- Returns invalid JSON
- Fails Zod validation

Then the system automatically falls back to the rule-based parser (existing behavior).

## Testing Checklist

- [x] OpenAI integration works when key is set
- [x] Fallback parser works when key is missing
- [x] Guest users can use AI commands
- [x] Logged-in users can use AI commands
- [x] Confirmation flow works for destructive actions
- [x] Token expiration works (5 minutes)
- [x] Multiple matches require confirmation
- [x] Date extraction works
- [x] Default CREATE behavior works

## Deployment Notes

1. Set `OPENAI_API_KEY` in Vercel environment variables
2. Optionally set `OPENAI_MODEL` (defaults to `gpt-4o-mini`)
3. Feature works immediately - no code changes needed
4. If OpenAI key is missing, feature still works with rule-based parser

## Future Enhancements

- Use Redis for token store (for multi-instance deployments)
- Add rate limiting for OpenAI calls
- Cache common commands
- Support more AI providers (Anthropic, etc.)


