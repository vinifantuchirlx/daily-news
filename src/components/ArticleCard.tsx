import { useLocale, useTranslations } from "next-intl";
import type { RankedArticle } from "@/lib/types";

export default function ArticleCard({ article }: { article: RankedArticle }) {
  const locale = useLocale();
  const t = useTranslations("edition");
  const tCat = useTranslations("category");

  const summary = locale === "pt-BR" ? article.summaryPtBr : article.summaryEn;
  const why = locale === "pt-BR" ? article.whyItMattersPtBr : article.whyItMattersEn;

  const published = new Date(article.publishedAt).toLocaleString(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <article className="rounded-2xl border bg-[var(--color-surface)] p-5 hover:bg-[var(--color-surface-2)]/60 transition">
      <div className="flex items-start gap-4">
        <div className="shrink-0 w-10 h-10 rounded-full grid place-items-center bg-[var(--color-surface-2)] text-[var(--color-accent)] font-mono text-sm">
          {t("rank", { rank: article.rank })}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted)]">
            <span className="rounded-full border px-2 py-0.5 text-[var(--color-accent)] border-[var(--color-accent)]/40">
              {tCat(article.category)}
            </span>
            <span>{article.source}</span>
            <span>·</span>
            <span>{t("publishedAt", { date: published })}</span>
          </div>

          <h3 className="mt-2 text-lg font-semibold leading-snug">
            <a
              href={article.url}
              target="_blank"
              rel="noreferrer noopener"
              className="hover:text-[var(--color-accent)]"
            >
              {article.title}
            </a>
          </h3>

          <p className="mt-2 text-sm text-[var(--color-fg)]/90">{summary}</p>

          <div className="mt-3 rounded-lg bg-[var(--color-surface-2)] p-3">
            <p className="text-[11px] uppercase tracking-wider text-[var(--color-muted)]">
              {t("whyItMatters")}
            </p>
            <p className="text-sm mt-1">{why}</p>
          </div>

          <a
            href={article.url}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-block mt-3 text-sm text-[var(--color-accent)] hover:underline"
          >
            {t("readMore")}
          </a>
        </div>
      </div>
    </article>
  );
}
