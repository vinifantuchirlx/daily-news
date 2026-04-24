/**
 * Manually trigger the daily compile pipeline from a dev machine.
 * Requires AI_GATEWAY_API_KEY (and AI_MODEL optional) in .env.local.
 *
 * Usage:  npm run compile:local
 */
import { config } from "dotenv";
import { runDailyCompile } from "../src/lib/compile";

config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  console.log("[compile] starting…");
  const { edition, blobUrl } = await runDailyCompile();
  console.log(`[compile] done — ${edition.articles.length} articles`);
  console.log(`[compile] date: ${edition.date}`);
  console.log(`[compile] stored at: ${blobUrl}`);
  console.log("[compile] stats:", edition.stats);
  console.log("\nTop 10:");
  for (const a of edition.articles) {
    console.log(`  ${a.rank}. [${a.category}] ${a.title} — ${a.source}`);
  }
}

main().catch((err) => {
  console.error("[compile] failed:", err);
  process.exit(1);
});
