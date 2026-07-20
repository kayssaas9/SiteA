import { useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";

/**
 * Fetches plan + credits for the signed-in user from the Express API.
 * Returns { plan, credits, loading, refetch }.
 */
export function useUserData() {
  const { user, isLoaded } = useUser();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);

  const fetch_ = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/user/${user.id}`);
      if (res.ok) setData(await res.json());
    } catch (_) {
      // silently ignore — user may not exist yet in Supabase
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && user) fetch_();
  }, [isLoaded, user?.id]);

  return {
    plan: data?.plan ?? "free",
    credits: data?.credits ?? 0,
    snaprougeUnlocked: data?.snaprouge_unlocked ?? false,
    loading,
    refetch: fetch_,
  };
}
