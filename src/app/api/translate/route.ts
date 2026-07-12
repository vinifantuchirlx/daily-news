import { NextResponse } from "next/server";

export const runtime = "edge";

/**
 * Lightweight proxy over Google Translate's public web endpoint.
 *
 * We call it from the server so the browser never hits a CORS wall, and so the
 * client only ever receives a fully translated sentence — the caller is expected
 * to send a complete phrase, not a stream of partial words.
 */
const ENDPOINT = "https://translate.googleapis.com/translate_a/single";

type TranslateBody = {
  text?: string;
  /** Source language code (e.g. "en"), or "auto" to detect. */
  source?: string;
  /** Target language code (e.g. "pt"). */
  target?: string;
};

// Google returns a deeply nested array; the first element holds the
// translated segments, each shaped like [translated, original, ...].
type GoogleTranslateResponse = [
  Array<[string, string, ...unknown[]]> | null,
  ...unknown[],
];

export async function POST(request: Request) {
  let body: TranslateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const text = body.text?.trim();
  const source = body.source?.trim() || "auto";
  const target = body.target?.trim();

  if (!text) {
    return NextResponse.json({ error: "Missing text." }, { status: 400 });
  }
  if (!target) {
    return NextResponse.json({ error: "Missing target language." }, { status: 400 });
  }

  const params = new URLSearchParams({
    client: "gtx",
    sl: source,
    tl: target,
    dt: "t",
    q: text,
  });

  try {
    const res = await fetch(`${ENDPOINT}?${params.toString()}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Translation service returned ${res.status}.` },
        { status: 502 },
      );
    }

    const data = (await res.json()) as GoogleTranslateResponse;
    const segments = data[0];
    if (!segments) {
      return NextResponse.json({ error: "Empty translation." }, { status: 502 });
    }

    const translated = segments.map((seg) => seg[0]).join("");
    const detected = (data[2] as string | undefined) ?? source;

    return NextResponse.json({ translated, source: detected, target });
  } catch {
    return NextResponse.json(
      { error: "Failed to reach translation service." },
      { status: 502 },
    );
  }
}
