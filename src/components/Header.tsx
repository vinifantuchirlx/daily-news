"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import LocaleSwitcher from "./LocaleSwitcher";

export default function Header() {
  const t = useTranslations("app");
  const tNav = useTranslations("nav");
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function onLogout() {
    setSigningOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-[var(--color-border)]">
      <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-xs text-[var(--color-muted)]">{t("tagline")}</p>
        </div>
        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          <button
            onClick={onLogout}
            disabled={signingOut}
            className="text-sm px-3 py-1 rounded-md border hover:bg-[var(--color-surface-2)] disabled:opacity-60"
          >
            {tNav("logout")}
          </button>
        </div>
      </div>
    </header>
  );
}
