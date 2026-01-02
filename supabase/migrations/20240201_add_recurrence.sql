-- Add recurrence support to tasks table
-- This migration is safe to run multiple times (idempotent)

-- 1. Add recurrence_rule column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tasks' 
    AND column_name = 'recurrence_rule'
  ) THEN
    ALTER TABLE public.tasks ADD COLUMN recurrence_rule TEXT;
  END IF;
END $$;

-- 2. Add recurrence_timezone column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tasks' 
    AND column_name = 'recurrence_timezone'
  ) THEN
    ALTER TABLE public.tasks ADD COLUMN recurrence_timezone TEXT DEFAULT 'UTC';
  END IF;
END $$;

-- 3. Add comment for documentation
COMMENT ON COLUMN public.tasks.recurrence_rule IS 
'Recurrence rule string (RRULE-like format, e.g., "FREQ=WEEKLY;BYDAY=MO" for weekly on Monday)';

COMMENT ON COLUMN public.tasks.recurrence_timezone IS 
'Timezone for recurrence calculations (default: UTC)';

