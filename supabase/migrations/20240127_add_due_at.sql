-- Add due_at (timestamptz) column to tasks table
-- This migration is safe to run multiple times (idempotent)
-- Run this in Supabase SQL Editor

-- 1. Add due_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tasks' 
    AND column_name = 'due_at'
  ) THEN
    ALTER TABLE public.tasks ADD COLUMN due_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- 2. Backfill existing tasks safely
-- Strategy (per locked design decisions):
--   a) If due_at is null and due_date is not null -> set due_at = due_date at 00:00 (all-day)
--   b) Else if due_at is null -> set due_at = created_at
DO $$
BEGIN
  -- Case a: If due_at is null and due_date is not null -> set due_at = due_date at 00:00 UTC
  UPDATE public.tasks 
  SET due_at = (due_date::text || ' 00:00:00+00')::timestamptz
  WHERE due_at IS NULL AND due_date IS NOT NULL;

  -- Case b: If due_at is still null -> set due_at = created_at
  UPDATE public.tasks 
  SET due_at = created_at
  WHERE due_at IS NULL;
END $$;

-- 3. Compatibility: If due_date is null and due_at is not null -> set due_date = due_at::date
UPDATE public.tasks 
SET due_date = due_at::date
WHERE due_date IS NULL AND due_at IS NOT NULL;

-- 4. Create index for efficient date+time queries
CREATE INDEX IF NOT EXISTS idx_tasks_due_at 
ON public.tasks(user_id, due_at);

-- 5. Create index for date-only queries (for calendar grouping)
CREATE INDEX IF NOT EXISTS idx_tasks_due_at_date 
ON public.tasks(user_id, DATE(due_at));

-- 6. Add comment for documentation
COMMENT ON COLUMN public.tasks.due_at IS 
'Timestamp when task is due (includes date + time). NULL = no due date. Time = 00:00 indicates all-day task.';

-- Verification query (optional - run to check results)
-- SELECT 
--   id, 
--   title, 
--   due_date, 
--   start_time, 
--   due_at,
--   CASE 
--     WHEN due_at IS NOT NULL AND EXTRACT(HOUR FROM due_at) = 0 AND EXTRACT(MINUTE FROM due_at) = 0 
--     THEN 'All-day' 
--     ELSE 'Timed' 
--   END as task_type
-- FROM public.tasks 
-- ORDER BY due_at 
-- LIMIT 10;

