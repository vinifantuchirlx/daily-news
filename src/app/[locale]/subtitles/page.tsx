import { setRequestLocale, getTranslations } from "next-intl/server";
import Header from "@/components/Header";
import SubtitleTranslator from "./SubtitleTranslator";

export default async function SubtitlesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("subtitles");

  return (
    <div className="min-h-dvh">
      <Header />
      <main className="mx-auto max-w-3xl px-4 sm:px-8 py-8 sm:py-12 space-y-8">
        <section className="text-center space-y-3">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h2 className="font-display text-3xl sm:text-4xl tracking-tight font-medium">
            {t("title")}
          </h2>
          <p className="font-serif italic text-[var(--muted)] max-w-md mx-auto">
            {t("subtitleText")}
          </p>
        </section>

        <SubtitleTranslator />
      </main>
    </div>
  );
}
