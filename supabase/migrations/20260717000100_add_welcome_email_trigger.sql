-- 1. Create a trigger helper function
CREATE OR REPLACE FUNCTION public.send_welcome_email_on_signup()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM supabase_functions.http_request(
    'https://nyiwicwbzjkijamqqsl.supabase.co/functions/v1/send-welcome-email',
    'POST',
    '{"Content-Type":"application/json", "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55aXdpY3did3pqa2lqYW1xcXNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyMDUwODgsImV4cCI6MjA5OTc4MTA4OH0.Y34FVIh9iv6tobH238qAszhN6W3waL4Ko2lkjEqsUd4"}',
    json_build_object('record', json_build_object('email', NEW.email, 'raw_user_meta_data', NEW.raw_user_meta_data))::text,
    '1000'
  );
  RETURN NEW;
END;
$$;

-- 2. Drop the old trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Create the trigger calling the trigger function
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.send_welcome_email_on_signup();
