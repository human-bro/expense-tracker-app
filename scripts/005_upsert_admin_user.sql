-- Create or update admin user with email hii@mail.com and password howareyou@123
-- This script handles the case where the user might already exist

-- First, try to delete the existing user if it exists (this will cascade delete related data)
DELETE FROM auth.users WHERE email = 'hii@mail.com';

-- Now create the new admin user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'hii@mail.com',
  crypt('howareyou@123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Get the user ID for the admin user we just created
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Get the admin user ID
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'hii@mail.com';
    
    -- Create default categories for the admin user
    INSERT INTO categories (name, color, user_id) VALUES
    ('Food & Dining', '#ef4444', admin_user_id),
    ('Transportation', '#3b82f6', admin_user_id),
    ('Shopping', '#8b5cf6', admin_user_id),
    ('Entertainment', '#f59e0b', admin_user_id),
    ('Bills & Utilities', '#10b981', admin_user_id),
    ('Healthcare', '#ec4899', admin_user_id),
    ('Education', '#6366f1', admin_user_id),
    ('Travel', '#14b8a6', admin_user_id);
    
    -- Create some sample expenses for testing
    INSERT INTO expenses (expense_name, expense_amount, category, user_id) VALUES
    ('Lunch at Restaurant', 25.50, 'Food & Dining', admin_user_id),
    ('Gas Station', 45.00, 'Transportation', admin_user_id),
    ('Grocery Shopping', 120.75, 'Shopping', admin_user_id),
    ('Movie Tickets', 30.00, 'Entertainment', admin_user_id),
    ('Electric Bill', 85.20, 'Bills & Utilities', admin_user_id);
END $$;
