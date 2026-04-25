import { getTranslations } from "next-intl/server";
import type { Edition } from "@/lib/types";

export default async function StatsFooter({
  edition,
  locale,
}: {
  edition: Edition;
  locale: string;
}) {
  const t = await getTranslations("edition");
  const compiled = new Date(edition.generatedAt).toLocaleString(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const tokensApprox = edition.stats.tokensUsedApprox
    ? Math.round(edition.stats.tokensUsedApprox / 1000)
    : 0;

  return (
    <p className="text-xs text-[var(--muted)] font-sans">
      {t("generatedAt", { date: compiled })} ·{" "}
      {t("stats", {
        sources: edition.stats.sourcesFetched,
        deduped: edition.stats.dedupedCount,
        tokens: tokensApprox,
      })}
    </p>
  );
}
