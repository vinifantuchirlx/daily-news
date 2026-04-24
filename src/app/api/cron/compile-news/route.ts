import { NextResponse, type NextRequest } from "next/server";
import { runDailyCompile } from "@/lib/compile";
import { verifySessionToken, sessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isAuthorized(req: NextRequest): boolean {
  // Vercel cron sends: Authorization: Bearer $CRON_SECRET
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (cronSecret && auth === `Bearer ${cronSecret}`) return true;
  return false;
}

async function isSignedInUser(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(sessionCookie.name)?.value;
  return token ? await verifySessionToken(token) : false;
}

export async function GET(req: NextRequest) {
  // Allow Vercel cron OR an authenticated dashboard user (manual trigger).
  const allowed = isAuthorized(req) || (await isSignedInUser(req));
  if (!allowed) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await runDailyCompile();
    return NextResponse.json({
      ok: true,
      date: result.edition.date,
      articleCount: result.edition.articles.length,
      stats: result.edition.stats,
    });
  } catch (err) {
    console.error("[cron] compile failed:", err);
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 },
    );
  }
}

// Manual trigger from the dashboard (requires session cookie).
export async function POST(req: NextRequest) {
  return GET(req);
}
