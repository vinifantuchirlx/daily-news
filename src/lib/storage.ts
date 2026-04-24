import { list, put, head } from "@vercel/blob";
import type { Edition } from "./types";
import { promises as fs } from "node:fs";
import path from "node:path";

const EDITION_PREFIX = "editions/";

function useLocalFallback(): boolean {
  return !process.env.BLOB_READ_WRITE_TOKEN;
}

const LOCAL_DIR = path.resolve(process.cwd(), "data", "local", "editions");

async function ensureLocalDir() {
  await fs.mkdir(LOCAL_DIR, { recursive: true });
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

export async function saveEdition(edition: Edition): Promise<{ url: string }> {
  const body = JSON.stringify(edition, null, 2);
  const key = `${EDITION_PREFIX}${edition.date}.json`;

  if (useLocalFallback()) {
    await ensureLocalDir();
    const file = path.join(LOCAL_DIR, `${edition.date}.json`);
    await fs.writeFile(file, body, "utf8");
    return { url: `file://${file}` };
  }

  const { url } = await put(key, body, {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  return { url };
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export async function getEdition(date: string): Promise<Edition | null> {
  if (useLocalFallback()) {
    const file = path.join(LOCAL_DIR, `${date}.json`);
    try {
      const body = await fs.readFile(file, "utf8");
      return JSON.parse(body) as Edition;
    } catch {
      return null;
    }
  }

  const key = `${EDITION_PREFIX}${date}.json`;
  try {
    const meta = await head(key);
    const res = await fetch(meta.url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as Edition;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// List history (dates only, newest first)
// ---------------------------------------------------------------------------

export async function listEditionDates(limit = 30): Promise<string[]> {
  if (useLocalFallback()) {
    try {
      await ensureLocalDir();
      const files = await fs.readdir(LOCAL_DIR);
      return files
        .filter((f) => f.endsWith(".json"))
        .map((f) => f.replace(/\.json$/, ""))
        .sort()
        .reverse()
        .slice(0, limit);
    } catch {
      return [];
    }
  }

  const dates = new Set<string>();
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: EDITION_PREFIX, cursor, limit: 1000 });
    for (const blob of page.blobs) {
      const m = blob.pathname.match(/editions\/(\d{4}-\d{2}-\d{2})\.json$/);
      if (m) dates.add(m[1]);
    }
    cursor = page.cursor;
  } while (cursor);

  return Array.from(dates).sort().reverse().slice(0, limit);
}
