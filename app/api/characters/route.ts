import { NextRequest } from "next/server";
import { promises as fs } from "fs";
import path from "path";

// Directory to store character JSON files (server side)
const CHAR_DIR = path.join(process.cwd(), "characters");

async function ensureDir() {
  try {
    await fs.mkdir(CHAR_DIR, { recursive: true });
  } catch {}
}

export async function GET() {
  await ensureDir();
  const files = await fs.readdir(CHAR_DIR).catch(() => []);
  const list = [] as { id: string; name: string; json: string }[];
  for (const f of files) {
    if (!f.endsWith(".json")) continue;
    try {
      const data = await fs.readFile(path.join(CHAR_DIR, f), "utf8");
      const parsed = JSON.parse(data);
      list.push({
        id: f.replace(/\.json$/, ""),
        name: parsed.name || f.replace(/\.json$/, ""),
        json: JSON.stringify(parsed),
      });
    } catch {}
  }
  return new Response(JSON.stringify(list), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}

export async function POST(req: NextRequest) {
  await ensureDir();
  try {
    const body = await req.json();
    const { id, name, json } = body || {};
    if (!id || !json) {
      return new Response(JSON.stringify({ error: "Missing id or json" }), {
        status: 400,
      });
    }
    let parsed;
    try {
      parsed = JSON.parse(json);
    } catch (e: any) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON: " + e.message }),
        { status: 400 }
      );
    }
    // Attach name if provided
    if (name) parsed.name = name;
    const filePath = path.join(CHAR_DIR, id + ".json");
    await fs.writeFile(filePath, JSON.stringify(parsed, null, 2), "utf8");
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  await ensureDir();
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id)
      return new Response(JSON.stringify({ error: "Missing id" }), {
        status: 400,
      });
    const filePath = path.join(CHAR_DIR, id + ".json");
    await fs.unlink(filePath).catch(() => {});
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
