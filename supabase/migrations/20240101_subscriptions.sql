-- Create subscriptions table
create table subscriptions (
  id text primary key, -- Stripe Subscription ID
  user_id uuid references auth.users not null,
  stripe_customer_id text not null,
  stripe_subscription_id text not null, -- Redundant but explicit
  status text not null, -- active, trialing, past_due, canceled, etc.
  current_period_end timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table subscriptions enable row level security;

create policy "Users can view their own subscription" on subscriptions
  for select using (auth.uid() = user_id);

-- No insert/update/delete policies for authenticated users.
-- Updates will happen via Service Role (Webhook) only.
