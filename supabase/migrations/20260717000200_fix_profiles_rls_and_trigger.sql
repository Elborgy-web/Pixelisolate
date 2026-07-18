CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, credits, is_pro)
  VALUES (
    NEW.id, 
    NEW.email, 
    CASE WHEN NEW.email IN ('muhammad.elborgy@gmail.com', 'mohamedkamel93930@gmail.com') THEN 100 ELSE 10 END, 
    NEW.email IN ('muhammad.elborgy@gmail.com', 'mohamedkamel93930@gmail.com')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 2. Drop the old profile trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;

-- 3. Create trigger on auth.users
CREATE TRIGGER on_auth_user_created_profile
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_profile();
