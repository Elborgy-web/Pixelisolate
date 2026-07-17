-- Enable pg_net extension if not present
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create handle_new_user_welcome function in public schema
CREATE OR REPLACE FUNCTION public.handle_new_user_welcome()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://nyiwicwbwzjkijamqqsl.supabase.co/functions/v1/send-welcome-email',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55aXdpY3did3pqa2lqYW1xcXNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyMDUwODgsImV4cCI6MjA5OTc4MTA4OH0.Y34FVIh9iv6tobH238qAszhN6W3waL4Ko2lkjEqsUd4"}'::jsonb,
    body := jsonb_build_object('record', jsonb_build_object('email', NEW.email)),
    timeout_milliseconds := 5000
  );
  RETURN NEW;
END;
$$;

-- Create trigger AFTER INSERT on auth.users table
CREATE OR REPLACE TRIGGER on_auth_user_created_welcome
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_welcome();
