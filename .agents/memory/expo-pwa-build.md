---
name: Expo PWA production build
description: How this Expo app is built and served as a production PWA (no dev tools, offline-capable)
---

## Rule
The mobile artifact uses `expo export --platform web` → `dist/`, served by a custom Node.js server. The workflow's development run command is set to `serve` (not `dev`) so users always see the production build.

**Why:** User wants no Expo Go, no Metro dev server, no developer menu — a real installable PWA.

## Key decisions

- `artifact.toml` `[services.development] run` = `pnpm --filter @workspace/mobile run serve` (NOT `run dev`)
- `artifact.toml` `BASE_PATH = "/"` (app served at root, not `/mobile/`)
- `scripts/build.js` runs `expo export --platform web`, copies `public/sw.js` + `public/manifest.json` (with `__BASE_PATH__` substitution), copies icons, patches `dist/index.html` with PWA tags
- `server/serve.js` serves `dist/` as SPA — all unmatched routes return `index.html` (no Metro, no Expo Go)
- **Base path caveat**: `BASE_PATH="/"` → empty string after `replace(/\/+$/, "")`. The index.html path rewriting only runs when basePath is non-empty, so absolute `/_expo/...` paths work fine at root.
- Service worker registered at `/sw.js` with scope `/`; fetches cached `_expo/` and `assets/` by cache-first strategy

## Timer background safety
`GameContext.tsx` already uses `Date.now() - timerStartedAt` for calculation (not pure setInterval). Added `visibilitychange` listener that forces a state update when the tab becomes visible, so the timer corrects itself instantly after minimize/tab-switch.

## Resume match modal
`app/index.tsx` no longer auto-redirects on stateLoaded. Instead shows a modal: "Resume Match" or "End Game" with a second confirm modal for the destructive End Game path.
