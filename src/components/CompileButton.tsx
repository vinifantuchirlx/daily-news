"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { RotateCw, Loader2 } from "lucide-react";

interface Props {
  variant?: "icon" | "primary";
}

export default function CompileButton({ variant = "icon" }: Props) {
  const t = useTranslations("dashboard");
  const tNav = useTranslations("nav");
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

  if (variant === "icon") {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={onClick}
          disabled={running}
          aria-label={tNav("compileTooltip")}
          title={tNav("compileTooltip")}
          className="grid place-items-center w-9 h-9 rounded-full border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors disabled:opacity-60"
        >
          {running ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <RotateCw size={16} />
          )}
        </button>
        {error && <span className="text-xs text-rose-500">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        onClick={onClick}
        disabled={running}
        className="inline-flex items-center gap-2 rounded-full bg-[var(--fg)] text-[var(--bg)] font-sans font-semibold text-sm px-5 py-2.5 disabled:opacity-60 hover:opacity-90 transition-opacity"
      >
        {running ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <RotateCw size={14} />
        )}
        {running ? t("running") : t("triggerNow")}
      </button>
      {error && <p className="text-sm text-rose-500">{error}</p>}
    </div>
  );
}
