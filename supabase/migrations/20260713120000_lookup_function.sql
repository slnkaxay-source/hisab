CREATE OR REPLACE FUNCTION lookup_user_by_email(email_to_find TEXT)
RETURNS TABLE (user_id UUID, user_email TEXT, full_name TEXT)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.email, p.full_name
  FROM profiles p
  WHERE p.email = email_to_find
  LIMIT 1;
END;
$$;
