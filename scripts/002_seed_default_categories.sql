-- Insert default expense categories
-- Note: This will only work after a user is authenticated
-- We'll handle this in the application code instead

-- Function to create default categories for new users
CREATE OR REPLACE FUNCTION public.create_default_categories_for_user(user_uuid UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.categories (name, color, user_id) VALUES
    ('Food & Dining', '#EF4444', user_uuid),
    ('Transportation', '#3B82F6', user_uuid),
    ('Shopping', '#8B5CF6', user_uuid),
    ('Entertainment', '#F59E0B', user_uuid),
    ('Bills & Utilities', '#10B981', user_uuid),
    ('Healthcare', '#EC4899', user_uuid),
    ('Travel', '#06B6D4', user_uuid),
    ('Other', '#6B7280', user_uuid)
  ON CONFLICT DO NOTHING;
END;
$$;
