# Continuing LaunchBase in Codex Cloud

Prepared November 4, 2026. This is a development handoff, not a website deployment. The canonical repository is [rahul-jain-dev/Lauchbase](https://github.com/rahul-jain-dev/Lauchbase) (the repository name intentionally follows the supplied URL).

## Resume from the repository

Select this repository and the pushed `codex/cloud-development` branch in your cloud environment/task. Read root `AGENTS.md`, `IMPLEMENTATION_STATUS.md`, `docs/PROJECT_PLAN.md` and `docs/BUILD_HANDOFF.md` before changing code. Work from the checkout root; do not try to open `E:\Meta AI Hackathion` or copy files from the laptop. Windows paths in historical documents identify their original location, not a cloud prerequisite.

The current product implements intake, reviewed requirement extraction, deterministic filtering, explicit AI connections, scoped foundation planning, a project map and build-plan preview. Real generation/ZIP export and executed checks of generated applications remain the next requested product milestone. Preserve the existing unfinished work and truthful statuses; do not start extra milestones automatically.

Suggested first phone task:

> Use the LaunchBase repository on codex/cloud-development. Read AGENTS.md and IMPLEMENTATION_STATUS.md, install the pinned dependencies, and report readiness and check results. Preserve existing requirements, provider/session protections and fixture/live evidence boundaries. Do not deploy. Wait for my next milestone before adding product features.

## Runtime and dependencies

Use **Node.js 22.23.2**, recorded in `.nvmrc`, and **pnpm 11.25.0**, pinned in `package.json`. The package minimum is Node 22.12.0. Keep `pnpm-lock.yaml`; no npm/yarn lockfile is needed.

After selecting the Node runtime in the environment (or using `nvm install` and `nvm use` if nvm is available), run from the checkout root:

```sh
node --version
npm install --global pnpm@11.25.0
pnpm --version
pnpm install --frozen-lockfile
```

If the exact pnpm version is already installed, skip the global install. Avoid updating dependencies merely to prepare the environment. `pnpm-workspace.yaml` already approves the pinned esbuild and resolver build scripts.

For browser checks on Linux, install Playwright's pinned Chromium and required system libraries during environment setup:

```sh
pnpm exec playwright install --with-deps chromium
```

OS-library installation may need administrator/package-manager access. A browser download alone is not proof that the browser can launch. If installation is unavailable, record the browser checks as not run and still run the other checks.

Codex Cloud stores reusable environment configuration, including installation/start instructions, repository selection and network access. Configure and publish that environment before starting a new task; repository access remains a separate requirement. See the [official cloud environment guide](https://learn.chatgpt.com/docs/environments/cloud-environments). UI labels/access may depend on the account; a local commit does not provision the cloud environment.

## Development and verification

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
```

Run the production build before browser tests. Tests start their own app on port **3100**, which must be free. Windows defaults to installed Microsoft Edge; Linux uses Playwright Chromium. An explicit `PLAYWRIGHT_CHANNEL` override is available for another installed channel. Desktop/mobile refer to viewport scenarios, not real mobile hardware.

To preview development:

```sh
pnpm dev --hostname 0.0.0.0
```

The app listens on port **3000**. Use an environment-provided authenticated preview/port forward if available; `localhost` on your phone is the phone, not the cloud machine. Availability of a browser preview is not assumed. Do not open a public unauthenticated tunnel to this prototype. To run a production preview after a build, use `pnpm start --hostname 0.0.0.0 --port 3000`.

Do not run dev and build concurrently in one checkout. Generated `.next`, dependencies, browser output, caches and diagnostic files remain ignored. Routine screenshots go to `artifacts/screenshots/`. To intentionally refresh reviewed fixture screenshots, set `PLAYWRIGHT_SCREENSHOT_DIR=docs/screenshots` for the browser command, inspect the images and describe the fixture origin before committing them. Existing committed screenshots remain historical evidence from their documented capture dates.

## What works without provider keys

Installation, typecheck, lint, all unit/route tests, production build, browser fixture checks, manual intake, deterministic filtering and plan exploration need no live provider account. This app does not fetch external fonts during build. Browser/provider tests use explicitly labeled synthetic responses; they establish application behavior, not real model access or accuracy.

Missing AI configuration must remain an explicit state. Never simulate extraction or silently select another provider. The optional commands below use environment configuration through real application functions, make requests only when configured, and may consume credits:

```sh
pnpm smoke:provider
pnpm smoke:meta
```

A skipped smoke check is not live verification. Direct Meta is still separately unverified. Historical OpenRouter/Nemotron checks succeeded structurally but exposed semantic errors; preserve those limitations. No new live provider request is required for cloud preparation.

## Provider configuration and sessions

For browser inference, use Settings → AI connections → Connect → select model → test both operations → Use this connection. Environment credentials never activate the browser or serve as a fallback. Keys live only in expiring process memory, isolated by opaque HttpOnly session cookies. Cloud restarts, different browser sessions and the Windows-to-cloud move require reconnection. Page answers/plans are not durable persistence.

For explicitly authorized CLI smoke checks only, use secret environment settings or an ignored `.env.local`. `.env.example` provides placeholders; consult `docs/PROVIDERS.md` for exact names. Do not put secrets in instructions, prompts, Git, screenshots, shell history, URLs or `NEXT_PUBLIC_` variables.

The official cloud guide distinguishes direct environment variables from destination-scoped network secrets. Choose a supported mechanism in your environment and validate it separately: this application's provider transport, endpoint/DNS protections and credential checks have not been verified against a cloud secret proxy. Never weaken those protections to make a proxy work, or assume a proxy placeholder is a normal provider key. Keep credentials absent for fixture-only development. [Official environment/secret guidance](https://learn.chatgpt.com/docs/environments/cloud-environments).

## Network destinations

Allow only destinations needed for the chosen task. No Supabase, hosting or deployment credentials are needed for the current planning milestone.

| Purpose | Destinations / requirements |
|---|---|
| Checkout and normal pushes | `github.com`; `api.github.com` for GitHub tooling, over HTTPS. Authentication may use GitHub's device/browser flow |
| Runtime and dependencies | `registry.npmjs.org`; `nodejs.org` if installing Node; any package-manager redirects required by the environment |
| Playwright browser installation | `cdn.playwright.dev`, `playwright.download.prss.microsoft.com` and their documented CDN redirects; the base image's Debian/Ubuntu package mirrors for OS libraries |
| Local app/browser checks | Loopback HTTP ports 3000 and 3100; no external model access needed |
| Optional direct Meta | `api.meta.ai:443` |
| Optional native Gemini | `generativelanguage.googleapis.com:443` |
| Optional named OpenAI | `api.openai.com:443` |
| Optional named OpenRouter | `openrouter.ai:443` |
| Optional approved gateway | Only the administrator-approved public HTTPS hostname in `OPENAI_COMPATIBLE_BASE_URL`; strict schema approval is required |

Model generation/listing requires outbound DNS and HTTPS. Provider adapters reject private/local destinations, arbitrary client URLs and redirects. Current runtime networking/proxy policies may restrict native HTTPS calls even when a hostname is allowlisted; report the exact safe failure instead of weakening checks. Official documentation access can use `learn.chatgpt.com`, `developers.openai.com` and the relevant provider documentation sites when researching a change.

## Source-control and evidence boundaries

Commit source, test fixtures, lockfile, plans, status and reviewed documentation/screenshots. Exclude `.env.local`, keys/certificates, cookies/storage state, browser profiles, `.next`, `node_modules`, caches, archives, `artifacts/`, test results and private diagnostics. Diagnostics contain only allowlisted safe metadata, but remain private ignored artifacts. They and laptop browser sessions are not transferred to cloud.

Inspect `git status` and the staged diff before every commit. Use a `codex/` branch, normal pushes and explicit review; do not force-push, rewrite existing history, guess another repository or change visibility. GitHub authorization for this laptop does not grant Codex Cloud repository access: authorize the repository in the cloud environment using your account. Never paste a GitHub token into chat.

## Verification and remaining limitations

This preparation is verified on the Windows host. Linux configuration/commands are provided, but a real Linux cloud execution must be performed and recorded there; this task does not claim a cloud container or mobile browser was provisioned. Current command outcomes are recorded in `IMPLEMENTATION_STATUS.md`.

The app remains a single-process local prototype: credential memory is not shared across replicas; intake is not persistent; public-service authentication/rate controls and real generation are future work. A cloud development preview is not a production deployment. Cloud browser automation, port previews, system-library installation and provider egress depend on available environment capabilities. Keep safe diagnostics separate from fixtures, preserve semantic-validation failures, and report unexecuted checks honestly.
