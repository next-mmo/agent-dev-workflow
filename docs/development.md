# Development Guide

## Prerequisites

- Node.js `^20.19.0 || >=22.12.0`
- npm

Vite 8 is installed as a local development dependency. Run `node --version` before installing dependencies when setting up a new environment.

## Install

```bash
npm install
```

## Run locally

Start the Vite development server:

```bash
npm run dev
```

The app is available at <http://localhost:5173>. To use another development port, set `PORT`:

```bash
PORT=8080 npm run dev
```

On Windows PowerShell, use `$env:PORT = 8080` before running `npm run dev`.

## Build and preview

Create the deployable static site in `dist/`:

```bash
npm run build
```

Preview that production build locally:

```bash
npm run preview
```

The preview server defaults to port `4173`. Set `PREVIEW_PORT` to use another port. `vite preview` is intended for local verification; production hosting should serve the generated `dist/` directory.

## Test

Run the state and persistence unit tests with:

```bash
npm test
```

The tests use Node's built-in test runner and do not require the Vite development server.

## Project entry point

The root `index.html` is Vite's HTML entry point. It references `src/main.js`, which imports the counter state module. Vite processes these source references during development and bundles them into `dist/` during a production build.
