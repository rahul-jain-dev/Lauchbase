# LaunchBase

Milestone 1A: idea intake, explicit constraints, clarification, a versioned foundation catalog, deterministic filtering, and guarded Meta ranking. The catalog contains **definitions**, not generated or verified applications.

## Run locally

Prerequisites: Node.js 22.12 or later and pnpm 11.25.0 (the versions used here are pinned in `package.json`).

```powershell
cd 'E:\Meta AI Hackathion'
pnpm install --frozen-lockfile
pnpm dev
```

Open [localhost:3000](http://localhost:3000). Answers remain in the current page session; refreshing clears them.

## Meta configuration

`.env.local` is ignored by Git and currently contains placeholders. On a fresh checkout, copy `.env.example` to `.env.local`. Set `META_API_KEY` there and keep `META_MODEL=muse-spark-1.3` unless your account supports another compatible model. Restart the server after editing. Never put the key in a `NEXT_PUBLIC_` variable.

```powershell
pnpm smoke:meta
```

The smoke command skips explicitly if the key is missing or still a placeholder; otherwise it makes a real small structured-output request. A passing fixture test is not a real Meta call.

The adapter follows Meta's [Chat Completions protocol](https://dev.meta.ai/docs/protocols/chat-completions) and [structured output documentation](https://dev.meta.ai/docs/structured-output), reviewed October 31, 2026. It uses server-side `fetch`, a fixed HTTPS endpoint, configurable model, bounded completion tokens and a 30-second timeout. The project names its environment variable `META_API_KEY`; Meta's examples call theirs `MODEL_API_KEY`.

## Inspect the flow

1. Enter an idea and submit with unknown answers to see up to five targeted follow-ups.
2. Select Python as a hard requirement to see both definitions eliminated before Meta is called.
3. Choose TypeScript, Next.js, individual accounts, no billing/uploads/jobs, a budget, a hosting target, an operating country, and confirmed Supabase eligibility. Filtering leaves the individual definition. Without a real key the app shows **Meta configuration required**.
4. Choose team accounts with required uploads to inspect the team definition. Individual-only accounts plus required uploads have no supported match.

The product description is context for ranking, not an automatic source of hard constraints. Declare non-negotiable requirements in the structured fields or the additional hard-requirement list. Unknown values are never converted into positive compatibility claims. Unconfirmed assumptions do not affect filtering. Confirmed assumptions fill unanswered fields; explicit answers win.

## Checks

```powershell
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
```

Browser tests start the production build on port 3100 and use installed Microsoft Edge in headless mode. They expect a placeholder-only Meta configuration and exercise real local UI/API behavior without model inference. Unit/API/adapter tests use explicitly labeled synthetic fixtures. To run browser tests on another OS, adjust the browser channel in `playwright.config.ts` and install its browser.

## Source map and limits

- `src/lib/contracts.ts`: shared Zod contracts and evidence states.
- `src/lib/catalog.ts`: versioned module and foundation metadata with dated official sources.
- `src/lib/recommendation.ts`: filtering, clarification, assumption handling and model selection validation.
- `src/server/meta.ts`: server-only provider adapter.
- `src/app/api/recommend/route.ts`: validated HTTP boundary and safe provider failure state.
- `src/components/intake.tsx`: responsive intake and results.

Meta can rank only eligible IDs and select only explanations grounded in approved catalog facts. Displayed explanations come from those validated reason codes; arbitrary model prose is intentionally excluded to prevent unsupported integration claims. Budget/cost fit remains unresolved; no fixed monthly-cost promise is made. Country and provider eligibility are builder declarations, not independently verified account access.

Generation, ZIP export, authentication, persistence, deployment, execution sandboxes and maintenance execution are future milestones. This local prototype has no public-service authentication or distributed request limits; address those before a public deployment using a paid model key. See `IMPLEMENTATION_STATUS.md` for observed verification and the recommended next step.
