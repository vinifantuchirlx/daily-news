import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import ArticleCard from "@/components/ArticleCard";
import CompileButton from "@/components/CompileButton";
import { getEdition, listEditionDates } from "@/lib/storage";
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
  const tEdition = await getTranslations("edition");

  const today = todayInSaoPauloIso();
  const [todayEdition, dates] = await Promise.all([
    getEdition(today),
    listEditionDates(30),
  ]);

  const history = dates.filter((d) => d !== today);

  return (
    <div className="min-h-dvh">
      <Header />
      <main className="mx-auto max-w-4xl px-6 py-8 space-y-10">
        <section>
          <div className="flex items-end justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                {t("todayHeading")}{" "}
                <span className="text-[var(--color-muted)] text-base font-normal">
                  · {today}
                </span>
              </h2>
              {todayEdition && (
                <p className="text-xs text-[var(--color-muted)] mt-1">
                  {tEdition("generatedAt", {
                    date: new Date(todayEdition.generatedAt).toLocaleString(locale, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }),
                  })}
                </p>
              )}
            </div>
            <CompileButton />
          </div>

          {todayEdition ? (
            <div className="mt-6 space-y-3">
              {todayEdition.articles.map((a) => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed p-8 text-center">
              <p className="font-medium">{t("noEditionYet")}</p>
              <p className="text-sm text-[var(--color-muted)] mt-1">
                {t("noEditionHint")}
              </p>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xl font-semibold tracking-tight">
            {t("historyHeading")}
          </h2>
          {history.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--color-muted)]">
              {t("noHistory")}
            </p>
          ) : (
            <ul className="mt-4 grid sm:grid-cols-2 gap-3">
              {history.map((date) => (
                <li key={date}>
                  <Link
                    href={`/editions/${date}`}
                    className="block rounded-xl border p-4 hover:bg-[var(--color-surface-2)]/60"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm">{date}</span>
                      <span className="text-xs text-[var(--color-accent)]">
                        {t("viewEdition")} →
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
