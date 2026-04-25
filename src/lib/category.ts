import type { NewsCategory } from "./types";

export const CATEGORY_VAR: Record<NewsCategory, string> = {
  launch: "var(--color-cat-launch)",
  research: "var(--color-cat-research)",
  technique: "var(--color-cat-technique)",
  business: "var(--color-cat-business)",
  policy: "var(--color-cat-policy)",
  other: "var(--color-cat-other)",
};
