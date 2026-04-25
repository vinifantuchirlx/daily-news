import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import type {
  Edition,
  NewsCategory,
  RankedArticle,
  RawArticle,
} from "./types";
import { todayInSaoPauloIso } from "./utils";

const CATEGORIES = [
  "launch",
  "research",
  "technique",
  "business",
  "policy",
  "other",
] as const satisfies readonly NewsCategory[];

/**
 * Deterministic pre-dedupe: collapse duplicate URLs and near-identical titles.
 * The LLM handles semantic dedupe as part of ranking.
 */
function normalizeTitle(t: string): string {
  return t
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function dedupe(articles: RawArticle[]): RawArticle[] {
  const byUrl = new Map<string, RawArticle>();
  for (const a of articles) {
    const key = a.url.replace(/[#?].*$/, "").toLowerCase();
    const existing = byUrl.get(key);
    if (!existing) byUrl.set(key, a);
  }

  const byTitle = new Map<string, RawArticle>();
  for (const a of byUrl.values()) {
    const key = normalizeTitle(a.title);
    const existing = byTitle.get(key);
    if (!existing) byTitle.set(key, a);
    else {
      // keep the earlier publishedAt (closer to original source)
      const existingTime = Date.parse(existing.publishedAt);
      const newTime = Date.parse(a.publishedAt);
      if (newTime < existingTime) byTitle.set(key, a);
    }
  }
  return Array.from(byTitle.values());
}

const SelectionSchema = z.object({
  selections: z
    .array(
      z.object({
        id: z.string().describe("The article id from the input list"),
        rank: z
          .number()
          .describe("Integer position 1-10, where 1 = most consequential story"),
        score: z
          .number()
          .describe("Integer relevance to the global AI community, 0-100"),
        category: z.enum(CATEGORIES),
        summaryEn: z
          .string()
          .describe("2 concise sentences summarizing the story in English"),
        summaryPtBr: z
          .string()
          .describe("2 frases concisas resumindo a matéria em português do Brasil"),
        whyItMattersEn: z
          .string()
          .describe("1 sentence: why this matters for AI practitioners/founders"),
        whyItMattersPtBr: z
          .string()
          .describe("1 frase: por que isso importa para quem trabalha com IA"),
      }),
    ),
});

const SYSTEM = `You are the editor of a daily AI newsletter for a senior technical audience
(engineers, researchers, AI product builders). Pick the 10 most consequential stories
from the past ~24h. Prioritize: genuine model/product launches, research breakthroughs,
novel techniques, major business moves, important policy shifts. Avoid: rumors, opinion
pieces, listicles, duplicates of the same underlying story, and minor version bumps.

Rank 1 = most important. Score reflects global relevance on a 0-100 scale. Write
summaries that are factual, specific, and free of marketing language. Mention concrete
numbers, model names, or capabilities where present.`;

function buildUserPrompt(articles: RawArticle[]): string {
  const lines = articles.map((a, i) => {
    const snippet = a.snippet ? ` — ${a.snippet.slice(0, 240)}` : "";
    return `${i + 1}. [id=${a.id}] "${a.title}" (${a.source}, ${a.publishedAt})${snippet}\n   url: ${a.url}`;
  });
  return `Below are ${articles.length} candidate articles from the last 24-36 hours.
Pick exactly 10 — deduplicate stories covering the same announcement, even if titled
differently. Return only article ids that appear in this list.

${lines.join("\n\n")}`;
}

export interface CompileOptions {
  /** Max articles to feed to the LLM after dedupe (token budget guard). */
  maxCandidates?: number;
  /** Model override, e.g. "anthropic/claude-sonnet-4-6". */
  model?: string;
  /** Timezone-aware date to stamp on the edition (YYYY-MM-DD). */
  date?: string;
}

export async function compileEdition(
  rawArticles: RawArticle[],
  sourcesFetched: number,
  opts: CompileOptions = {},
): Promise<Edition> {
  const deduped = dedupe(rawArticles);
  const maxCandidates = opts.maxCandidates ?? 80;
  const candidates = deduped.slice(0, maxCandidates);

  if (candidates.length < 10) {
    throw new Error(
      `Not enough candidate articles after dedupe (got ${candidates.length}, need >= 10)`,
    );
  }

  const modelName = (opts.model ?? process.env.AI_MODEL ?? "anthropic/claude-sonnet-4-6").replace(/^anthropic\//, "");
  const model = anthropic(modelName);

  const { object, usage } = await generateObject({
    model,
    schema: SelectionSchema,
    system: SYSTEM,
    prompt: buildUserPrompt(candidates),
    temperature: 0.2,
  });

  const byId = new Map(candidates.map((a) => [a.id, a]));
  const ranked: RankedArticle[] = object.selections
    .map((s): RankedArticle | null => {
      const src = byId.get(s.id);
      if (!src) return null;
      return {
        id: src.id,
        rank: s.rank,
        title: src.title,
        url: src.url,
        source: src.source,
        publishedAt: src.publishedAt,
        category: s.category,
        score: s.score,
        summaryEn: s.summaryEn,
        summaryPtBr: s.summaryPtBr,
        whyItMattersEn: s.whyItMattersEn,
        whyItMattersPtBr: s.whyItMattersPtBr,
      };
    })
    .filter((x): x is RankedArticle => x !== null)
    .sort((a, b) => a.rank - b.rank);

  if (ranked.length < 10) {
    throw new Error(
      `LLM returned ${ranked.length} valid selections (need 10). Likely hallucinated ids.`,
    );
  }

  return {
    date: opts.date ?? todayInSaoPauloIso(),
    generatedAt: new Date().toISOString(),
    articles: ranked,
    stats: {
      sourcesFetched,
      rawCount: rawArticles.length,
      dedupedCount: deduped.length,
      tokensUsedApprox:
        (usage?.inputTokens ?? 0) + (usage?.outputTokens ?? 0) || undefined,
    },
  };
}
