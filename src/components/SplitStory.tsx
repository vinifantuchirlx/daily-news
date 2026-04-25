"use client";

import { useLocale, useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";
import { CATEGORY_VAR } from "@/lib/category";
import type { RankedArticle } from "@/lib/types";
import CategoryChip from "./CategoryChip";

export default function SplitStory({ article }: { article: RankedArticle }) {
  const locale = useLocale();
  const t = useTranslations("edition");
  const summary = locale === "pt-BR" ? article.summaryPtBr : article.summaryEn;
  const why = locale === "pt-BR" ? article.whyItMattersPtBr : article.whyItMattersEn;
  const color = CATEGORY_VAR[article.category];

  return (
    <article className="fade-up bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-7 flex flex-col gap-4 h-full">
      <CategoryChip category={article.category} rank={article.rank} />

      <h3 className="font-display text-[clamp(1.5rem,2.4vw,2rem)] leading-[1.15] tracking-tight font-medium">
        <a
          href={article.url}
          target="_blank"
          rel="noreferrer noopener"
          className="hover:underline decoration-[var(--fg)]/20 underline-offset-4"
        >
          {article.title}
        </a>
      </h3>

      <p className="font-serif text-[15px] leading-relaxed text-[var(--fg)]/80">
        {summary}
      </p>

      <blockquote
        className="pull-quote mt-auto text-[14px] leading-relaxed"
        style={{ color }}
      >
        <span className="eyebrow not-italic mr-2" style={{ color }}>
          {t("whyItMatters")}
        </span>
        <span className="text-[var(--fg)]/80">{why}</span>
      </blockquote>

      <div className="flex items-center justify-between text-xs text-[var(--muted)] pt-3 border-t border-[var(--border)]">
        <span className="font-sans">{article.source}</span>
        <a
          href={article.url}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1.5 font-sans font-medium text-[var(--fg)] hover:opacity-80"
        >
          {t("readMore")} <ArrowUpRight size={12} className="arrow" />
        </a>
      </div>
    </article>
  );
}
