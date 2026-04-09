# CLAUDE.md
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
SOS2526-12 is a Service-Oriented Systems course project with three REST API modules sharing a single Express server, backed by NeDB (file-based), and a SvelteKit frontend.

**Live deployment:** https://sos2526-12.onrender.com

## Commands
```bash
# Start the server (port 3000)
npm start

# Build the Svelte frontend
npm run build

# Run frontend dev server
npm run dev-front

# Run all API tests locally (Newman/Postman)
npm run test-local

# Run API tests against production
npm run test-online

# Run per-module API tests locally
npm run test-api-local-LPH
npm run test-api-local-JJG
npm run test-api-local-FMG

# Run E2E tests (Playwright) — server must be running
npx playwright test
npx playwright test tests/e2e/birth-death-growth-rates.spec.js  # single file
```

## Architecture

### Backend
Three independent modules loaded into one Express app (`index.js`):

| Module | File | API prefix | Owner |
|--------|------|-----------|-------|
| Birth/Death/Growth Rates | `src/back/index-LPH.js` | `/api/v2/birth-death-growth-rates` | Lucca |
| Mid-Population Ages | `src/back/index-JJG.js` | `/api/v2/mid-population-ages` | Javier |
| Age-Specific Fertility Rates | `src/back/index-FMG.js` | `/api/v2/age-specific-fertility-rates` | Francisco |

Each module exports a `load*(app)` function that registers its routes. All use **NeDB** (`.db` files, gitignored) for persistence.

### REST API Conventions (all modules)
- `GET /api/v2/<resource>` — list with filtering: `?limit=`, `?offset=`, `?from=`/`?to=` (year range), `?field[gte]=`/`[lte]=`/`[gt]=`/`[lt]=`
- `GET /api/v2/<resource>/:key1/:key2` — get single record by composite key
- `POST /api/v2/<resource>` — create; returns 400 on validation error, 409 on conflict
- `PUT /api/v2/<resource>/:key1/:key2` — update; returns 404 if not found
- `DELETE /api/v2/<resource>` — delete all
- `DELETE /api/v2/<resource>/:key1/:key2` — delete one
- `GET /api/v2/<resource>/loadInitialData` — seed sample data

NeDB `_id` is always stripped from responses.

### Frontend
SvelteKit app in `src/front/`, built output served as static files from `src/front/build/`. File-based routing under `src/front/src/routes/`:
- `/birth-death-growth-rates` — CRUD UI for LPH data
- `/age-specific-fertility-rates` — CRUD UI for FMG data
- `/mid-population-ages` — CRUD UI for JJG data

The Svelte frontend calls backend APIs via `fetch` at relative paths (same origin).

### Testing
- **API tests:** Postman collections in `test/api/`, run via Newman. Two environments: `api-env-local.json` (localhost:3000) and `api-env-render.json` (production).
- **E2E tests:** Playwright specs in `tests/e2e/`, configured in `playwright.config.js` with baseURL `http://localhost:3000`. The config auto-starts the server before tests.

## Technical Conventions

### Git
- Use **WSL** for all Git operations
- For `npm install` / `npm run build` use **Windows CMD** (Rollup/esbuild platform issues with package-lock.json)
- If `git push` rejected due to diverged branches: `git pull --rebase origin main` then push again

### CI/CD
- `cicd.yaml` must be edited via **GitHub web interface**, not CLI push

### Code Style
- Always reference existing project files before suggesting changes
- Follow existing code structure
- Never modify project files without explicit confirmation (reading is fine)

## Academic Context
This is a university SOS course project. Each team member owns their module (LPH/JJG/FMG). When modifying a module, be careful not to break the other modules' routes or shared middleware in `index.js`.

## Current Status
- ✅ **D02 (GUI deliverable)** — COMPLETED. Full Svelte frontend with CRUD, search, edit view, error messages in Spanish, auto-reload, Playwright e2e tests, CI/CD with auto-deploy to Render.

## Current Goal: Extra Points (deadline: Feedback 13 April)

Each extra is worth **+0.25pt** (max 2pt individual + 0.25pt group).

### Individual extras
- [ ] **JWT authentication** in backend (`src/back/index-LPH.js` + middleware)
- [ ] **OAuth** in backend (passport.js)
- [ ] **Auth0 with social login** in frontend (Svelte)
- [ ] **CRUD frontend with React, Angular or Vue** (parallel frontend for `/birth-death-growth-rates`)
- [ ] **Firebase or alternative persistence** (alongside or replacing NeDB in `index-LPH.js`)
- [ ] **Deploy on another cloud** (Railway, Fly.io, etc.)

### Group extras
- [ ] **snyk + codecov/coveralls** → vulnerability + coverage badges in README

### Suggested implementation order
1. snyk + codecov (group, ~30 min) — GitHub Actions config + badges
2. Deploy on another cloud (~45 min) — Railway or Fly.io
3. JWT backend (~1h) — Express middleware in `index-LPH.js`
4. OAuth backend (~45 min) — passport.js
5. Auth0 frontend (~1.5h) — Auth0 tenant + Svelte integration
6. React/Vue frontend (~2h) — parallel frontend for LPH resource

### End of task update
Whn finishing a task, update README-LPH.md with the changes and how it works for better understanding at a later date and to study.