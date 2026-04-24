import type { RawArticle } from "../types";
import { fetchAllRss, RSS_FEEDS } from "./rss";
import { fetchHackerNews } from "./hackernews";

export async function fetchAllSources(windowHours = 36): Promise<{
  articles: RawArticle[];
  sourcesFetched: number;
}> {
  const [rss, hn] = await Promise.all([
    fetchAllRss(windowHours),
    fetchHackerNews(windowHours),
  ]);
  return {
    articles: [...rss, ...hn],
    sourcesFetched: RSS_FEEDS.length + 1,
  };
}
