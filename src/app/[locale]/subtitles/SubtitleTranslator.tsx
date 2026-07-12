"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Mic, MicOff, ArrowRight, TriangleAlert } from "lucide-react";
import { languages, findBySpeech } from "@/lib/languages";

// Minimal typings for the Web Speech API, which ships without DOM lib types.
type SpeechRecognitionAlternative = { transcript: string };
type SpeechRecognitionResult = {
  0: SpeechRecognitionAlternative;
  isFinal: boolean;
};
type SpeechRecognitionEvent = {
  resultIndex: number;
  results: { length: number; [i: number]: SpeechRecognitionResult };
};
type SpeechRecognitionErrorEvent = { error: string };
interface SpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognition;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

type Line = { id: number; original: string; translated: string };

export default function SubtitleTranslator() {
  const t = useTranslations("subtitles");

  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [sourceSpeech, setSourceSpeech] = useState("en-US");
  const [targetTranslate, setTargetTranslate] = useState("pt");
  // Pause (ms) of silence before a buffered block is treated as complete.
  // 0 = translate every sentence on its own; higher = group into paragraphs.
  const [groupingMs, setGroupingMs] = useState(2500);
  const [lines, setLines] = useState<Line[]>([]);
  const [error, setError] = useState<string | null>(null);

  // We keep the recognizer and the latest language picks in refs so the
  // long-lived recognition callbacks always read current values.
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const listeningRef = useRef(false);
  const sourceRef = useRef(sourceSpeech);
  const targetRef = useRef(targetTranslate);
  const groupingRef = useRef(groupingMs);
  const idRef = useRef(0);
  const stageRef = useRef<HTMLDivElement | null>(null);
  // Sentences the recognizer has finalized but that we haven't flushed yet,
  // plus the debounce timer that decides when the paragraph is "done".
  const bufferRef = useRef<string[]>([]);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    sourceRef.current = sourceSpeech;
  }, [sourceSpeech]);
  useEffect(() => {
    targetRef.current = targetTranslate;
  }, [targetTranslate]);
  useEffect(() => {
    groupingRef.current = groupingMs;
  }, [groupingMs]);

  useEffect(() => {
    setSupported(getRecognitionCtor() !== null);
  }, []);

  // Auto-scroll so the newest subtitle stays in view.
  useEffect(() => {
    stageRef.current?.scrollTo({
      top: stageRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [lines]);

  const translateFinal = useCallback(async (original: string) => {
    const text = original.trim();
    if (!text) return;

    const sourceCode = findBySpeech(sourceRef.current)?.translate ?? "auto";
    // Reserve the slot immediately so sentences render in the order they were spoken.
    const id = ++idRef.current;
    setLines((prev) => [...prev, { id, original: text, translated: "" }]);

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          source: sourceCode,
          target: targetRef.current,
        }),
      });
      const data = (await res.json()) as { translated?: string; error?: string };
      if (!res.ok || !data.translated) throw new Error(data.error ?? "translate failed");
      setLines((prev) =>
        prev.map((l) => (l.id === id ? { ...l, translated: data.translated! } : l)),
      );
    } catch {
      setLines((prev) => prev.filter((l) => l.id !== id));
      setError(t("translateError"));
    }
  }, [t]);

  // Join every buffered sentence into one block and translate it as a whole,
  // so the on-screen subtitle is a full paragraph rather than a stream of
  // separate one-line phrases.
  const flushBuffer = useCallback(() => {
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    const text = bufferRef.current.join(" ").replace(/\s+/g, " ").trim();
    bufferRef.current = [];
    setCapturing(false);
    if (text) void translateFinal(text);
  }, [translateFinal]);

  const stop = useCallback(() => {
    listeningRef.current = false;
    setListening(false);
    recognitionRef.current?.stop();
    // Emit whatever was still buffered when the user stops.
    flushBuffer();
  }, [flushBuffer]);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setSupported(false);
      return;
    }
    setError(null);

    const recognition = new Ctor();
    recognition.lang = sourceRef.current;
    recognition.continuous = true;
    // interimResults stays OFF on purpose: we only ever act on a completed
    // sentence, so subtitles appear whole — never word-by-word as they're heard.
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          const piece = result[0].transcript.trim();
          if (!piece) continue;
          // Accumulate finalized sentences; only flush after a pause so a
          // continuous speech becomes one paragraph, not many fragments.
          bufferRef.current.push(piece);
          setCapturing(true);
          if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
          const gap = groupingRef.current;
          if (gap <= 0) {
            flushBuffer();
          } else {
            flushTimerRef.current = setTimeout(flushBuffer, gap);
          }
        }
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setError(t("micDenied"));
        stop();
      } else if (event.error === "no-speech" || event.error === "aborted") {
        // Transient — the onend handler will restart if we're still listening.
      } else {
        setError(t("recognitionError"));
      }
    };

    recognition.onend = () => {
      // Chrome ends recognition periodically; restart to keep a continuous session.
      if (listeningRef.current) {
        try {
          recognition.start();
        } catch {
          /* already starting */
        }
      }
    };

    recognitionRef.current = recognition;
    listeningRef.current = true;
    setListening(true);
    try {
      recognition.start();
    } catch {
      /* ignore double-start */
    }
  }, [stop, t, flushBuffer]);

  useEffect(() => {
    return () => {
      listeningRef.current = false;
      recognitionRef.current?.abort();
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    };
  }, []);

  // Restart the session when the source language changes mid-listen.
  function changeSource(next: string) {
    setSourceSpeech(next);
    sourceRef.current = next;
    // Drop any half-captured paragraph — it was spoken in the old language.
    if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    bufferRef.current = [];
    setCapturing(false);
    if (listeningRef.current) {
      recognitionRef.current?.abort();
      // onend won't fire cleanly after abort, so kick a fresh session.
      setTimeout(() => {
        if (listeningRef.current) start();
      }, 150);
    }
  }

  const latest = lines[lines.length - 1];

  return (
    <div className="flex flex-col gap-6">
      {/* Language controls */}
      <div className="flex items-center justify-center gap-3 flex-wrap text-sm">
        <label className="flex flex-col gap-1">
          <span className="eyebrow">{t("spoken")}</span>
          <select
            value={sourceSpeech}
            onChange={(e) => changeSource(e.target.value)}
            className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 h-10 font-sans"
          >
            {languages.map((l) => (
              <option key={l.speech} value={l.speech}>
                {l.label}
              </option>
            ))}
          </select>
        </label>

        <ArrowRight className="mt-5 text-[var(--muted)]" size={18} />

        <label className="flex flex-col gap-1">
          <span className="eyebrow">{t("subtitle")}</span>
          <select
            value={targetTranslate}
            onChange={(e) => setTargetTranslate(e.target.value)}
            className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 h-10 font-sans"
          >
            {languages.map((l) => (
              <option key={l.translate} value={l.translate}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Grouping control — how much speech to gather before showing a subtitle */}
      <div className="flex items-center justify-center gap-2 flex-wrap text-xs">
        <span className="eyebrow">{t("grouping")}</span>
        <div
          role="group"
          className="inline-flex items-center bg-[var(--surface-2)] border border-[var(--border)] rounded-full p-0.5 font-sans font-semibold"
        >
          {[
            { ms: 0, label: t("groupSentence") },
            { ms: 2500, label: t("groupParagraph") },
            { ms: 4500, label: t("groupLongParagraph") },
          ].map((opt) => {
            const active = groupingMs === opt.ms;
            return (
              <button
                key={opt.ms}
                type="button"
                onClick={() => setGroupingMs(opt.ms)}
                aria-pressed={active}
                className={`px-3 h-7 rounded-full transition-colors ${
                  active
                    ? "bg-[var(--fg)] text-[var(--bg)]"
                    : "text-[var(--muted)] hover:text-[var(--fg)]"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Subtitle stage — cinematic full-frame area */}
      <div
        ref={stageRef}
        className="relative bg-black text-white rounded-3xl border border-[var(--border)] overflow-y-auto min-h-[55dvh] max-h-[65dvh] flex flex-col justify-end px-5 sm:px-10 py-8"
      >
        {capturing && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 text-xs text-white/70 bg-white/10 rounded-full px-3 py-1 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            {t("capturing")}
          </div>
        )}
        {lines.length === 0 ? (
          <p className="text-center text-white/40 font-serif italic text-lg my-auto">
            {listening ? t("listeningHint") : t("idleHint")}
          </p>
        ) : (
          <div className="space-y-5">
            {lines.map((line) => {
              const isLatest = line.id === latest?.id;
              return (
                <div key={line.id} className={isLatest ? "fade-up" : "opacity-45"}>
                  <p
                    className={`font-display font-medium leading-tight text-center drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] ${
                      isLatest
                        ? "text-3xl sm:text-5xl text-white"
                        : "text-xl sm:text-2xl text-white/70"
                    }`}
                  >
                    {line.translated || (
                      <span className="inline-flex gap-1 items-center text-white/50">
                        <Dots />
                      </span>
                    )}
                  </p>
                  {isLatest && (
                    <p className="mt-2 text-center text-white/45 font-serif italic text-sm sm:text-base">
                      {line.original}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Errors */}
      {(error || !supported) && (
        <div className="flex items-start gap-2 text-sm text-[var(--cat-policy,#be123c)] justify-center text-center">
          <TriangleAlert size={16} className="mt-0.5 shrink-0" />
          <span>{supported ? error : t("unsupported")}</span>
        </div>
      )}

      {/* Mic control */}
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={listening ? stop : start}
          disabled={!supported}
          className={`grid place-items-center w-20 h-20 rounded-full transition-all disabled:opacity-40 ${
            listening
              ? "bg-[var(--cat-policy,#be123c)] text-white animate-pulse"
              : "bg-[var(--accent)] text-[var(--accent-fg)] hover:scale-105"
          }`}
          aria-label={listening ? t("stop") : t("start")}
        >
          {listening ? <MicOff size={30} /> : <Mic size={30} />}
        </button>
        <span className="eyebrow">{listening ? t("stop") : t("start")}</span>
      </div>
    </div>
  );
}

function Dots() {
  return (
    <span className="inline-flex gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-white/60 animate-bounce"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </span>
  );
}
