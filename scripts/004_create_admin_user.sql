-- Create admin user with email hii@mail.com and password howareyou@123
-- This script adds a new admin user to the Supabase auth system

-- Insert admin user into auth.users table
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'hii@mail.com',
  crypt('howareyou@123', gen_salt('bf')),
  NOW(),
  NOW(),
  '',
  NOW(),
  '',
  NULL,
  '',
  '',
  NULL,
  NULL,
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  FALSE,
  NOW(),
  NOW(),
  NULL,
  NULL,
  '',
  '',
  NULL,
  '',
  0,
  NULL,
  '',
  NULL,
  FALSE,
  NULL
);

-- Get the user ID for the admin user we just created
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Get the user ID
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'hii@mail.com';
    
    -- Insert default categories for the admin user
    INSERT INTO categories (name, color, user_id) VALUES
    ('Food & Dining', '#ef4444', admin_user_id),
    ('Transportation', '#3b82f6', admin_user_id),
    ('Shopping', '#8b5cf6', admin_user_id),
    ('Entertainment', '#f59e0b', admin_user_id),
    ('Bills & Utilities', '#10b981', admin_user_id),
    ('Healthcare', '#ec4899', admin_user_id),
    ('Education', '#06b6d4', admin_user_id),
    ('Travel', '#84cc16', admin_user_id),
    ('Personal Care', '#f97316', admin_user_id),
    ('Other', '#6b7280', admin_user_id);
    
    -- Insert some sample expenses for the admin user
    INSERT INTO expenses (expense_name, expense_amount, category, user_id) VALUES
    ('Lunch at Restaurant', 25.50, 'Food & Dining', admin_user_id),
    ('Gas Station', 45.00, 'Transportation', admin_user_id),
    ('Grocery Shopping', 120.75, 'Shopping', admin_user_id),
    ('Movie Tickets', 30.00, 'Entertainment', admin_user_id),
    ('Electric Bill', 85.20, 'Bills & Utilities', admin_user_id);
END $$;
