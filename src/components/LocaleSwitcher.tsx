"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales } from "@/i18n/config";

export default function LocaleSwitcher() {
  const t = useTranslations("locale");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as (typeof locales)[number];
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <select
      value={locale}
      onChange={onChange}
      className="bg-[var(--color-surface-2)] border rounded-md px-2 py-1 text-sm"
      aria-label="Language"
    >
      {locales.map((l) => (
        <option key={l} value={l}>
          {t(l)}
        </option>
      ))}
    </select>
  );
}
