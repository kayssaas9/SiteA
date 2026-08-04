import { createClerkClient, verifyToken } from "@clerk/backend";
import { supabaseAdmin } from "./supabase.js";

export const ADMIN_EMAILS = new Set([
  "kays.amr9@gmail.com",
  "kays.saas9@gmail.com",
]);

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
  publishableKey:
    process.env.CLERK_PUBLISHABLE_KEY
    || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    || process.env.VITE_CLERK_PUBLISHABLE_KEY,
});

export function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

export function isAdminEmail(email) {
  return ADMIN_EMAILS.has(normalizeEmail(email));
}

function getPrimaryEmail(user) {
  const primary = user?.emailAddresses?.find(
    (address) => address.id === user.primaryEmailAddressId,
  );
  return primary?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || "";
}

function getSessionTokens(req) {
  const authorization = req.headers?.authorization || "";
  const bearerToken = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  const cookieHeader = req.headers?.cookie || "";
  const cookieTokens = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.startsWith("__session=") || part.startsWith("__session_"))
    .map((part) => {
      const separator = part.indexOf("=");
      if (separator === -1) return "";
      try {
        return decodeURIComponent(part.slice(separator + 1));
      } catch {
        return "";
      }
    })
    .filter(Boolean);

  return [bearerToken, ...cookieTokens].filter(Boolean);
}

/**
 * The browser only uses the email whitelist to decide whether to show the
 * navigation link. This server-side check is the actual authorization gate.
 */
export async function getAdminContext(req) {
  try {
    if (!process.env.CLERK_SECRET_KEY) return null;

    let userId = null;
    for (const token of getSessionTokens(req)) {
      try {
        const claims = await verifyToken(token, {
          secretKey: process.env.CLERK_SECRET_KEY,
        });
        userId = claims?.sub || null;
        if (userId) break;
      } catch {
        // Try the next Clerk session cookie candidate.
      }
    }

    if (!userId) return null;

    const user = await clerkClient.users.getUser(userId);
    const email = getPrimaryEmail(user);
    if (!isAdminEmail(email)) return null;

    return {
      userId,
      email: normalizeEmail(email),
    };
  } catch (error) {
    console.error("Admin authentication failed:", error.message);
    return null;
  }
}

export async function sendAdminOnly(req, res) {
  const admin = await getAdminContext(req);
  if (!admin) {
    res.status(403).json({ error: "Accès administrateur refusé." });
    return null;
  }
  return admin;
}

export async function getAdminDashboard() {
  const [
    usersCount,
    subscribersCount,
    generationsCount,
    completedCount,
    processingCount,
    users,
    recentGenerations,
  ] = await Promise.all([
    supabaseAdmin.from("users").select("clerk_user_id", { count: "exact", head: true }),
    supabaseAdmin
      .from("users")
      .select("clerk_user_id", { count: "exact", head: true })
      .in("plan", ["basic", "pro", "expert"]),
    supabaseAdmin.from("generations").select("id", { count: "exact", head: true }),
    supabaseAdmin
      .from("generations")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed"),
    supabaseAdmin
      .from("generations")
      .select("id", { count: "exact", head: true })
      .in("status", ["processing", "finalizing"]),
    supabaseAdmin
      .from("users")
      .select("clerk_user_id, email, plan, credits, snaprouge_unlocked, survey_completed")
      .order("email", { ascending: true })
      .limit(100),
    supabaseAdmin
      .from("generations")
      .select("id, clerk_user_id, mode, prompt, status, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const responses = [
    usersCount,
    subscribersCount,
    generationsCount,
    completedCount,
    processingCount,
    users,
    recentGenerations,
  ];
  const failed = responses.find((response) => response.error);
  if (failed) {
    throw new Error(failed.error.message);
  }

  return {
    stats: {
      users: usersCount.count ?? 0,
      subscribers: subscribersCount.count ?? 0,
      generations: generationsCount.count ?? 0,
      completedGenerations: completedCount.count ?? 0,
      processingGenerations: processingCount.count ?? 0,
    },
    users: users.data ?? [],
    recentGenerations: recentGenerations.data ?? [],
  };
}