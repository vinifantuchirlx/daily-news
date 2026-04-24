import { NextResponse } from "next/server";
import { createSessionToken, sessionCookie, verifyPassword } from "@/lib/auth";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const password = (body as { password?: unknown })?.password;
  if (typeof password !== "string") {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  if (!verifyPassword(password)) {
    return NextResponse.json({ ok: false, error: "invalid_password" }, { status: 401 });
  }

  const token = await createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(sessionCookie.name, token, sessionCookie.options);
  return res;
}
