-- 1. Add hd_credits_remaining column to public.profiles if not exists
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS hd_credits_remaining INT DEFAULT 3;

-- 2. Update handle_new_user_profile trigger function to initialize HD credits
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, credits, hd_credits_remaining, is_pro)
  VALUES (
    NEW.id, 
    NEW.email, 
    CASE WHEN NEW.email IN ('muhammad.elborgy@gmail.com', 'mohamedkamel93930@gmail.com') THEN 100 ELSE 10 END, 
    CASE WHEN NEW.email IN ('muhammad.elborgy@gmail.com', 'mohamedkamel93930@gmail.com') THEN 100 ELSE 3 END,
    NEW.email IN ('muhammad.elborgy@gmail.com', 'mohamedkamel93930@gmail.com')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 3. Create or replace decrement_user_hd_credits RPC function
CREATE OR REPLACE FUNCTION public.decrement_user_hd_credits(user_id UUID, amount INT DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET hd_credits_remaining = CASE WHEN (hd_credits_remaining - amount) < 0 THEN 0 ELSE (hd_credits_remaining - amount) END,
      credits = CASE WHEN (credits - amount) < 0 THEN 0 ELSE (credits - amount) END
  WHERE id = user_id;
END;
$$;

-- 4. Create or replace decrement_user_credits RPC function
CREATE OR REPLACE FUNCTION public.decrement_user_credits(user_id UUID, amount INT DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET credits = CASE WHEN (credits - amount) < 0 THEN 0 ELSE (credits - amount) END
  WHERE id = user_id;
END;
$$;
