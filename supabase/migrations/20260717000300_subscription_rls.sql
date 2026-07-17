-- Enable Row Level Security
ALTER TABLE public.lemon_squeezy_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop policy if it exists to avoid conflicts
DROP POLICY IF EXISTS select_own_subscriptions ON public.lemon_squeezy_subscriptions;

-- Create policy to allow authenticated users to read their own subscriptions
CREATE POLICY select_own_subscriptions ON public.lemon_squeezy_subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
