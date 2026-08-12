# AGENTS.md — src/

Vite + React 19 SPA. Single feature: submit a prompt, call the backend (`server/`) via `/api/generate`, render the returned code live with `react-live`. No router, no external state library — state lives in `useComponentGenerator` (`src/hooks/useComponentGenerator.ts`) and local `useState` in `App.tsx`.

## Tech Stack & Constraints

- Styling is plain CSS (`App.css`, `index.css`) — no CSS modules, no Tailwind, no styled-components in `package.json`. Add new styles as classes in the existing CSS files, not inline `style={{}}` (that pattern is reserved for AI-generated preview code, not this app's own UI).
- `react-live`'s `LiveProvider` runs with `noInline` (`src/components/LivePreview.tsx:14`), meaning the `code` string it receives is executed as a standalone script that must itself call `render(...)`. If you change how `code` is constructed or passed in, the string still needs to satisfy that contract (mirrors `server/AGENTS.md`'s note on `SYSTEM_PROMPT`).

## Implementation Patterns

- Data flow: `App.tsx` owns `apiKey`/`provider`/`envKeys` UI state → `useComponentGenerator().generate()` does the `fetch('/api/generate', ...)` and owns `components`/`isLoading`/`error` (`src/hooks/useComponentGenerator.ts:18-49`). New generation-related state belongs in the hook, not scattered into `App.tsx`.
- `ComponentCard` composes `LivePreview` (renders) and `CodeView` (shows source) behind a tab switch (`src/components/ComponentCard.tsx:54-74`) — the "refresh" button works by bumping a `previewKey` to remount `LivePreview` (`ComponentCard.tsx:17, 33, 70`), not by re-fetching.

## Testing Strategy

- `vitest run` with `jsdom` + Testing Library (`vite.config.ts:16-21`, `src/test/setup.ts`).
- Only `PromptInput.test.tsx` exists; `App.tsx`, `useComponentGenerator`, `LivePreview`, `ComponentCard`, `CodeView` are untested. Follow `PromptInput.test.tsx`'s render/user-event pattern when adding coverage for other components rather than introducing a new testing approach.

## Local Golden Rules

- **`envKeys` from `/api/config` is booleans only** (`src/App.tsx:17-20, 27`) — never plumb an actual key value through frontend state from that endpoint; see `server/AGENTS.md` for the corresponding server-side rule.
- **`GeneratedComponent.createdAt` is a real `Date`** (`src/types/index.ts:3-8`), formatted with `toLocaleTimeString('ko-KR', ...)` in `ComponentCard.tsx:18-21` — don't switch it to a string without updating that formatting call.
