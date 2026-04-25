"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function SignOutButton() {
  const tNav = useTranslations("nav");
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <button
      onClick={onClick}
      disabled={pending}
      aria-label={tNav("logout")}
      title={tNav("logout")}
      className="grid place-items-center w-9 h-9 rounded-full border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors disabled:opacity-60"
    >
      <LogOut size={16} />
    </button>
  );
}
