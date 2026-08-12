# AGENTS.md

Root-level instructions for AI agents working in this repository. Nested `AGENTS.md` files under `server/` and `src/` add scope-specific rules and take precedence within their directories.

## Operational Commands

Package manager is **Bun**, pinned via `bun.lock`. Do not use `npm`, `yarn`, or `pnpm` — mixing lockfiles will desync dependency resolution.

```bash
bun install          # install dependencies
bun run dev          # runs API server + Vite frontend concurrently (required for full app)
bun run server       # API server only (Bun --watch on server/index.ts), port 3002
bun run build        # tsc -b && vite build
bun run lint         # eslint .
bun test             # vitest run (single pass)
bun run test:watch   # vitest watch mode
```

The frontend dev server proxies `/api/*` to `http://localhost:3002` (`vite.config.ts:9-14`). Running `vite` alone without the API server means every `/api/generate` call fails — always use `bun run dev` unless intentionally testing frontend-only.

## Golden Rules

- **Client-supplied API key always wins over the server's `.env` key.** `resolveApiKey` returns `clientKey || ENV_KEYS[provider] || null` (`server/index.ts:64-66`). Never change this precedence to prefer the env key — the UI is built around "override the server key" as a deliberate feature (`src/App.tsx:105`, `.env` key is presented as a fallback default).
- **Never expose raw API keys to the client.** `/api/config` returns only booleans (`!!ENV_KEYS.anthropic`), not the key values (`server/index.ts:147-157`). Any new config endpoint must follow the same boolean-presence pattern, not return secret values.
- **AI-generated component code must stay plain JavaScript with no imports.** The system prompt explicitly forbids TypeScript syntax and import statements (`server/index.ts:7-20`) because `react-live`'s `LiveProvider noInline` (`src/components/LivePreview.tsx:14`) transpiles with Babel standalone in the browser and cannot resolve modules or strip TS types. If you touch `SYSTEM_PROMPT`, preserve these constraints or previews will silently render `LiveError` instead of the component.
- **Two independent safeguards clean AI output before it reaches the live renderer**: `stripCodeFences` then `ensureRenderCall`, chained as `ensureRenderCall(stripCodeFences(text))` (`server/index.ts:188`). Removing either reintroduces a real failure mode — some models wrap code in markdown fences, others omit the trailing `render(...)` call. Keep both, and add new normalization steps as their own pure function rather than folding logic into one giant regex.
- **Google and Anthropic are not symmetric.** `callGoogle` retries across `GOOGLE_MODELS` via `withModelFallback` (`server/index.ts:5, 134-136`, `server/fallback.ts`); `callAnthropic` calls a single fixed model with no retry (`server/index.ts:68-96`). This is an intentional, existing asymmetry — don't "fix" it by adding fallback to Anthropic or removing it from Google unless the user asks for that specific change.
- **New server logic belongs in pure, tested functions**, following the existing split: `server/generator.ts` and `server/fallback.ts` hold side-effect-free logic and have matching `*.test.ts` files; `server/index.ts` (the `Bun.serve` handler) has none. Extract new logic the same way instead of growing untested branches inside the request handler.

## Project Context

프롬프트를 입력하면 AI(Anthropic Claude 또는 Google Gemini)가 React 컴포넌트를 생성하고, `react-live`로 즉시 렌더링해 보여주는 도구. 자세한 소개와 실행 방법은 `README.md` 참고.

**Tech Stack:** React 19, TypeScript, Vite, Bun (API proxy server), react-live, Vitest + Testing Library, ESLint (typescript-eslint, react-hooks, react-refresh).

## Standards & References

- Coding conventions: see `eslint.config.js` (flat config, `js.configs.recommended` + `tseslint.recommended` + react-hooks/react-refresh rules). Run `bun run lint` before considering frontend/TS changes done.
- Git commit convention and workflow: use the `commit` skill (`.claude/skills/commit`) rather than free-form messages.
- **Maintenance Policy:** if you find code that contradicts a rule in this file (or a nested `AGENTS.md`), point out the discrepancy and propose an update rather than silently following stale guidance.

## Context Map

- **[API/서버 로직 수정](./server/AGENTS.md)** — `/api/generate`, `/api/config`, 프로바이더 폴백, AI 응답 정규화 작업 시.
- **[프론트엔드 컴포넌트/훅 수정](./src/AGENTS.md)** — React 컴포넌트, `react-live` 미리보기, 상태 관리 작업 시.
