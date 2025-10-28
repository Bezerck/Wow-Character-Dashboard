import { NextRequest, NextResponse } from "next/server";

// Allowed production origins. Extend this list if needed.
const PROD_ALLOWED = ["https://classic.warcraftlogs.com"];

export const config = {
  matcher: ["/:path*"],
};

function buildCorsHeaders(origin: string | null, allow: boolean): Headers {
  const h = new Headers();
  if (allow) {
    // Echo back the requesting origin (stricter) or use '*' in dev when allowed
    h.set("Access-Control-Allow-Origin", origin || "*");
    h.set("Vary", "Origin");
  }
  h.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  h.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
  h.set("Access-Control-Allow-Credentials", "true");
  h.set("Access-Control-Max-Age", "86400"); // Cache preflight for 24h
  return h;
}

export function middleware(req: NextRequest) {
  const origin = req.headers.get("origin");
  const isProd = process.env.NODE_ENV === "production";
  const allow = isProd ? !!origin && PROD_ALLOWED.includes(origin) : true; // Allow all in dev for ease

  // Handle preflight requests early
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: buildCorsHeaders(origin, allow),
    });
  }

  const res = NextResponse.next();
  const cors = buildCorsHeaders(origin, allow);
  cors.forEach((value, key) => {
    res.headers.set(key, value);
  });
  return res;
}
