import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { LogIn, Captions } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { sessionCookie, verifySessionToken } from "@/lib/auth";
import LocaleSwitcher from "./LocaleSwitcher";
import ThemeToggle from "./ThemeToggle";
import CompileButton from "./CompileButton";
import SignOutButton from "./SignOutButton";

async function isAuthenticated(): Promise<boolean> {
  const token = (await cookies()).get(sessionCookie.name)?.value;
  if (!token) return false;
  return verifySessionToken(token);
}

export default async function Header() {
  const t = await getTranslations("app");
  const tNav = await getTranslations("nav");
  const tSub = await getTranslations("subtitles");
  const authed = await isAuthenticated();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="group inline-flex items-baseline gap-2">
          <h1 className="font-display text-xl sm:text-2xl tracking-tight font-medium text-[var(--fg)]">
            {t("title")}
          </h1>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/subtitles"
            aria-label={tSub("navTitle")}
            title={tSub("navTitle")}
            className="grid place-items-center w-9 h-9 rounded-full border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors"
          >
            <Captions size={16} />
          </Link>
          {authed && <CompileButton variant="icon" />}
          <ThemeToggle />
          <LocaleSwitcher />
          {authed ? (
            <SignOutButton />
          ) : (
            <Link
              href="/login"
              aria-label={tNav("signIn")}
              title={tNav("signIn")}
              className="grid place-items-center w-9 h-9 rounded-full border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors"
            >
              <LogIn size={16} />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
