-- Add SnapRouge access flag to users
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS snaprouge_unlocked BOOLEAN NOT NULL DEFAULT false;
