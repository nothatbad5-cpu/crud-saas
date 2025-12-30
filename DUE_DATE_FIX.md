# Due Date Fix - AI Command Feature

## Problem
AI creates tasks but due dates from natural language are not saved.
Example: "ride to toronto on 3rd jan 2026" → task created but dueDate ignored.

## Root Cause
- AI may not always extract dates correctly
- No fallback date extraction from input text
- Date parsing in executor was basic (only handled simple formats)

## Solution
Implemented comprehensive date extraction with chrono-node fallback.

## Files Added/Modified

### New Files
1. **`src/lib/ai/dateExtractor.ts`**
   - Uses chrono-node for robust date parsing
   - Extracts dates from natural language
   - Cleans title by removing date phrases
   - Returns ISO 8601 format for dueDate

### Modified Files
1. **`src/app/api/ai/task-command/route.ts`**
   - Extracts date from input using `extractDueDate()` before parsing
   - Fills in missing dueDate for create actions if AI misses it
   - Added temporary logging for verification

2. **`src/lib/ai/openaiTaskParser.ts`**
   - Enhanced system prompt to emphasize date extraction
   - Added more examples showing date formats
   - Specifies ISO 8601 format requirement

3. **`src/lib/ai-command/executor.ts`**
   - Improved date parsing to handle ISO strings directly
   - Supports both YYYY-MM-DD and ISO 8601 formats
   - Properly converts to due_at (TIMESTAMPTZ) and due_date (DATE)
   - Handles time extraction from ISO strings

4. **`package.json`**
   - Added `chrono-node` dependency

## Database Schema

The tasks table has:
- `due_at` (TIMESTAMPTZ) - Primary field for date+time
- `due_date` (DATE) - Backwards compatibility field

Both fields are saved for compatibility.

## How It Works

1. **Input**: "ride to toronto on 3rd jan 2026"
2. **Date Extraction**: `extractDueDate()` parses with chrono-node
   - Extracts: `{ title: "ride to toronto", dueDateISO: "2026-01-03T00:00:00Z" }`
3. **AI Parsing**: OpenAI parses command (may or may not include dueDate)
4. **Fallback**: If AI action.create has no dueDate, fill from extractedDate
5. **Execution**: Executor converts ISO to due_at and due_date
6. **Storage**: Both fields saved to Supabase
7. **Display**: Calendar uses due_at for grouping and display

## Test Cases

1. ✅ `"ride to toronto on 3rd jan 2026"` 
   - Title: "ride to toronto"
   - due_at: 2026-01-03T00:00:00Z
   - due_date: 2026-01-03

2. ✅ `"ride to toronto on 3rd jan 2026 at 3pm"`
   - Title: "ride to toronto"
   - due_at: 2026-01-03T15:00:00Z
   - due_date: 2026-01-03

3. ✅ `"buy milk"`
   - Title: "buy milk"
   - due_at: null
   - due_date: null

4. ✅ `"set due date for buy milk to tomorrow 7pm"`
   - Updates task with due_at: tomorrow at 19:00 UTC

## Date Formats Supported

- ISO 8601: "2026-01-03T00:00:00Z", "2026-01-02T15:00:00Z"
- YYYY-MM-DD: "2026-01-03"
- Natural language: "3rd jan 2026", "tomorrow", "next friday", "2nd jan 2026 at 3pm"

## Calendar Integration

- Calendar uses `due_at` (preferred) for grouping and display
- Falls back to `due_date` or `created_at` if due_at is null
- Time badges show time from due_at
- Tasks appear on correct day in calendar grid

## Logging

Temporary logging added in `/api/ai/task-command` route:
```javascript
console.log({
  input,
  extractedDate,
  aiActions: actions,
})
```

Remove after verification.

