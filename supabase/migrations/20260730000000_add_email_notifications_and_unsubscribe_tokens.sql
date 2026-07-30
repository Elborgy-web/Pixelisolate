-- Add email_notifications toggle and unsubscribe_token to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS unsubscribe_token UUID DEFAULT gen_random_uuid();

-- Create index for high-speed batch querying of active subscribers
CREATE INDEX IF NOT EXISTS idx_profiles_email_notifications 
ON profiles(email_notifications) 
WHERE email_notifications = TRUE;

-- Create index on unsubscribe_token for instant 0ms lookup
CREATE INDEX IF NOT EXISTS idx_profiles_unsubscribe_token
ON profiles(unsubscribe_token);
