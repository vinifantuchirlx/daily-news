"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales } from "@/i18n/config";

export default function LocaleSwitcher() {
  const t = useTranslations("locale");
  const current = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  function pick(next: (typeof locales)[number]) {
    if (next === current) return;
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex items-center bg-[var(--surface-2)] border border-[var(--border)] rounded-full p-0.5 text-xs font-sans font-semibold"
    >
      {locales.map((l) => {
        const active = l === current;
        return (
          <button
            key={l}
            type="button"
            onClick={() => pick(l)}
            disabled={pending}
            aria-pressed={active}
            className={`px-3 h-7 rounded-full transition-colors ${
              active
                ? "bg-[var(--fg)] text-[var(--bg)]"
                : "text-[var(--muted)] hover:text-[var(--fg)]"
            }`}
          >
            {t(l)}
          </button>
        );
      })}
    </div>
  );
}
