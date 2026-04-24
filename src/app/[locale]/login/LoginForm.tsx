"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";

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
    <form
      onSubmit={onSubmit}
      className="w-full max-w-sm rounded-2xl border p-8 bg-[var(--color-surface)]/70 backdrop-blur"
    >
      <h1 className="text-2xl font-semibold tracking-tight">{tApp("title")}</h1>
      <p className="text-sm text-[var(--color-muted)] mt-1">{t("subtitle")}</p>

      <label className="block mt-6 text-sm">
        {t("passwordLabel")}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-2 w-full rounded-lg border bg-[var(--color-surface-2)] px-3 py-2 outline-none focus:border-[var(--color-accent)]"
          autoFocus
          required
        />
      </label>

      {error && (
        <p className="mt-3 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-lg bg-[var(--color-accent)] text-[var(--color-accent-fg)] font-medium py-2.5 disabled:opacity-60"
      >
        {loading ? t("loading") : t("submit")}
      </button>
    </form>
  );
}
