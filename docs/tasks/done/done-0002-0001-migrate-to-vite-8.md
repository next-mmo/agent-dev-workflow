# Task 0002: Migrate Counter App to Vite 8

> **Status:** done  
> **Scrum Artifact:** completed increment  
> **PRD:** No product PRD change required; this is a build-tooling migration.  
> **Created:** 2026-09-01  
> **Completed:** 2026-09-01

## 1. Goal

Replace the dependency-free `dev-server.js` workflow with Vite 8 while
preserving the counter app's current browser behavior, URL entry point,
development port convention, unit tests, and static production output.

## 2. Implementation Checklist

- [x] Confirm the available Node.js version meets Vite 8 requirements and
      document the supported runtime for contributors and CI.
- [x] Add Vite 8 as a development dependency and commit the resulting lockfile.
- [x] Add `vite.config.js` using ESM syntax and `defineConfig`.
- [x] Configure the development server to preserve the current `5173` default
      and `PORT` override behavior, with `strictPort` enabled for predictable
      failures.
- [x] Add standard scripts: `dev` (`vite`), `build` (`vite build`), and
      `preview` (`vite preview`). Remove the unused `start` script rather than
      preserving an ambiguous server command.
- [x] Validate `index.html` as the Vite entry point and preserve the existing
      module and stylesheet references.
- [x] Add `public/favicon.svg` for the static favicon and verify Vite copies it
      to the production output.
- [x] Remove `dev-server.js` after the Vite server provided equivalent
      development behavior.
- [x] Add build-tool documentation covering install, development, build,
      preview, required Node.js versions, and the generated `dist/` directory.
- [x] Keep `npm test` passing without requiring a Vite runtime or browser-only
      globals.

## 3. Acceptance Criteria

- [x] `npm install` succeeds on a supported Node.js runtime and records Vite 8
      in the lockfile.
- [x] `npm run dev` starts the app at `http://localhost:5173` and honors the
      documented `PORT` override.
- [x] The browser loads the counter UI through Vite, with no console errors, and
      all existing increment, decrement, reset, step, persistence, theme, and
      keyboard interactions still work.
- [x] `npm run build` completes successfully and emits a deployable `dist/`
      directory with the HTML, JavaScript, CSS, and favicon assets.
- [x] `npm run preview` serves the production build and the app behaves the same
      as in development.
- [x] `npm test` passes.
- [x] No active script or documentation references the removed custom server.
- [x] Existing product acceptance criteria remain unchanged and continue to
      pass.

## 4. Verification Evidence

- Node.js: `v24.19.0`.
- Dependency install: `vite@8.0.0` installed successfully.
- Unit tests: `npm test` — 7 passed, 0 failed.
- Production build: `npm run build` — completed successfully and emitted
  `dist/index.html`, `dist/favicon.svg`, bundled CSS, and bundled JavaScript.
- Development server: `npm run dev` — served at `http://127.0.0.1:5173/`.
- Port overrides: `PORT=5175 npm run dev` served at `http://127.0.0.1:5175/`;
  `PREVIEW_PORT=4174 npm run preview` served at `http://127.0.0.1:4174/`.
- Browser smoke test through Vite development and preview servers: counter
  incremented by selected step, keyboard increment worked, decrement worked,
  reset worked, theme toggled, localStorage restored count/step/theme after
  reload, and console errors were 0 after adding the favicon.

## 5. Implementation Notes

- `vite.config.js` uses `strictPort: true` for both development and preview
  servers so occupied ports fail clearly instead of silently moving to another
  port.
- `vite preview` is documented for local verification only; production hosting
  should serve the generated `dist/` directory.
- The existing product PRD and master PRD index were intentionally left
  unchanged because the migration does not change state logic, UX interactions,
  keyboard shortcuts, or theme behavior.

## 6. References

- [Vite 8 announcement and migration notes](https://github.com/vitejs/vite/blob/v8.0.10/docs/blog/announcing-vite8.md)
- [Vite guide: index.html and standard scripts](https://github.com/vitejs/vite/blob/v8.0.10/docs/guide/index.md)
- [Vite configuration guide](https://github.com/vitejs/vite/blob/v8.0.10/docs/config/index.md)
- [Vite migration guide](https://github.com/vitejs/vite/blob/v8.0.10/docs/guide/migration.md)
