-- Credit balances are additive.
-- Expert's subscription grants 20,000 credits, but purchased packs and rewards
-- can raise the balance above 20,000. There is no global wallet cap.
-- Run this migration in the Supabase SQL Editor.

CREATE OR REPLACE FUNCTION public.increment_credits(
  p_clerk_user_id text,
  p_amount integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users
  SET credits = credits + GREATEST(0, p_amount)
  WHERE clerk_user_id = p_clerk_user_id;
END;
$$;