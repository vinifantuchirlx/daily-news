"use client";

import { useLocale, useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";
import { CATEGORY_VAR } from "@/lib/category";
import type { RankedArticle } from "@/lib/types";
import CategoryChip from "./CategoryChip";

export default function HeroStory({ article }: { article: RankedArticle }) {
  const locale = useLocale();
  const t = useTranslations("edition");
  const summary = locale === "pt-BR" ? article.summaryPtBr : article.summaryEn;
  const why = locale === "pt-BR" ? article.whyItMattersPtBr : article.whyItMattersEn;
  const color = CATEGORY_VAR[article.category];

  const published = new Date(article.publishedAt).toLocaleString(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <article className="fade-up bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 sm:p-12">
      <CategoryChip category={article.category} rank={article.rank} />

      <h2 className="font-display mt-5 text-[clamp(2.25rem,5vw,4rem)] leading-[1.05] tracking-tight font-medium">
        <a
          href={article.url}
          target="_blank"
          rel="noreferrer noopener"
          className="hover:underline decoration-[var(--fg)]/20 underline-offset-[6px]"
        >
          {article.title}
        </a>
      </h2>

      <p className="font-serif mt-6 text-lg sm:text-xl leading-relaxed text-[var(--fg)]/85 max-w-3xl">
        {summary}
      </p>

      <blockquote
        className="pull-quote mt-8 max-w-3xl text-base sm:text-lg leading-relaxed text-[var(--fg)]/90"
        style={{ color }}
      >
        <span className="eyebrow not-italic mr-2" style={{ color }}>
          {t("whyItMatters")}
        </span>
        <span className="text-[var(--fg)]/85">{why}</span>
      </blockquote>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--muted)]">
        <span className="font-sans">
          {article.source} · {t("publishedAt", { date: published })}
        </span>
        <a
          href={article.url}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1.5 font-sans font-medium text-[var(--fg)] hover:opacity-80"
        >
          {t("readMore")} <ArrowUpRight size={14} className="arrow" />
        </a>
      </div>
    </article>
  );
}
