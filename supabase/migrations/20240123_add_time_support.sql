-- Add time support to tasks table
-- Safe to run multiple times (idempotent)
-- Run this in Supabase SQL Editor

-- Add start_time column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tasks' 
    AND column_name = 'start_time'
  ) THEN
    ALTER TABLE public.tasks ADD COLUMN start_time TIME;
  END IF;
END $$;

-- Add end_time column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'tasks' 
    AND column_name = 'end_time'
  ) THEN
    ALTER TABLE public.tasks ADD COLUMN end_time TIME;
  END IF;
END $$;

-- Add check constraint: end_time must be >= start_time
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'tasks_time_order_check'
  ) THEN
    ALTER TABLE public.tasks 
    ADD CONSTRAINT tasks_time_order_check 
    CHECK (end_time IS NULL OR start_time IS NULL OR end_time >= start_time);
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN public.tasks.start_time IS 'Time when task starts (HH:MM). Null = all-day task.';
COMMENT ON COLUMN public.tasks.end_time IS 'Time when task ends (HH:MM). Optional.';

-- Verification query (run to check results)
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'tasks' 
  AND column_name IN ('start_time', 'end_time');

-- Check constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'tasks_time_order_check';
