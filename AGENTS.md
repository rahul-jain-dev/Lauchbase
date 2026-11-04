# Skeleton AI development instructions

## Objective and current milestone

Skeleton AI (previously LaunchBase) helps freelancers and small SaaS builders turn confirmed product requirements into an understandable, supported project foundation. Preserve deterministic compatibility checks, exact supporting excerpts, explicit-answer precedence, review before confirmation, honest verification states, and isolated provider credentials. Historical LaunchBase names in contracts, repository URLs and evidence are intentional; do not rename them solely for branding.

The intake, provider Settings, scoped planning, interactive map and build-plan preview are implemented. Actual foundation generation, ZIP export, generated-code execution and deployment are not implemented. The next product milestone is real assembly from the versioned blueprint, only when requested. Do not infer permission to deploy or complete every milestone.

## Read before continuing

- `docs/PROJECT_PLAN.md`: product vision and full milestone plan.
- `docs/BUILD_HANDOFF.md`: implementation decisions and continuation guidance.
- `IMPLEMENTATION_STATUS.md`: current implementation, check results and limitations; historical sections are dated evidence, not current guarantees.
- `docs/IMPLEMENTATION_CHECKLIST.md`: completed and outstanding work.
- `docs/CLOUD_DEVELOPMENT.md`: Linux/cloud setup, network requirements and limitations.
- `docs/PROVIDERS.md`, `docs/PLANNING_EXPERIENCE.md`, `docs/PROVIDER_TIMEOUT_EVIDENCE.md`: provider contracts and separate fixture/live evidence.

Work from the actual Git checkout root (`git rev-parse --show-toplevel`), using repository-relative paths. Windows paths in older documents are provenance only in cloud tasks. No access to the laptop, its browser, local skills, keys, sessions or ignored diagnostics should be assumed. Preserve existing work and Git history; inspect status before editing. Use a `codex/` branch for new work and never force-push.

## Runtime and commands

Use Node.js 22.23.2 (`.nvmrc`; package minimum 22.12.0) and **pnpm 11.25.0**, pinned in `package.json`. Use the committed pnpm lockfile and do not replace it with another package manager's lockfile.

```sh
pnpm install --frozen-lockfile
pnpm dev --hostname 0.0.0.0
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
```

Browser tests require a production build first and use port 3100. Linux defaults to Playwright Chromium: install it and OS libraries with `pnpm exec playwright install --with-deps chromium`. Windows defaults to installed Edge. `PLAYWRIGHT_CHANNEL` can explicitly select another installed channel. Generated screenshots go to ignored `artifacts/screenshots/`; set `PLAYWRIGHT_SCREENSHOT_DIR=docs/screenshots` only to intentionally refresh reviewed fixture evidence. Do not run dev and build concurrently against the same checkout.

## Providers, secrets and evidence

The browser uses only its explicitly activated Settings connection. Native Meta/Gemini and named OpenAI/OpenRouter or an administrator-approved gateway are supported by the existing adapters. No silent provider/model fallback; no arbitrary client-supplied endpoint URLs. Environment credentials are optional CLI smoke configuration, not a browser fallback. See `.env.example` for placeholders and `docs/PROVIDERS.md` for supported parameters.

Keys remain in expiring server memory behind an opaque HttpOnly session cookie. Reconnect after restart; laptop sessions do not transfer to cloud. Never commit or print keys, cookies, `.env.local`, browser state, private diagnostics or raw provider/user content. Never place credentials in browser variables, exports, prompts or generated projects. Keep ignored files ignored.

Typecheck, lint, unit tests, build and browser fixture checks need no live credentials. Automated provider responses are fixtures; they are not live API verification. `pnpm smoke:provider` and `pnpm smoke:meta` may make paid requests when configured; run only for explicitly authorized live checks, record actual attribution/results, and retain failures. A skipped smoke check is not a pass. Current live OpenRouter evidence includes semantic mistakes and does not verify direct Meta.

## Change and handoff discipline

Keep shared contracts/logic in `src/lib`, server/provider/credential work in `src/server`, and UI in `src/components`. Review relevant bundled Next.js guides before changes, as required below. Run checks appropriate to each change; report fixture results separately from live evidence and record any cloud-only checks that could not be executed. Update status/checklist/handoff for material milestone changes. Generation and external setup must remain planned until actual execution supplies evidence.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
