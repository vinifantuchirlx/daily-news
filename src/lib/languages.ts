/**
 * Languages offered in the live-subtitles screen.
 *
 * `speech` is the BCP-47 tag the Web Speech API expects for recognition;
 * `translate` is the shorter code Google Translate uses.
 */
export type SubtitleLanguage = {
  /** Google Translate code, e.g. "pt". */
  translate: string;
  /** Web Speech API recognition tag, e.g. "pt-BR". */
  speech: string;
  /** Native, human-readable label. */
  label: string;
};

export const languages: SubtitleLanguage[] = [
  { translate: "en", speech: "en-US", label: "English" },
  { translate: "pt", speech: "pt-BR", label: "Português (Brasil)" },
  { translate: "es", speech: "es-ES", label: "Español" },
  { translate: "fr", speech: "fr-FR", label: "Français" },
  { translate: "de", speech: "de-DE", label: "Deutsch" },
  { translate: "it", speech: "it-IT", label: "Italiano" },
  { translate: "ja", speech: "ja-JP", label: "日本語" },
  { translate: "ko", speech: "ko-KR", label: "한국어" },
  { translate: "zh-CN", speech: "zh-CN", label: "中文 (简体)" },
  { translate: "ru", speech: "ru-RU", label: "Русский" },
];

export function findBySpeech(tag: string): SubtitleLanguage | undefined {
  return languages.find((l) => l.speech === tag);
}
