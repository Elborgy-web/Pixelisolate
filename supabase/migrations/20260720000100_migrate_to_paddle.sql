-- Create paddle_subscriptions table
CREATE TABLE IF NOT EXISTS public.paddle_subscriptions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id TEXT,
  status TEXT,
  price_id TEXT,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.paddle_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read their own subscriptions
DROP POLICY IF EXISTS select_own_paddle_subscriptions ON public.paddle_subscriptions;
CREATE POLICY select_own_paddle_subscriptions ON public.paddle_subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
