-- Cleanup duplicate triggers and ensure exactly one welcome email trigger is active
DROP TRIGGER IF EXISTS on_auth_user_created_welcome ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS welcome_trigger ON auth.users;
DROP TRIGGER IF EXISTS send_welcome_email_trigger ON auth.users;

-- Drop the old duplicate welcome helper function to avoid confusion
DROP FUNCTION IF EXISTS public.handle_new_user_welcome();

-- Ensure exactly one welcome email trigger is registered
CREATE TRIGGER on_auth_user_created_welcome
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.send_welcome_email_on_signup();
