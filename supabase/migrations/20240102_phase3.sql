-- Create user_settings table
create table user_settings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null unique,
  onboarding_completed boolean default false,
  sample_seeded boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for user_settings
alter table user_settings enable row level security;

create policy "Users can view their own settings" on user_settings
  for select using (auth.uid() = user_id);

create policy "Users can update their own settings" on user_settings
  for update using (auth.uid() = user_id);

create policy "Service role can insert settings" on user_settings
  for insert with check (true);

-- Add is_sample to tasks
alter table tasks add column is_sample boolean default false;
