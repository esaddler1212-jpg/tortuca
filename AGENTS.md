# Tortuca

A small single-page web app (the "Turtle Pond") built with **Vite + React + TypeScript**. There is one service: the frontend dev server. There is no backend/database — state persists to the browser's `localStorage`.

## Commands

Standard scripts are defined in `package.json`:

- `npm run dev` — start the Vite dev server (http://localhost:5173).
- `npm run build` — type-check (`tsc -b`) and produce a production build in `dist/`.
- `npm run preview` — serve the production build locally.
- `npm run lint` — run ESLint (flat config in `eslint.config.js`).
- `npm test` — run the Vitest suite once (`vitest run`). `npm run test:watch` for watch mode.

## Cursor Cloud specific instructions

- Dependencies (`npm install`) are installed by the startup update script; you normally do not need to reinstall.
- The dev server binds to `0.0.0.0:5173` (`server.host: true` in `vite.config.ts`), so it is reachable from the Desktop/browser at `http://localhost:5173/`. Run it as a long-lived process (e.g. a tmux session), not a blocking foreground call.
- Tests run in `jsdom` (configured in `vite.config.ts`); `src/test/setup.ts` wires up `@testing-library/jest-dom`. No display/server is needed to run `npm test`.
- Core app logic lives in `src/lib/pond.ts` (pure, unit-tested functions). Keep validation/state logic there rather than in the React component so it stays testable.
- Gotcha: do not throw inside a `setState` functional updater — React defers the updater to render time, so the throw escapes any surrounding `try/catch` in the event handler. Compute results (e.g. `addTurtle(...)`) synchronously in the handler, then pass the value to `setState`.
- TypeScript needs `src/vite-env.d.ts` (`/// <reference types="vite/client" />`) for side-effect CSS imports to type-check; without it `npm run build` fails with TS2882.
