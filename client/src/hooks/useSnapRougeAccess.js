import { useUserData } from "./useUserData.js";

/**
 * Consistent SnapRouge access check across the app.
 *
 * Access is granted if the user has an active Pro or Expert subscription,
 * or if they purchased the one-time SnapRouge unlock.
 */
export function useSnapRougeAccess() {
  const { plan, snaprougeUnlocked, loading } = useUserData();
  const hasAccess = plan === "pro" || plan === "expert" || snaprougeUnlocked;
  return { hasAccess, loading };
}
