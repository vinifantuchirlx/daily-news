# Daily AI News

> Agentic dashboard that compiles the 10 most relevant AI stories every day at 6 PM (São Paulo). An LLM ranks, dedupes, categorises, and writes bilingual editorial summaries. Read it like a magazine.

**Live:** [daily-news-ashy-three.vercel.app](https://daily-news-ashy-three.vercel.app)

## What it does

A daily cron at 18:00 (America/Sao_Paulo):

1. Fetches RSS feeds from 9 curated AI sources + the Hacker News Algolia API (~75 raw articles in a 36 h window)
2. Deterministically dedupes by URL and near-identical titles
3. Hands the candidates to **Claude Sonnet 4.6** via the **Vercel AI Gateway** with a Zod-typed schema; the model returns the 10 most consequential stories ranked, scored, categorised, and summarised in **English and Portuguese**
4. Persists the edition as JSON to a private Vercel Blob store
5. Renders an editorial dashboard — magazine layout, bilingual, light/dark, free to read

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 App Router (Turbopack) |
| Language | TypeScript |
| LLM | Vercel AI Gateway → `anthropic/claude-sonnet-4-6` (OIDC auto-injected) |
| Schema | Zod via the Vercel AI SDK `generateObject` |
| Storage | Vercel Blob (private access) |
| Auth (admin only) | JWT cookie via `jose`, single shared password |
| i18n | `next-intl` (`en`, `pt-BR`) |
| UI | Tailwind 4, Fraunces (display) + Source Serif 4 (body) + Inter (UI) |
| Cron | Vercel Cron (`vercel.json`) |
| Deploy | Vercel |

## Architecture

```
              ┌──────────────────────────────────┐
              │  Vercel Cron — 21:00 UTC daily   │
              └────────────────┬─────────────────┘
                               │ POST /api/cron/compile-news
                               ▼
   ┌─────────────────────────────────────────────────────────┐
   │  runDailyCompile()                                      │
   │   1. fetchAllSources(36h) ─ RSS + HN Algolia, parallel  │
   │   2. compileEdition() ─── Claude Sonnet via AI Gateway  │
   │   3. saveEdition() ──── @vercel/blob put (private)      │
   └─────────────────────────────────────────────────────────┘
                               │
                               ▼
                     ┌────────────────────┐
                     │ Vercel Blob (JSON) │
                     └─────────┬──────────┘
                               │
                ┌──────────────┴──────────────┐
                ▼                             ▼
   ┌──────────────────────┐    ┌──────────────────────────┐
   │ /[locale]            │    │ /[locale]/editions/[date]│
   │  Hero + Split + List │    │  Same layout, archived   │
   └──────────────────────┘    └──────────────────────────┘
```

## Layout grid

The dashboard is built as a 3-tier editorial composition:

- **Hero** — story #1, full-width Fraunces title, 3-line lead summary, italic "why it matters" pull-quote with a category-coloured rule
- **Split** — stories #2 and #3, side-by-side on a 2-column grid
- **List** — stories #4–10 as compact rows; click a row to expand the summary and pull-quote

Below the fold: stats footer (compile time, sources, dedupe count, token usage) and a 4-column grid of the past 8 editions, each card showing its lead headline.

## Local development

```bash
npm install
vercel link              # link to the Vercel project (one-off)
vercel env pull .env.local

# Add a dashboard password (so you can log in locally)
echo "DASHBOARD_PASSWORD=anything-you-like" >> .env.local

npm run dev              # http://localhost:3000
npm run compile:local    # one-off pipeline run, prints top 10
```

The pipeline runs against the live Blob store using the OIDC token from `vercel env pull` — no manual API keys needed for the LLM (Gateway routes via OIDC) or storage.

## Repo layout

```
src/
├── app/
│   ├── [locale]/                  # i18n-prefixed pages
│   │   ├── page.tsx               # dashboard (today + history grid)
│   │   ├── editions/[date]/       # archived editions
│   │   └── login/                 # admin sign-in
│   ├── api/
│   │   ├── auth/{login,logout}/   # session cookie management
│   │   └── cron/compile-news/     # cron + manual trigger
│   ├── globals.css                # tokens (light/dark CSS vars), typography
│   └── proxy.ts                   # i18n middleware (Next.js 16 convention)
├── components/                    # Header, HeroStory, SplitStory, ListRow…
├── i18n/                          # next-intl config + navigation helpers
└── lib/
    ├── agent.ts                   # LLM call (Zod schema + system prompt)
    ├── compile.ts                 # runDailyCompile() orchestrator
    ├── sources/                   # RSS + HN fetchers
    ├── storage.ts                 # Blob read/write with FS fallback
    └── auth.ts                    # JWT session + password verify
messages/                          # next-intl translations (en, pt-BR)
scripts/                           # local dev utilities
```

## Notes

- **No vendor lock-in for the LLM.** Switching to `openai/gpt-5.5` is `AI_MODEL=openai/gpt-5.5` — the AI Gateway resolves the provider; no SDK swap, no code change.
- **Anthropic schema portability.** The Zod schema deliberately omits `.length()` / `.int()` / `.min/.max` constraints so the same code works against Anthropic's native structured-output endpoint as a fallback. The 10-selection invariant is enforced by the system prompt + a runtime check in `agent.ts`.
- **Storage fallback.** Without `BLOB_READ_WRITE_TOKEN`, `storage.ts` writes to `data/local/editions/` so `npm run compile:local` works offline before linking the project to Vercel.
- **Public reads, private compile.** All page routes are public; the compile endpoint and admin actions require either the `CRON_SECRET` bearer (Vercel cron) or a signed-in session cookie.

## License

MIT
