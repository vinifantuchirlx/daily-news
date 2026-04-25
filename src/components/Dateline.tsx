import { getTranslations } from "next-intl/server";

interface DatelineProps {
  date: string;
  issueNumber?: number;
  /** Pass `null` to omit the eyebrow entirely; omit/undefined uses the default "Today's briefing". */
  eyebrow?: string | null;
}

export default async function Dateline({ date, issueNumber, eyebrow }: DatelineProps) {
  const t = await getTranslations("app");
  const tD = await getTranslations("dashboard");

  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const weekday = t(`weekday.${dt.getUTCDay()}`);
  const month = t(`month.${dt.getUTCMonth()}`);
  const day = dt.getUTCDate();
  const year = dt.getUTCFullYear();

  const parts: string[] = [];
  if (eyebrow !== null) parts.push(eyebrow ?? tD("todayEyebrow"));
  parts.push(`${weekday}, ${month} ${day}, ${year}`);
  if (issueNumber) parts.push(`${tD("issueLabel")} ${String(issueNumber).padStart(3, "0")}`);

  return <p className="eyebrow">{parts.join("  ·  ")}</p>;
}
