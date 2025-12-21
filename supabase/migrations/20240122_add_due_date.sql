-- Phase 1: Add due_date column to tasks table
-- This migration is safe to run multiple times (idempotent)

-- 1. Add due_date column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'due_date'
  ) THEN
    ALTER TABLE public.tasks ADD COLUMN due_date DATE;
  END IF;
END $$;

-- 2. Backfill existing tasks: use created_at date
UPDATE public.tasks 
SET due_date = created_at::date 
WHERE due_date IS NULL;

-- 3. Create index for efficient date-based queries
CREATE INDEX IF NOT EXISTS idx_tasks_due_date 
ON public.tasks(user_id, due_date);

-- 4. Add comment for documentation
COMMENT ON COLUMN public.tasks.due_date IS 
'Date when task is due. Defaults to created_at date for existing tasks.';

-- Verification query (optional - run to check results)
-- SELECT id, title, created_at, due_date FROM public.tasks LIMIT 10;
