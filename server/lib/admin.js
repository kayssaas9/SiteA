import { createClerkClient } from "@clerk/backend";
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

function toClerkRequest(req) {
  const rawUrl = typeof req.url === "string" ? req.url : "/";
  const protocol = req.headers?.["x-forwarded-proto"]?.split(",")[0]?.trim()
    || (req.socket?.encrypted ? "https" : "http");
  const host = req.headers?.host || req.headers?.["x-forwarded-host"] || "localhost";
  const url = /^https?:\/\//i.test(rawUrl)
    ? rawUrl
    : `${protocol}://${host}${rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`}`;
  const headers = new Headers();

  for (const [name, value] of Object.entries(req.headers || {})) {
    if (Array.isArray(value)) {
      value.forEach((item) => headers.append(name, String(item)));
    } else if (value != null) {
      headers.set(name, String(value));
    }
  }

  return new Request(url, {
    method: req.method || "GET",
    headers,
  });
}

/**
 * The browser only uses the email whitelist to decide whether to show the
 * navigation link. This server-side check is the actual authorization gate.
 */
export async function getAdminContext(req) {
  if (!process.env.CLERK_SECRET_KEY) return null;

  try {
    const auth = await clerkClient.authenticateRequest(toClerkRequest(req), {
      acceptsToken: "session_token",
    });

    if (!auth.isAuthenticated || !auth.userId) return null;

    const user = await clerkClient.users.getUser(auth.userId);
    const email = getPrimaryEmail(user);
    if (!isAdminEmail(email)) return null;

    return {
      userId: auth.userId,
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
    generationsCount,
    completedCount,
    processingCount,
    users,
    recentGenerations,
  ] = await Promise.all([
    supabaseAdmin.from("users").select("clerk_user_id", { count: "exact", head: true }),
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
      generations: generationsCount.count ?? 0,
      completedGenerations: completedCount.count ?? 0,
      processingGenerations: processingCount.count ?? 0,
    },
    users: users.data ?? [],
    recentGenerations: recentGenerations.data ?? [],
  };
}