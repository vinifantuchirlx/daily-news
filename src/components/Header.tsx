"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { Link } from "@/i18n/navigation";
import LocaleSwitcher from "./LocaleSwitcher";
import ThemeToggle from "./ThemeToggle";
import CompileButton from "./CompileButton";

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
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="group inline-flex items-baseline gap-2">
          <h1 className="font-display text-xl sm:text-2xl tracking-tight font-medium text-[var(--fg)]">
            {t("title")}
          </h1>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <CompileButton variant="icon" />
          <ThemeToggle />
          <LocaleSwitcher />
          <button
            onClick={onLogout}
            disabled={signingOut}
            aria-label={tNav("logout")}
            title={tNav("logout")}
            className="grid place-items-center w-9 h-9 rounded-full border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors disabled:opacity-60"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
