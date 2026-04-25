"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ArrowRight } from "lucide-react";

export default function LoginForm() {
  const t = useTranslations("login");
  const tApp = useTranslations("app");
  const router = useRouter();
  const params = useSearchParams();

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError(t("error"));
        setLoading(false);
        return;
      }
      const next = params.get("next") || "/";
      router.replace(next);
      router.refresh();
    } catch {
      setError(t("error"));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-md">
      <p className="eyebrow">{tApp("tagline").split(" — ")[0] || tApp("title")}</p>
      <h1 className="font-display text-5xl sm:text-6xl tracking-tight font-medium mt-3 leading-[1.05]">
        {tApp("title")}
      </h1>
      <p className="font-serif italic text-[var(--muted)] mt-4 text-lg max-w-sm">
        {t("subtitle")}
      </p>

      <label className="block mt-10">
        <span className="eyebrow">{t("passwordLabel")}</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-2 w-full bg-transparent border-b border-[var(--border)] focus:border-[var(--fg)] outline-none text-2xl font-display py-2 transition-colors"
          autoFocus
          required
        />
      </label>

      {error && (
        <p className="mt-3 text-sm text-rose-500" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !password}
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--fg)] text-[var(--bg)] font-sans font-semibold text-sm px-6 py-3 disabled:opacity-50 hover:opacity-90 transition-opacity"
      >
        {loading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <ArrowRight size={14} className="arrow" />
        )}
        {loading ? t("loading") : t("submit")}
      </button>
    </form>
  );
}
