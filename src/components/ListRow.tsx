"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { CATEGORY_VAR } from "@/lib/category";
import type { RankedArticle } from "@/lib/types";

export default function ListRow({ article }: { article: RankedArticle }) {
  const locale = useLocale();
  const t = useTranslations("edition");
  const tCat = useTranslations("category");
  const [open, setOpen] = useState(false);

  const summary = locale === "pt-BR" ? article.summaryPtBr : article.summaryEn;
  const why = locale === "pt-BR" ? article.whyItMattersPtBr : article.whyItMattersEn;
  const color = CATEGORY_VAR[article.category];

  return (
    <article className="border-b border-[var(--border)] last:border-b-0 group">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left py-5 grid grid-cols-[3rem_auto_1fr_auto] sm:grid-cols-[3rem_8rem_1fr_auto] items-center gap-4 hover:bg-[var(--surface-2)]/40 transition-colors px-2 -mx-2 rounded"
        aria-expanded={open}
      >
        <span className="font-mono text-sm text-[var(--muted)]">
          {article.rank.toString().padStart(2, "0")}
        </span>
        <span
          className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-sans font-semibold uppercase tracking-[0.12em]"
          style={{ color }}
        >
          <span className="cat-dot" />
          {tCat(article.category)}
        </span>
        <h3 className="font-display text-[1.0625rem] sm:text-[1.1875rem] leading-snug tracking-tight font-medium text-[var(--fg)]">
          {article.title}
        </h3>
        <span className="flex items-center gap-3 text-xs text-[var(--muted)]">
          <span className="hidden md:inline font-sans">{article.source}</span>
          <ChevronDown
            size={16}
            className={`transition-transform ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {open && (
        <div className="fade-up pb-6 pl-[3.75rem] pr-2 grid gap-4 sm:grid-cols-[1fr_auto] items-end">
          <div className="space-y-3">
            <p className="font-serif text-[15px] leading-relaxed text-[var(--fg)]/85 max-w-3xl">
              {summary}
            </p>
            <blockquote
              className="pull-quote text-[14px] leading-relaxed max-w-3xl"
              style={{ color }}
            >
              <span className="eyebrow not-italic mr-2" style={{ color }}>
                {t("whyItMatters")}
              </span>
              <span className="text-[var(--fg)]/80">{why}</span>
            </blockquote>
          </div>
          <a
            href={article.url}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 text-sm font-sans font-medium text-[var(--fg)] hover:opacity-80 self-start"
          >
            {t("readMore")} <ArrowUpRight size={14} className="arrow" />
          </a>
        </div>
      )}
    </article>
  );
}
