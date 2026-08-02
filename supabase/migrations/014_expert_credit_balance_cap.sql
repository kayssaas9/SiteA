-- Expert is marketed as unlimited, but its server-side credit balance is capped
-- at 20,000 credits. Run this migration in the Supabase SQL Editor.

UPDATE public.users
SET credits = 20000
WHERE plan = 'expert'
  AND credits > 20000;

CREATE OR REPLACE FUNCTION public.increment_credits(
  p_clerk_user_id text,
  p_amount integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_plan text;
BEGIN
  SELECT plan
  INTO current_plan
  FROM public.users
  WHERE clerk_user_id = p_clerk_user_id
  FOR UPDATE;

  UPDATE public.users
  SET credits = CASE
    WHEN current_plan = 'expert'
      THEN LEAST(20000, credits + GREATEST(0, p_amount))
    ELSE credits + GREATEST(0, p_amount)
  END
  WHERE clerk_user_id = p_clerk_user_id;
END;
$$;