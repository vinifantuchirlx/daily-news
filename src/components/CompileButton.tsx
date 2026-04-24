"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CompileButton() {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/cron/compile-news", { method: "POST" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? `HTTP ${res.status}`);
      } else {
        router.refresh();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        onClick={onClick}
        disabled={running}
        className="rounded-lg bg-[var(--color-accent)] text-[var(--color-accent-fg)] font-medium px-4 py-2 disabled:opacity-60"
      >
        {running ? t("running") : t("triggerNow")}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
