import { NextRequest } from "next/server";

// Minimal server-side proxy to avoid browser CORS when fetching third-party pages.
// This implements a small allowlist and returns the fetched response text.

const ALLOWED_HOSTS = [
  "classic.warcraftlogs.com",
  // add other hosts you trust here
];

function isAllowedHost(hostname: string | null) {
  if (!hostname) return false;
  return ALLOWED_HOSTS.includes(hostname.toLowerCase());
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");
    if (!url) {
      return new Response(JSON.stringify({ error: "Missing url param" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid URL" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!isAllowedHost(parsed.hostname)) {
      return new Response(JSON.stringify({ error: "Host not allowed" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const res = await fetch(parsed.toString(), {
      headers: {
        // Spoof a user-agent to avoid minimal bot blocks; keep it generic.
        "User-Agent":
          "Mozilla/5.0 (compatible; wowsite-proxy/1.0; +https://example.com)",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    const text = await res.text();

    return new Response(text, {
      status: res.status,
      headers: {
        // Return as text/html so the client can parse it if needed.
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
