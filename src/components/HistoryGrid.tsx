import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getEdition } from "@/lib/storage";

interface Props {
  dates: string[];
  locale: string;
}

export default async function HistoryGrid({ dates, locale }: Props) {
  const t = await getTranslations("dashboard");

  if (dates.length === 0) {
    return (
      <p className="font-serif italic text-sm text-[var(--muted)]">{t("noHistory")}</p>
    );
  }

  const previews = await Promise.all(
    dates.slice(0, 8).map(async (d) => {
      const ed = await getEdition(d).catch(() => null);
      return { date: d, lead: ed?.articles?.[0] ?? null };
    }),
  );

  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {previews.map(({ date, lead }) => {
        const [y, m, day] = date.split("-").map(Number);
        const dt = new Date(Date.UTC(y, m - 1, day));
        const formatted = dt.toLocaleDateString(locale, {
          month: "short",
          day: "numeric",
        });
        const leadTitle = lead
          ? locale === "pt-BR"
            ? lead.title
            : lead.title
          : null;
        return (
          <li key={date}>
            <Link
              href={`/editions/${date}`}
              className="block bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 h-full hover:bg-[var(--surface-2)]/60 transition-colors"
            >
              <p className="eyebrow">{formatted}</p>
              {leadTitle ? (
                <p className="font-display mt-2 text-base leading-snug tracking-tight text-[var(--fg)] line-clamp-3">
                  {leadTitle}
                </p>
              ) : (
                <p className="font-serif italic mt-2 text-sm text-[var(--muted)]">
                  {date}
                </p>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
