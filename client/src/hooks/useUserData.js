import { useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";

/**
 * Fetches plan + credits for the signed-in user from the Express API.
 * Returns { plan, credits, loading, refetch }.
 *
 * If the backend row is missing (e.g. Clerk webhook not delivered yet), the
 * hook automatically creates it via the /api/user/ensure fallback.
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
      if (res.ok) {
        setData(await res.json());
        return;
      }

      // Fallback: create the row if the Clerk webhook missed it
      if (res.status === 404) {
        const email = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses?.[0]?.emailAddress ?? "";
        const ensureRes = await fetch("/api/user/ensure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clerkUserId: user.id, email }),
        });
        if (ensureRes.ok) {
          setData(await ensureRes.json());
          return;
        }
      }
    } catch (err) {
      console.error("useUserData error:", err);
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
