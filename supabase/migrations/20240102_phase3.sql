-- 1. Ensure tasks table exists (base schema)
create table if not exists public.tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  description text,
  status text check (status in ('pending', 'completed')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Add is_sample column to tasks if missing
do $$
begin
  if not exists (select 1 from INFORMATION_SCHEMA.COLUMNS where table_name = 'tasks' and column_name = 'is_sample') then
    alter table public.tasks add column is_sample boolean default false;
  end if;
end $$;

-- 3. Create user_settings table
create table if not exists public.user_settings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null unique,
  onboarding_completed boolean default false,
  sample_seeded boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Enable RLS
alter table public.tasks enable row level security;
alter table public.user_settings enable row level security;

-- 5. RLS Policies for tasks (Idempotent: drop and recreate)
drop policy if exists "Users can view their own tasks" on public.tasks;
create policy "Users can view their own tasks" on public.tasks 
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own tasks" on public.tasks;
create policy "Users can insert their own tasks" on public.tasks 
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own tasks" on public.tasks;
create policy "Users can update their own tasks" on public.tasks 
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own tasks" on public.tasks;
create policy "Users can delete their own tasks" on public.tasks 
  for delete using (auth.uid() = user_id);

-- 6. RLS Policies for user_settings (Idempotent: drop and recreate)
drop policy if exists "Users can view their own settings" on public.user_settings;
create policy "Users can view their own settings" on public.user_settings
  for select using (auth.uid() = user_id);

drop policy if exists "Users can update their own settings" on public.user_settings;
create policy "Users can update their own settings" on public.user_settings
  for update using (auth.uid() = user_id);

drop policy if exists "Users can insert their own settings" on public.user_settings;
create policy "Users can insert their own settings" on public.user_settings
  for insert with check (auth.uid() = user_id);

