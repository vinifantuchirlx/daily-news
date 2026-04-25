import { cookies } from "next/headers";
import { setRequestLocale, getTranslations } from "next-intl/server";
import Header from "@/components/Header";
import Dateline from "@/components/Dateline";
import HeroStory from "@/components/HeroStory";
import SplitStory from "@/components/SplitStory";
import ListRow from "@/components/ListRow";
import StatsFooter from "@/components/StatsFooter";
import HistoryGrid from "@/components/HistoryGrid";
import CompileButton from "@/components/CompileButton";
import { getEdition, listEditionDates } from "@/lib/storage";
import { sessionCookie, verifySessionToken } from "@/lib/auth";
import { todayInSaoPauloIso } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("dashboard");

  const today = todayInSaoPauloIso();
  const sessionToken = (await cookies()).get(sessionCookie.name)?.value;
  const isAdmin = sessionToken ? await verifySessionToken(sessionToken) : false;
  const [todayEdition, dates] = await Promise.all([
    getEdition(today),
    listEditionDates(30),
  ]);

  const history = dates.filter((d) => d !== today);
  const issueNumber = dates.includes(today) ? dates.length : dates.length + 1;

  const lead = todayEdition?.articles[0];
  const splits = todayEdition?.articles.slice(1, 3) ?? [];
  const rest = todayEdition?.articles.slice(3) ?? [];

  return (
    <div className="min-h-dvh">
      <Header />
      <main className="mx-auto max-w-7xl px-4 sm:px-8 py-10 sm:py-14 space-y-14">
        {todayEdition && lead ? (
          <>
            <section className="space-y-6">
              <Dateline date={today} issueNumber={issueNumber} />
              <HeroStory article={lead} />
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
                <div className="flex items-center gap-4 mb-2">
                  <p className="eyebrow">{t("theRest")}</p>
                  <span className="flex-1 h-px bg-[var(--border)]" />
                </div>
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-6 sm:px-8">
                  {rest.map((a) => (
                    <ListRow key={a.id} article={a} />
                  ))}
                </div>
              </section>
            )}

            <section className="border-t border-[var(--border)] pt-6">
              <StatsFooter edition={todayEdition} locale={locale} />
            </section>
          </>
        ) : (
          <section className="text-center py-16 sm:py-24 space-y-6">
            <Dateline date={today} />
            <h2 className="font-display text-4xl sm:text-5xl tracking-tight font-medium">
              {t("noEditionYet")}
            </h2>
            <p className="font-serif italic text-[var(--muted)] max-w-md mx-auto">
              {t("noEditionHint")}
            </p>
            {isAdmin && (
              <div className="flex justify-center pt-4">
                <CompileButton variant="primary" />
              </div>
            )}
          </section>
        )}

        <section className="space-y-5 pt-4">
          <div className="flex items-center gap-4">
            <p className="eyebrow">{t("historyHeading")}</p>
            <span className="flex-1 h-px bg-[var(--border)]" />
          </div>
          <HistoryGrid dates={history} locale={locale} />
        </section>
      </main>
    </div>
  );
}
