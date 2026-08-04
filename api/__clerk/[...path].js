import { Readable } from "node:stream";

const CLERK_FAPI = "https://frontend-api.clerk.dev";

function getProxyHost(req) {
  const forwarded = req.headers["x-forwarded-host"];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return raw?.split(",")[0]?.trim() || req.headers.host || "";
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const pathParts = Array.isArray(req.query.path)
    ? req.query.path
    : req.query.path
      ? [req.query.path]
      : [];
  const target = new URL(`/${pathParts.map(encodeURIComponent).join("/")}`, CLERK_FAPI);
  const query = new URL(req.url, "https://astracrea.com").search;
  target.search = query;

  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers || {})) {
    if (name.toLowerCase() === "host") continue;
    if (Array.isArray(value)) value.forEach((item) => headers.append(name, String(item)));
    else if (value != null) headers.set(name, String(value));
  }

  const protocol = req.headers["x-forwarded-proto"] || "https";
  const host = getProxyHost(req);
  headers.set("Clerk-Proxy-Url", `${protocol}://${host}/api/__clerk`);
  headers.set("Clerk-Secret-Key", process.env.CLERK_SECRET_KEY);

  const init = {
    method: req.method,
    headers,
    redirect: "manual",
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = Readable.toWeb(req);
    init.duplex = "half";
  }

  try {
    const upstream = await fetch(target, init);
    res.status(upstream.status);
    upstream.headers.forEach((value, name) => {
      if (name !== "transfer-encoding" && name !== "connection") {
        res.setHeader(name, value);
      }
    });

    if (req.method === "HEAD" || upstream.status === 204) return res.end();
    const body = Buffer.from(await upstream.arrayBuffer());
    return res.send(body);
  } catch (error) {
    console.error("Clerk proxy error:", error.message);
    return res.status(502).json({ error: "Clerk proxy unavailable" });
  }
}