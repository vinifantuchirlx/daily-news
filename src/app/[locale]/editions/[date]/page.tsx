import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import ArticleCard from "@/components/ArticleCard";
import { getEdition } from "@/lib/storage";

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

  const edition = await getEdition(date);
  if (!edition) notFound();

  const t = await getTranslations("edition");

  return (
    <div className="min-h-dvh">
      <Header />
      <main className="mx-auto max-w-4xl px-6 py-8 space-y-6">
        <div>
          <Link
            href="/"
            className="text-sm text-[var(--color-accent)] hover:underline"
          >
            {t("backToDashboard")}
          </Link>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">{date}</h2>
          <p className="text-xs text-[var(--color-muted)] mt-1">
            {t("generatedAt", {
              date: new Date(edition.generatedAt).toLocaleString(locale, {
                dateStyle: "medium",
                timeStyle: "short",
              }),
            })}
          </p>
        </div>

        <div className="space-y-3">
          {edition.articles.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      </main>
    </div>
  );
}
