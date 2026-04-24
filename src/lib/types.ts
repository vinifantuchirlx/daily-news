export type NewsCategory =
  | "launch"
  | "research"
  | "technique"
  | "business"
  | "policy"
  | "other";

/**
 * Raw article as fetched from a source (before LLM processing).
 */
export interface RawArticle {
  id: string; // stable hash of url
  title: string;
  url: string;
  source: string;
  snippet?: string;
  publishedAt: string; // ISO
}

/**
 * Fully processed article after the agent pipeline.
 */
export interface RankedArticle {
  id: string;
  rank: number; // 1..10
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  category: NewsCategory;
  score: number; // 0..100 relevance
  summaryEn: string; // ~2 sentences
  summaryPtBr: string;
  whyItMattersEn: string; // ~1 sentence
  whyItMattersPtBr: string;
}

export interface Edition {
  date: string; // YYYY-MM-DD (America/Sao_Paulo)
  generatedAt: string; // ISO
  articles: RankedArticle[];
  stats: {
    sourcesFetched: number;
    rawCount: number;
    dedupedCount: number;
    tokensUsedApprox?: number;
  };
}
