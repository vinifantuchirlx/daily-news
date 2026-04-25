import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import Dateline from "@/components/Dateline";
import HeroStory from "@/components/HeroStory";
import SplitStory from "@/components/SplitStory";
import ListRow from "@/components/ListRow";
import StatsFooter from "@/components/StatsFooter";
import { getEdition, listEditionDates } from "@/lib/storage";

export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function EditionPage({
  params,
}: {
  params: Promise<{ locale: string; date: string }>;
}) {
  const { locale, date } = await params;
  setRequestLocale(locale);

  if (!DATE_RE.test(date)) notFound();

  const [edition, dates] = await Promise.all([
    getEdition(date),
    listEditionDates(60),
  ]);
  if (!edition) notFound();

  const t = await getTranslations("edition");

  const sorted = [...dates].sort();
  const issueNumber = sorted.indexOf(date) + 1 || undefined;

  const lead = edition.articles[0];
  const splits = edition.articles.slice(1, 3);
  const rest = edition.articles.slice(3);

  return (
    <div className="min-h-dvh">
      <Header />
      <main className="mx-auto max-w-7xl px-4 sm:px-8 py-10 sm:py-14 space-y-14">
        <section className="space-y-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-sans font-semibold uppercase tracking-[0.12em] text-[var(--muted)] hover:text-[var(--fg)]"
          >
            <ArrowLeft size={12} /> {t("backToDashboard")}
          </Link>
          <Dateline date={date} issueNumber={issueNumber} eyebrow={null} />
          {lead && <HeroStory article={lead} />}
        </section>

        {splits.length > 0 && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {splits.map((a) => (
              <SplitStory key={a.id} article={a} />
            ))}
          </section>
        )}

        {rest.length > 0 && (
          <section>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-6 sm:px-8">
              {rest.map((a) => (
                <ListRow key={a.id} article={a} />
              ))}
            </div>
          </section>
        )}

        <section className="border-t border-[var(--border)] pt-6">
          <StatsFooter edition={edition} locale={locale} />
        </section>
      </main>
    </div>
  );
}
