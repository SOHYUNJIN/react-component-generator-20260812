# AGENTS.md — server/

Bun API proxy server (`Bun.serve`, port 3002) that fronts the Anthropic and Google Gemini APIs for the frontend. Started via `bun run server` (or bundled into `bun run dev`); the Vite dev server proxies `/api/*` here (`vite.config.ts:9-14`).

## Tech Stack & Constraints

- Runtime is `Bun.serve` directly — no Express/Fastify/Hono. Keep new routes as additional `if (req.method === ... && url.pathname === ...)` branches in `server/index.ts` (`server/index.ts:140-219`), matching the existing style.
- No provider SDKs are installed (`package.json` has no `@anthropic-ai/sdk` or `@google/generative-ai`). Both `callAnthropic` and `callGoogleModel` hit the REST endpoints directly with `fetch` (`server/index.ts:68-96`, `98-132`). Don't add an SDK dependency without checking with the user first — the raw-fetch approach is deliberate and keeps the server dependency-free.
- CORS is wide open (`Access-Control-Allow-Origin: '*'`, `server/index.ts:51-55`) since this is a local dev proxy, not a public API — don't tighten or loosen this without understanding the deployment model first.

## Implementation Patterns

- Adding a third provider: add a `Provider` union member (`server/index.ts:57`), an `ENV_KEYS` entry (`server/index.ts:59-62`), a `callX` function, and a branch in the `/api/generate` handler (`server/index.ts:183-186`) — mirror the Google or Anthropic shape depending on whether the new provider needs multi-model fallback.
- Text normalization on AI output is a two-step pure-function pipeline: `stripCodeFences` → `ensureRenderCall` (`server/generator.ts`), composed at the call site (`server/index.ts:188`). Add new normalization as another small pure function in `generator.ts`, not inline regex in `index.ts`.
- Model-list retry logic lives in `withModelFallback` (`server/fallback.ts`) — a generic `(models, attempt)` helper. Reuse it for any provider that should retry across multiple models rather than writing a bespoke loop.

## Testing Strategy

- `bun test` / `vitest run` picks up `server/**/*.test.ts` (`vite.config.ts:20`).
- `generator.test.ts` and `fallback.test.ts` test the pure functions directly with no mocking of `Bun.serve` or network calls — keep server-side logic testable by extracting it out of `index.ts` the same way, rather than testing the HTTP handler itself.

## Local Golden Rules

- **Don't move API key resolution logic out of `resolveApiKey`.** `clientKey || ENV_KEYS[provider] || null` (`server/index.ts:64-66`) is the single place client-override-over-env precedence is decided; duplicating this check elsewhere risks the two paths drifting out of sync.
- **`/api/config` must never return the key itself** — only `!!ENV_KEYS[provider]` booleans (`server/index.ts:147-157`). This is the client's only visibility into whether a server-side key exists.
- **Anthropic has no model fallback, Google does** (`server/index.ts:68-96` vs `5, 134-136`) — this is intentional and existing, not a gap to close silently.
