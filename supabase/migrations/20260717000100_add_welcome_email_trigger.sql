CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION supabase_functions.http_request(
  'https://nyiwicwbwzjkijamqqsl.supabase.co/functions/v1/send-welcome-email',
  'POST',
  '{"Content-Type":"application/json"}',
  json_build_object('record', json_build_object('email', NEW.email, 'raw_user_meta_data', NEW.raw_user_meta_data))::text,
  '1000'
);
