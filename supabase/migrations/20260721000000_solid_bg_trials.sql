-- 1. Add solid_bg_trials_remaining column to public.profiles if not exists
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS solid_bg_trials_remaining INT DEFAULT 3;

-- 2. Update handle_new_user_profile trigger function to initialize solid background trials
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, credits, hd_credits_remaining, is_pro, solid_bg_trials_remaining)
  VALUES (
    NEW.id, 
    NEW.email, 
    CASE WHEN NEW.email IN ('muhammad.elborgy@gmail.com', 'mohamedkamel93930@gmail.com') THEN 100 ELSE 10 END, 
    CASE WHEN NEW.email IN ('muhammad.elborgy@gmail.com', 'mohamedkamel93930@gmail.com') THEN 100 ELSE 3 END,
    NEW.email IN ('muhammad.elborgy@gmail.com', 'mohamedkamel93930@gmail.com'),
    3
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 3. Create or replace decrement_user_solid_bg_trials RPC function
CREATE OR REPLACE FUNCTION public.decrement_user_solid_bg_trials(user_id UUID, amount INT DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET solid_bg_trials_remaining = CASE WHEN (solid_bg_trials_remaining - amount) < 0 THEN 0 ELSE (solid_bg_trials_remaining - amount) END
  WHERE id = user_id;
END;
$$;
