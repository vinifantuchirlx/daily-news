/**
 * Dry-run: fetch all sources and print stats. No API keys required.
 * Usage: npx tsx scripts/test-sources.ts
 */
import { fetchAllSources } from "../src/lib/sources";

async function main() {
  console.log("[sources] fetching last 36h…\n");
  const t0 = Date.now();
  const { articles, sourcesFetched } = await fetchAllSources(36);
  const elapsed = Date.now() - t0;

  const bySource = new Map<string, number>();
  for (const a of articles) {
    const key = a.source.startsWith("HN") ? "HN (all)" : a.source;
    bySource.set(key, (bySource.get(key) ?? 0) + 1);
  }

  console.log(`[sources] done in ${elapsed}ms`);
  console.log(`[sources] total sources tried: ${sourcesFetched}`);
  console.log(`[sources] raw article count: ${articles.length}\n`);

  console.log("per source:");
  for (const [s, n] of [...bySource.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${n.toString().padStart(3)}  ${s}`);
  }

  console.log("\nsample (first 8):");
  for (const a of articles.slice(0, 8)) {
    console.log(`  · [${a.source}] ${a.title.slice(0, 90)}`);
  }
}

main().catch((err) => {
  console.error("[sources] failed:", err);
  process.exit(1);
});
