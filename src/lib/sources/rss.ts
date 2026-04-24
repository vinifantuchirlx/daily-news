import Parser from "rss-parser";
import type { RawArticle } from "../types";
import { articleId } from "./hash";

/**
 * Curated AI-focused RSS feeds. Ordered roughly by signal density.
 */
export const RSS_FEEDS: { name: string; url: string; aiOnly?: boolean }[] = [
  { name: "TechCrunch AI", url: "https://techcrunch.com/category/artificial-intelligence/feed/", aiOnly: true },
  { name: "The Verge AI", url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml", aiOnly: true },
  { name: "MIT Technology Review AI", url: "https://www.technologyreview.com/topic/artificial-intelligence/feed", aiOnly: true },
  { name: "VentureBeat AI", url: "https://venturebeat.com/category/ai/feed/", aiOnly: true },
  { name: "Ars Technica AI", url: "https://arstechnica.com/ai/feed/", aiOnly: true },
  { name: "Google DeepMind Blog", url: "https://deepmind.google/blog/rss.xml", aiOnly: true },
  { name: "OpenAI Blog", url: "https://openai.com/blog/rss.xml", aiOnly: true },
  { name: "Hugging Face Blog", url: "https://huggingface.co/blog/feed.xml", aiOnly: true },
  { name: "Anthropic News", url: "https://www.anthropic.com/news/rss.xml", aiOnly: true },
];

const parser = new Parser({
  timeout: 10_000,
  headers: { "user-agent": "DailyAINewsBot/0.1 (+contact-admin)" },
});

function isRecent(isoDate: string | undefined, windowHours: number): boolean {
  if (!isoDate) return false;
  const t = Date.parse(isoDate);
  if (Number.isNaN(t)) return false;
  return Date.now() - t < windowHours * 3600 * 1000;
}

export async function fetchRssFeed(
  feed: (typeof RSS_FEEDS)[number],
  windowHours = 36,
): Promise<RawArticle[]> {
  try {
    const parsed = await parser.parseURL(feed.url);
    const items = parsed.items ?? [];
    return items
      .filter((item) => item.link && item.title)
      .filter((item) => isRecent(item.isoDate ?? item.pubDate, windowHours))
      .map<RawArticle>((item) => ({
        id: articleId(item.link as string),
        title: (item.title as string).trim(),
        url: item.link as string,
        source: feed.name,
        snippet: (item.contentSnippet || item.content || "").slice(0, 600),
        publishedAt: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
      }));
  } catch (err) {
    console.warn(`[rss] failed ${feed.name}:`, (err as Error).message);
    return [];
  }
}

export async function fetchAllRss(windowHours = 36): Promise<RawArticle[]> {
  const batches = await Promise.all(RSS_FEEDS.map((f) => fetchRssFeed(f, windowHours)));
  return batches.flat();
}
