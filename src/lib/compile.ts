import { compileEdition } from "./agent";
import { fetchAllSources } from "./sources";
import { saveEdition } from "./storage";
import type { Edition } from "./types";

export interface CompileResult {
  edition: Edition;
  blobUrl: string;
}

/**
 * End-to-end daily compile: fetch → dedupe/rank/summarize → persist.
 */
export async function runDailyCompile(): Promise<CompileResult> {
  const { articles, sourcesFetched } = await fetchAllSources(36);
  const edition = await compileEdition(articles, sourcesFetched);
  const { url } = await saveEdition(edition);
  return { edition, blobUrl: url };
}
