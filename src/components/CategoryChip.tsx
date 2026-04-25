"use client";

import { useTranslations } from "next-intl";
import { CATEGORY_VAR } from "@/lib/category";
import type { NewsCategory } from "@/lib/types";

interface Props {
  category: NewsCategory;
  rank?: number;
  size?: "sm" | "md";
}

export default function CategoryChip({ category, rank, size = "md" }: Props) {
  const tCat = useTranslations("category");
  const color = CATEGORY_VAR[category];
  const cls = size === "sm"
    ? "text-[10px] tracking-[0.12em]"
    : "text-[11px] tracking-[0.12em]";
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-sans font-semibold uppercase ${cls}`}
      style={{ color }}
    >
      <span className="cat-dot" />
      {rank !== undefined ? <span className="font-mono opacity-70">#{rank.toString().padStart(2, "0")}</span> : null}
      <span>{tCat(category)}</span>
    </span>
  );
}
