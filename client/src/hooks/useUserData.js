import { useUser } from "@clerk/clerk-react";
import { useCallback, useEffect, useState } from "react";

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
  const userId = user?.id;
  const userEmail =
    user?.primaryEmailAddress?.emailAddress
    ?? user?.emailAddresses?.[0]?.emailAddress
    ?? "";

  const fetch_ = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // The credits can be changed directly in Supabase. Never let the
      // browser, a service worker, or a proxy reuse an older user response.
      const res = await fetch(`/api/user/${encodeURIComponent(userId)}?fresh=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (res.ok) {
        setData(await res.json());
        return;
      }

      // Fallback: create the row if the Clerk webhook missed it
      if (res.status === 404) {
        const ensureRes = await fetch(`/api/user/ensure?fresh=${Date.now()}`, {
          method: "POST",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
          body: JSON.stringify({ clerkUserId: userId, email: userEmail }),
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
  }, [userEmail, userId]);

  useEffect(() => {
    if (isLoaded && userId) fetch_();
  }, [fetch_, isLoaded, userId]);

  useEffect(() => {
    const refreshOnPayment = () => fetch_();
    window.addEventListener("astra-user-data-changed", refreshOnPayment);
    return () => window.removeEventListener("astra-user-data-changed", refreshOnPayment);
  }, [fetch_]);

  return {
    plan: data?.plan ?? "free",
    credits: data?.credits ?? 0,
    snaprougeUnlocked: data?.snaprouge_unlocked ?? false,
    surveyCompleted: data?.survey_completed ?? false,
    loading,
    refetch: fetch_,
  };
}
