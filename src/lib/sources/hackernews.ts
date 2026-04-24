import type { RawArticle } from "../types";
import { articleId } from "./hash";

/**
 * HN Algolia API — fetch top stories tagged with AI-related keywords.
 * Docs: https://hn.algolia.com/api
 */
const HN_SEARCH_URL = "https://hn.algolia.com/api/v1/search";

const AI_QUERIES = [
  "AI",
  "LLM",
  "GPT",
  "Claude",
  "Gemini",
  "transformer",
  "diffusion",
  "agent",
];

interface HnHit {
  objectID: string;
  title: string | null;
  url: string | null;
  author: string | null;
  created_at: string;
  points: number | null;
  num_comments: number | null;
}

export async function fetchHackerNews(windowHours = 36): Promise<RawArticle[]> {
  const nowSec = Math.floor(Date.now() / 1000);
  const sinceSec = nowSec - windowHours * 3600;

  const batches = await Promise.all(
    AI_QUERIES.map(async (q) => {
      const url = new URL(HN_SEARCH_URL);
      url.searchParams.set("query", q);
      url.searchParams.set("tags", "story");
      url.searchParams.set("numericFilters", `created_at_i>${sinceSec},points>40`);
      url.searchParams.set("hitsPerPage", "25");

      try {
        const res = await fetch(url, {
          signal: AbortSignal.timeout(10_000),
          headers: { "user-agent": "DailyAINewsBot/0.1" },
        });
        if (!res.ok) return [] as HnHit[];
        const data = (await res.json()) as { hits: HnHit[] };
        return data.hits;
      } catch (err) {
        console.warn(`[hn] failed query="${q}":`, (err as Error).message);
        return [] as HnHit[];
      }
    }),
  );

  const seen = new Set<string>();
  const out: RawArticle[] = [];
  for (const hit of batches.flat()) {
    if (!hit.url || !hit.title) continue;
    if (seen.has(hit.objectID)) continue;
    seen.add(hit.objectID);
    out.push({
      id: articleId(hit.url),
      title: hit.title,
      url: hit.url,
      source: `HN (${hit.points ?? 0}pts)`,
      snippet: undefined,
      publishedAt: hit.created_at,
    });
  }
  return out;
}
