# LaunchBase implementation status

**Updated:** November 4, 2026
**Workspace:** `E:\Meta AI Hackathion`  
**Current phase:** Requirement-to-foundation planning implemented: reviewed scope, explicit confirmation, stale-plan handling, grounded foundation plan, interactive project map and working build-plan preview. Real generation/export remain unimplemented. Live OpenRouter/Nemotron Ultra checks completed but exposed semantic errors; human review remains necessary. Direct Meta remains live-unverified. The full core vertical slice is incomplete.

## Cloud development preparation — November 4, 2026

- Existing local history and all completed milestone work are preserved. Git author identity is available. The supplied GitHub destination is `https://github.com/rahul-jain-dev/Lauchbase`; it was empty when inspected. Authenticated access was verified outside the network sandbox; no repository or visibility change was made.
- Root `AGENTS.md` now explains the objective/current milestone, repository-relative continuation, pinned runtime/commands, provider/session rules and fixture/live evidence. The generated Next.js guidance is preserved. `.nvmrc` pins the observed Node 22.23.2; pnpm remains 11.25.0 with its committed lockfile.
- Linux browser checks default to Playwright Chromium while Windows retains Edge. Routine browser screenshots use ignored artifacts; intentionally updating reviewed evidence requires an explicit directory override. No application features were added.
- Source, test fixtures, lockfile, planning/status documents and reviewed screenshots are intended for the continuation commit. Credentials, local environment/session/browser state, caches and private diagnostic artifacts remain excluded. `docs/CLOUD_DEVELOPMENT.md` documents setup, network destinations, preview limits and credential-free checks.
- Verified on Windows: frozen-lockfile install, typecheck, lint, **152 unit/route tests**, production build and **20 desktop/mobile Edge scenarios** passed. Git object integrity, diff whitespace, ignore rules, high-confidence credential/path audit and **205 exact-case relative imports** passed. Routine screenshots were written to ignored artifacts. The sandbox's optional browser-cache listing failed because its `.links` directory was absent; it did not prevent the installed Edge checks. Linux Chromium installation/execution is not claimed.
- The final staged scan identified one long synthetic key-shaped browser fixture, not a real credential. It was replaced with an obviously fake value preserving provider recognition; the staged scan then passed. Both affected Settings browser cases passed again outside the sandbox. The first focused attempt timed out at test-server readiness inside the sandbox before executing assertions; its owned test processes were stopped before the successful retry.
- Continuation branch: `codex/cloud-development`, configured for a normal push to the supplied `origin`. Final commit/push identity is reported in the task result. A real Linux/Codex Cloud environment and phone preview have not been provisioned by this Windows task; live provider calls were not made. Product generation/deployment remain out of scope.

## Requirement-to-foundation planning — current product milestone, November 1, 2026

- Sequence: Describe → Review understanding → Confirm scope → Foundation plan/map → Build/setup preview. No final verdict before scope confirmation. Changed requirements mark the old plan outdated and require confirmation/recalculation. Essential edits/removals require explicit confirmation; corrected scope retains its original interpretation/evidence without reintroducing the old proposal.
- Analysis `scoped-fixed-fields-v4` preserves seven fixed fields and exact excerpts, adding categorized additional needs and dependencies. Importance is separate from category/coverage. Essential product workflows remain custom work; required external services, payments and background execution remain blockers. Unknown dependencies need clarification. Known technical constraints map explicitly to supported settings; conflicting explicit answers are not overwritten. Workspace membership does not establish project-level client permissions.
- `foundation-plan-v1` includes confirmed/effective configuration, capability IDs, catalog/module versions, custom work, exclusions, setup/security decisions, build readiness, files and planned verification. Catalog definition version: `0.2.0-definition`. The agency fixture produces a team infrastructure plan with essential workflows and a prominent project-permission extension, not a completed client portal.
- Two accessible map views derive nodes/relationships from confirmed needs and optional tool choices. Ownership, setup and verification remain separate; costs are not checked. “Review build plan” shows real planning data and collects OS/editor/assistant/repository choices. No generation, fake downloads, installations or connected-cloud claims were added. Blueprint and historical inference evidence are in Settings → Developer diagnostics, separate from product technology choices.
- Current Settings compatibility version: `scoped-fixed-fields-v4/scoped-catalog-ranking-v2/representative-v2`; stale evidence is invalidated. Session keys, explicit provider selection, approved destinations, bounded timeouts/retries, excerpt validation, hard filtering and ranking safeguards remain intact.

**Actual live evidence:** user-triggered private-session OpenRouter calls requested/reported `nvidia/nemotron-3-ultra-550b-a55b`. Representative Settings analysis/ranking passed in **3.803 / 1.363 s**. All five subsequent case calls passed schema/domain/excerpt validation with HTTP 200 and normal completion, but that is not full semantic success:

| Case | Time | Observed limitation / hypothetical catalog outcome |
|---|---:|---|
| Individual contact manager | 2.993 s | Limited fixed-field checks passed; extra integration/private-file/unknown dependency interpretations need review and caused rejection if confirmed |
| Agency reviews/approvals/private uploads | 2.532 s | Preserved workflow/security categories; payments/uploads expected-value mismatches. Team provisionally eligible, clarification needed |
| Ambiguous booking | 1.786 s | Core unknowns retained, but extra workspace/project-permission dependencies overinterpret the idea; clarification required |
| Essential Salesforce | 1.758 s | Required external integration retained and correctly unsupported; payments expected-value mismatch |
| Scheduled workflow | 3.405 s | Required background dependency retained and correctly unsupported; payments/uploads exclusion mismatches |

No model switch or silent requirement repair occurred. These calls do not validate direct Meta or native Gemini/OpenAI. The limited authored assessment does not certify every extra interpretation. Fixtures demonstrate correct downstream behavior after explicit user confirmation; they do not establish model accuracy. Detailed safe report filenames, screenshots, boundaries and issues: [docs/PLANNING_EXPERIENCE.md](docs/PLANNING_EXPERIENCE.md).

Final automated verification: `pnpm typecheck`, `pnpm lint`, `pnpm build` passed; `pnpm test` passed **152 tests across 10 files**; `pnpm test:e2e` passed **20 desktop/mobile Edge scenarios**, including essential scope correction without reintroducing the model proposal. Screenshots are fixture evidence: `docs/screenshots/planning-application-*.png`, `planning-development-*.png`, and `planning-map-*.png`; focused maps were visually inspected and browser checks assert no horizontal overflow. A misplaced variable in the last scope-edit patch was caught by typecheck and corrected before the passing build/browser rerun. Other actual cache/fixture issues are recorded in the planning evidence. No generated foundation was executed. Next: revalidate the blueprint server-side, assemble actual modules/files and lockfile, produce a real ZIP, execute checks, and generate tailored setup/handoff while preserving custom-work/security gaps.

## Historical analysis reliability — before the scoped planning contract

- Fresh original-contract reproduction: OpenRouter / requested and reported `nvidia/nemotron-3.5-super-vl:free`, 7.263 seconds, HTTP 200, finish `stop`, zero reasoning tokens. **Wire-schema validation failed** with `too_small` at `proposals.5.excerpt` and `proposals.7.excerpt`. A prior semantic report also recorded `invalid_excerpt`. The generated portable schema omitted string-length constraints; generic proposal values and array uniqueness relied largely on prose. Increasing timeouts would not correct those failures.
- Provider-facing analysis is now **`fixed-fields-v3`**: seven required named fields with their own enum vocabularies, separate additional requirements, an unknown branch requiring unknown value/kind, false essential and null excerpt, and known branches requiring a string excerpt. Literal constraints are preserved as provider-compatible enum values. Prompts require an exact sentence/clause of at least eight characters and keep experience/skills separate from technology preferences. Portable string-length omissions remain explicit; runtime length and exact-substring checks are unchanged and authoritative.
- The wire result is explicitly validated and converted to the existing proposal array. No excerpt repair, requirement dropping, automatic confirmation or catalog accommodation was added. Explicit answers, review, unsupported essential integrations, hard filtering and ranking validation remain intact. Timings now distinguish wire schema, domain schema and semantic failure, with sanitized paths/rule codes and safely captured reported model even on validation failure. No raw content, credentials, cookies or reasoning text enters diagnostics.
- Settings makes **two separate bounded operations** through actual `analyzeIdea` and `rankFoundations`, keeping existing per-request deadlines. Authentication, model listing, analysis and ranking have separate states. Both representative checks must pass before the combined test/activation is available. Stored proof is invalidated when the key/profile/model/approved endpoint or analysis/ranking/test contract changes. Current test version: `fixed-fields-v3/catalog-ranking-v1/representative-v2`. Each check may retry once for existing transient categories; the UI explains credit usage and that passing examples do not guarantee future inputs.
- Final live Settings checks: **analysis passed in 2.060 s; ranking passed in 0.552 s**. All final four-case responses were HTTP 200, finish `stop`, zero reasoning tokens, one attempt, with successful wire/domain/exact-excerpt validation. The model and profile never changed. See the table below for representative semantic outcomes; HTTP/application success alone is not counted as semantic accuracy.

| Final live representative input | Time | Extraction assessment | Hypothetical catalog result, only if user confirms |
|---|---:|---|---|
| Individual contact manager, beginner who knows Python | 1.430 s | Passed authored checks; skill did not become a required stack | Individual definition eligible; provider-configuration-required is the rules-only engine state, not a claim about this session's authentication |
| Design-agency portal with private uploads | 1.449 s | Team/uploads recognized; `billing` and `background` failed `representative_value_mismatch` against explicit negative answers | Team eligible, clarification still needed |
| Ambiguous ticket booking | 6.102 s | Four account/capability unknowns preserved; one extra essential interpretation remains for user review. Field checks passed; overall meaning is not certified | Unsupported if that extra requirement is confirmed; never silently removed |
| Essential Salesforce integration | 1.511 s | Passed authored checks; unsupported integration and explicit negatives preserved | Unsupported, correctly; this is a successful extraction, not a failed integration |

The first draft assessment incorrectly treated every extra essential requirement as invented (including the agency's extra requirement). That assertion was removed: extra needs are retained for review, not dropped or assumed fabricated. Earlier reports remain unchanged and are not reclassified as full passes. The earlier v2 unsupported-case run also missed three negative answers. Observed variability and the final agency mismatch mean **this exact model remains imperfect at semantic extraction** despite solving the demonstrated structural failure. The limited four-case checks do not prove arbitrary-input accuracy, semantic relevance of every excerpt, budget fit, provider eligibility, generated apps or direct Meta compatibility. No further model was selected automatically.

Final automated evidence: `pnpm typecheck`, `pnpm lint`, and `pnpm build` **passed**. `pnpm test`: **144 passed across 9 files**. `pnpm test:e2e`: **16 passed** in desktop/mobile Edge. A cached Turbopack/PostCSS worker panic required preserving production caches and rebuilding; the dev session stayed intact. A browser assertion was updated for the new credit-warning wording before the passing rerun. Fixtures never enter the live-report directory (filesystem writes are mocked in session tests). Live details and local report filenames are documented in `docs/PROVIDER_TIMEOUT_EVIDENCE.md`.

## Historical provider timeout fix — October 31, 2026

- Traced intake → `/api/analyze` → active Settings session → `analyzeIdea` → shared validation → selected adapter. The exact provider, model and session key are passed explicitly; credentials stay in the provider authorization header, never timing reports or prompts. Session isolation, approved endpoints, explicit-answer precedence and catalog checks remain enforced.
- Replaced the fixed 30-second transport limit with separate server policies: generation 90 seconds per attempt / 120 seconds total; discovery 10 seconds / 30 seconds across authentication and pagination. Optional `.env.local` timeout settings are documented in `.env.example` and README. Generation has a 150-second ceiling; discovery 60 seconds. At most two transient attempts fit within one deadline, honoring Retry-After seconds/date headers. No retry for invalid credentials, exhausted billing, access/parameter/model incompatibility, refusal, truncation or invalid output. No fallback.
- Removed shorter 40-second intake and 65-second Settings waits: browser requests allow 170 seconds and inference routes declare 180 seconds. Hosting/proxy limits are separately controlled by the deployment platform; no shorter local project setting was found.
- Added safe DNS/header/body/validation timings, HTTP status, retry waits and final classification. The expandable timing tool compares a minimal structured request with actual analysis on the current Settings connection. Allowlisted local reports are ignored under `artifacts/provider-diagnostics/`; no cookies, keys, ideas, response text or endpoint credentials are recorded. Field-path/schema and semantic-rule diagnostics never echo rejected values.
- Live evidence identified the active profile as **OpenRouter / `nvidia/nemotron-3.5-super-vl:free`**, not native Meta/Gemini. The first minimal call passed in **1.512 s**, while actual analysis took **30.045 s**, HTTP 200, then failed `truncated`. Its response-body phase took 29.637 s. Public official model metadata confirms optional reasoning. The adapter now disables it only for the two reviewed OpenRouter Nemotron 3.5 Super VL IDs; output remains capped at 4,096 tokens and strict validation is unchanged. Other gateway models retain their defaults. Meta keeps documented minimal reasoning; native Gemini 3.8 Flash uses documented LOW thinking, with no guessed setting for older/unknown models.
- Subsequent live comparisons: minimal **0.454 s**, analysis **2.321 s** (HTTP 200, completed, runtime-schema rejection); minimal **1.062 s**, analysis **3.263 s** (HTTP 200, completed, semantic requirement/excerpt rejection). Both later analyses reported zero reasoning tokens, required no retry and avoided truncation/timeout. **At the end of that historical timeout milestone, no full analysis success had been observed; current results above supersede this status.** Those reports predate detailed rule/path telemetry and do not isolate the exact rejected field/rule. No constraints or evidence checks were weakened. Direct Meta, native Gemini, direct OpenAI and native NVIDIA were not live-validated.
- Loading clears after failure, timeout and invalid-output headings differ, and ideas/confirmed answers remain available. Desktop/mobile fixture checks exercise failure followed by successful retry. Detailed dated observations: [docs/PROVIDER_TIMEOUT_EVIDENCE.md](docs/PROVIDER_TIMEOUT_EVIDENCE.md).

Final automated checks: `pnpm typecheck`, `pnpm lint`, and `pnpm build` **passed**. `pnpm test`: **135 passed across 8 files**. `pnpm test:e2e`: **14 passed** in desktop/mobile Edge, including progress clearing and retained inputs after timeout/invalid output. Updated fixture screenshots: `docs/screenshots/timeout-error-desktop.png` and `timeout-error-mobile.png`. All automated provider responses are labeled fixtures; only the six user-invoked Settings-session calls above are live-provider evidence. Initial old one-response fixtures failed after retries were enabled and were updated; one missing-session test used an invalid empty idea and was corrected. An initial browser run started before the production build finished and could not start; it was rerun after the build. No provider failure was marked as an inference pass.

## Readiness

- Workspace confirmed and planning documents reviewed.
- Next.js App Router, React, TypeScript, Tailwind CSS and pnpm application created at the workspace root. Exact dependency versions and the lockfile are tracked in Git.
- Available locally: Node.js 22.23.2, npm 10.9.8, Corepack 0.34.6, pnpm 11.25.0, and Git 2.45.1.
- Yarn is not installed. The plan uses pnpm, which is available.
- Live checks confirmed OpenRouter authentication and both representative operations for the selected connection/contract. Broader model semantic accuracy remains limited; other provider accounts, hosting, database, workflow and isolated execution access remain unverified.
- Browser inference uses only the activated Settings session. Keys remain in expiring server memory with an opaque HttpOnly cookie. Environment settings remain optional CLI tools and never a browser fallback. Automated checks use fixtures; the timeout investigation also used the user's real session connection through the app without exposing its key.

## Milestones

| Milestone | Scope | Status |
|---|---|---|
| 0. Workspace setup | Inspect instructions and files, check tools, initialize Git, document prerequisites | Complete |
| 1A. Intake and recommendations | Shared contracts, catalog definitions, intake, filtering, guarded Meta ranking | Implemented; local checks passed; real Meta call pending |
| 1A.1. Idea-driven intake | Simple initial form, reviewed extraction, inline clarification, plain-language results | Implemented; 50 automated tests and 8 browser checks passed; live Meta pending |
| Model-provider integration | Explicit Meta/Gemini/compatible endpoint adapters, shared validation, attribution and smoke paths | Implemented; 89 fixture tests and 10 browser checks passed; no provider live-verified |
| Settings → AI connections | Session key lifecycle, named profiles, model discovery, compatibility test and explicit activation | Implemented; 110 fixture tests and 12 desktop/mobile checks passed; no live provider verification |
| Provider timeout fix | Separate deadlines, bounded retries, model-specific reasoning, timing comparison and retained inputs | Implemented; 135 fixture tests passed; live OpenRouter latency improved, full analysis still rejected by validation |
| Analysis reliability | Fixed-field wire contract, safe exact failure paths, separate representative analysis/ranking checks and version invalidation | Implemented; both representative operations passed live on OpenRouter/Nemotron; broader semantic limitations recorded |
| Requirement-to-foundation planning | Reviewed scope/dependencies, confirmation sequence, stale plans, grounded explanations, project map and versioned build preview | Implemented; fixtures and live semantic limitations documented; real generation remains next |
| 1. Core vertical slice | Contracts, catalog, intake, supported recommendation, Preset A generation, actual verification, setup guide, ZIP | In progress; generation and export not started |
| 2. Team preset | Preset B, compatibility rules, tenant isolation, comparison, setup and handoff | Not started |
| 3. Durable runs and dashboard | Persist projects and runs, progress, artifacts, export, setup diagnostics | Not started |
| 4. Catalog maintenance proof | Detect one supported change, Meta-proposed repair, isolated checks, reviewable candidate | Not started |
| 5. Release and submission | End-to-end verification, deployment, documentation, demo, public submission | Not started |

Detailed milestone checklist: [`docs/IMPLEMENTATION_CHECKLIST.md`](docs/IMPLEMENTATION_CHECKLIST.md).

## Immediate access and environment requirements

Verify these before relying on the corresponding implementation path. Use placeholders in examples and local configuration; do not paste actual keys into tracked files or chat.

| Requirement | Needed for | Environment variable / placeholder | State |
|---|---|---|---|
| Meta Model API access and credited usage; confirm Muse Spark 1.3 and Muse Wonder 1.0 availability | Real model calls for intake/explanations and maintenance repair | `META_API_KEY=<set locally>` | Not verified |
| Supabase project with database, Auth, and private Storage access | Platform persistence, identity, artifacts, and generated-app integration | `NEXT_PUBLIC_SUPABASE_URL=<set locally>`; `NEXT_PUBLIC_SUPABASE_ANON_KEY=<set locally>`; `SUPABASE_SERVICE_ROLE_KEY=<set locally>` | Not verified |
| Vercel account/project and deployment access | Web hosting and deployment | `VERCEL_TOKEN=<set locally>` | Not verified |
| Inngest account/event key and signing key | Durable generation and verification workflows | `INNGEST_EVENT_KEY=<set locally>`; `INNGEST_SIGNING_KEY=<set locally>` | Not verified |
| Isolated execution route: Vercel Sandbox access, or local Docker availability | Safe build and verification of generated candidates | `VERCEL_TOKEN=<set locally>` when using hosted sandbox; Docker requires no API secret | Not verified |
| GitHub account/repository access | Source hosting, Actions, and public submission | `GITHUB_TOKEN=<set locally>` only if automation needs it | Not verified |

The browser-facing Supabase URL and anon key are identifiers/public client credentials, but they still belong in local configuration. Never expose the service-role key or Meta key to browser code or generated projects. Confirm exact variable names against current provider documentation during implementation.

## Later or optional requirements

- Stripe test account and test keys, only if optional billing is implemented; provider availability may vary by country. Billing must not block the core path.
- GitHub Actions repository permissions for scheduled/manual catalog checks and candidate patch workflows.
- Vercel Sandbox plan/usage or Docker installed and working; verify costs and limits before depending on hosted execution.
- Any separately billed hosting, database, workflow, storage, or sandbox usage. Meta credits do not cover these services.
- Product-domain registration and production secrets only if a public deployment needs them.
- New provider accounts/credentials only when a supported module requires them; do not request customer credentials for unrelated services.

## Current blockers and next action

Open **Settings → AI connections**, choose a provider, enter its key, Connect, select a model, Test selected model (two operation checks, may consume credits), and explicitly Use this connection after both pass. Named providers need no environment changes. Contract changes require retesting. Optional CLI checks do not activate the browser app. Live OpenRouter examples passed both operations, with the broader semantic limitations above; direct Meta remains unverified.

Recommended next step: review actual requirement interpretations and remaining model semantics, particularly explicit negation and extra essential interpretations. Validate direct Meta separately when account/billing access is available. Generation and export remain for a later milestone prompt.

## Historical Settings → AI connections implementation and evidence

- This milestone supersedes deferring user-facing key configuration. The header Settings button opens a native dialog with provider/key connection, searchable models, refresh/test/explicit-use, current status and key replacement/disconnect. Opening or closing leaves intake mounted. Key input clears after Connect and on close.
- Fixed Meta, Gemini, OpenAI and OpenRouter profiles use documented endpoints/authentication. Key-format hints do not trigger requests. Extra gateways use only an administrator-approved endpoint; unrestricted URLs are rejected.
- Model lists normalize supplied IDs, names, generation methods, modalities, structured-output metadata and limits. Missing capabilities remain unknown. Pagination is bounded and checked. OpenRouter verifies its protected key endpoint before its public catalog. Manual IDs are explicitly labeled when listing is unavailable and still require testing.
- Keys stay in one Node process's memory, with eight-hour absolute expiry, on-access rejection and minute cleanup. The browser has only a random 256-bit opaque HttpOnly SameSite=Strict cookie (Secure on HTTPS). Separate cookie contexts are isolated; replacement rotates the token. Disconnect/restart/expiry never activate another connection or environment key.
- Testing makes one bounded structured-output recommendation call through the existing adapter, schema and catalog validation. Successful testing is separate from authentication/listing and does not activate itself. Changing key, profile, model or administrator endpoint approval invalidates the test; pending tests cannot restore disconnected/expired readiness.
- Both browser AI routes explicitly receive the activated session config. Requirement confirmation, excerpts, explicit-answer precedence and hard constraints remain intact. Historical inference keeps provider/model/profile/timestamp independently of current selection. Environment settings are CLI-only, with no browser fallback.
- Mutations require same-origin JSON; response DTOs and model metadata exclude keys. Known key material is rejected in prompts/provider output. No localStorage/sessionStorage, URL/log key storage or shared permanent credential database was introduced. Errors separate authentication, billing/quota, rate limiting, timeout, temporary service, unsupported models and invalid output.

| Check | Observed result |
|---|---|
| `pnpm typecheck` | Passed |
| `pnpm lint` | Passed |
| `pnpm test` | 110 passed across 7 files; synthetic provider responses only |
| `pnpm build` | Passed, including `/api/connections` |
| `pnpm test:e2e` | 12 passed across desktop/mobile, including Settings lifecycle and retained answers |
| Live provider checks | No real-key checks executed; no live Meta/Gemini/OpenAI/OpenRouter/gateway verification claimed |

Issues fixed: initial type checks caught header/store annotations; initial browser selectors needed role-based combobox lookup; visual inspection identified modal positioning, which was corrected and asserted. Final checks pass. Visually inspected screenshots `docs/screenshots/settings-active-desktop.png` and `settings-active-mobile.png` are UI fixture evidence, not live provider verification.

Boundaries: local single-process session memory only; reconnect after restart/expiry. No application-user authentication, permanent shared credential database, arbitrary destinations, universal-model compatibility, generation or deployment was added. An actual direct Meta request must pass before live Meta is verified.

## Historical configurable model-provider implementation and evidence

- Provider choice is a permanent capability. Gemini is the development option while Meta billing is unavailable per the user; Meta remains the hackathon integration. This decision is recorded in the handoff and overrides earlier Meta-only implementation assumptions.
- Shared prompts, Zod application schemas, excerpt/confirmation handling, deterministic filtering and semantic catalog validation remain in the application layer. Provider-specific request parameters and response parsing live in server-only adapters. No SDK framework, provider marketplace, user-facing key storage or automatic model routing was added.
- Explicit `AI_PROVIDER` selection calls exactly one provider. Native adapters recognize documented model IDs; other models are rejected. The compatible adapter requires an administrator-selected HTTPS base URL and strict JSON Schema capability declaration. Public request bodies cannot supply provider/endpoint/key fields. Private/local hosts and IP literals are rejected; DNS is checked before gateway requests; redirects are refused.
- Portable wire schemas omit unsupported length annotations; runtime Zod and semantic checks remain authoritative. Refusals, truncation, malformed/invented output, access failures, unsupported structured requests, timeouts and rate limits return safe actionable errors. Provider bodies and credentials are not returned or logged.
- Real results carry provider, requested/reported model and timestamp. The UI distinguishes active configuration from historical inference source. A gateway reporting a Meta model is still a gateway result, never direct Meta validation. Existing Meta-only metadata keeps Meta attribution; configuration changes do not relabel prior page-session results.
- `pnpm smoke:provider` exercises actual idea analysis and recommendation using the selected adapter when a key is configured. `pnpm smoke:meta` explicitly selects direct Meta in the smoke process only. Partial runs remain failed. Current selected model is Gemini / `gemini-3.8-flash`; no real inference provider/model was exercised because credentials were absent/placeholders.

| Check | Observed result |
|---|---|
| `pnpm install --frozen-lockfile` | Passed with pinned `tsx` and reviewed `esbuild` setup; lockfile updated |
| `pnpm typecheck` | Passed |
| `pnpm lint` | Passed |
| `pnpm test` | 89 fixture tests passed across 6 files; no live provider evidence |
| `pnpm build` | Passed, including safe `/api/provider` status endpoint |
| `pnpm test:e2e` | 10 passed across desktop/mobile, including attribution preservation after configuration changes |
| `pnpm smoke:provider` | Skipped: Gemini / `gemini-3.8-flash`, missing real `GEMINI_API_KEY`, `liveInference: false` |
| `pnpm smoke:meta` | Skipped: Meta / `muse-spark-1.3`, missing real `META_API_KEY`, `liveInference: false` |

Actual issues resolved: initial dependency setup paused for pnpm review of esbuild's installation script; the pinned script was enabled and install completed. An initial type check found the Next.js-augmented environment fixture needed `NODE_ENV`; the fixture was corrected. Final checks pass. No live rate-limit, billing, refusal or model behavior was observed; those cases are fixture evidence only.

Compatibility details and dated official references: `docs/PROVIDERS.md`. All providers remain live-unverified. Native APIs outside implemented adapters and gateways with different role/token/schema profiles need additional implementation; no universal compatibility is claimed. No generation, deployment or new generated-app service providers were added.

## Milestone 1A.1 implementation and evidence

- The initial form asks only for the idea, building experience, budget (blank means not sure; zero remains zero), and optional existing technologies. Language, framework, hosting, country, provider restrictions and additional essential requirements are in a closed Advanced section.
- The server-only Meta adapter now supports structured idea analysis. Seven typed fields distinguish `explicitly_stated`, `suggested`, and `unknown`, with essential flags and supporting idea excerpts. Additional essential integrations are preserved as separate requirements, not claimed supported. Validation enforces approved values, one entry per field, bounded output, and exact excerpts of at least eight characters. Excerpt matching is provenance checking, not proof of semantic truth; users must review interpretations.
- No keyword classifier or fake extraction was added. The prompt explicitly treats “client portal for ticket booking” as ambiguous about shared workspaces, payments, uploads and jobs. All proposals require confirmation; extraction itself changes no confirmed answers. Explicit answers and explicit constraint-strength choices override suggestions. Confirmed essential technical needs remain hard constraints.
- Selection questions now concern account structure, payments, files and background work, plus any explicitly essential technical choice still unspecified. Inline controls retain prior answers. Unknown preferences, budget and provider access remain unresolved instead of becoming assumed compatible. Supabase is explained as the proposed sign-in/records service before its account and regional prerequisites need confirmation.
- Essential interpretations must be reviewed before comparison. Unsupported payments/jobs/custom integrations remain unsupported. Relaxing a confirmed essential capability, account choice, technical constraint, or provider restriction requires confirmation. Original values, supporting excerpts and explicit corrections remain available during the page session.
- Results lead with the catalog match/suggestion, reasons, friendly capability names, decisions and next step. One visible planned-foundation status is used. Sources, technical checks, exclusions and evidence are expandable. Rules-only comparisons are labeled; they are not represented as AI recommendations.
- Screenshots: `docs/screenshots/1a1-initial-desktop.png`, `1a1-initial-mobile.png`, `1a1-results-desktop.png`, `1a1-results-mobile.png`. The rendered desktop and mobile images were inspected; browser checks assert no horizontal overflow.

Observed Milestone 1A.1 checks on October 31, 2026:

| Check | Observed result |
|---|---|
| `pnpm typecheck` | Passed |
| `pnpm lint` | Passed |
| `pnpm test` | 50 passed across 5 files; model/HTTP outputs are labeled synthetic fixtures |
| `pnpm build` | Passed; home, analysis endpoint and recommendation endpoint built |
| `pnpm test:e2e` | 8 passed: four flows each at desktop and 390px mobile in headless Edge |
| `pnpm smoke:meta` | Skipped: placeholder configuration; no real provider call or inference pass |

Browser coverage includes four initial visible controls, missing Meta configuration, manual input, inline clarification and retained answers, confirmation before changing essential needs, ambiguous extraction fixtures, explicit overrides, unsupported payment extraction fixtures, zero-budget handling and responsive layout. Browser model fixtures are request interceptions used only in tests. The test server uses a placeholder key, independent of local credentials, to prevent fixture scenarios from spending model credits.

Actual failures during this milestone: the old test expecting five clarification groups failed after budget/provider checks were deferred; it was updated to assert the remaining material question groups. Final application checks pass. No application failure was simulated as a passing integration.

Remaining limitations: real Meta behavior and account/model access are unverified; semantic extraction quality cannot be established with fixture tests. Budget/provider compatibility still needs external evidence. The page retains answers and evidence only until refresh. There is no generation, deployment, persistence or extra-provider integration in this milestone.

## Historical Milestone 1A implementation and evidence

- Shared Zod contracts cover requirements/constraints, typed editable assumptions, clarification, module/foundation metadata, recommendations/eliminations/unresolved items, and evidence states (`planned`, `executed`, `passed`, `failed`, `pending_configuration`). Executed outcomes require timestamps and evidence.
- Two versioned catalog definitions include capabilities, prerequisites, technologies, limitations, official sources and review dates. Both remain **planned**, with no generated application or integration verification claim.
- Responsive intake collects the requested builder/product/environment fields. Unknown answers produce up to five targeted follow-up groups. Confirmed assumptions fill unanswered fields only; explicit answers win.
- Deterministic checks enforce stack, account model, capability combinations, hosting, provider eligibility and additional hard requirements. Billing/background jobs are unsupported; required uploads are defined only for teams. Unknowns block ranking instead of silently passing compatibility.
- Server-only Meta integration uses current official Chat Completions and JSON Schema documentation. It ranks eligible IDs with approved reason codes; the server checks IDs, completeness, uniqueness and fact applicability before rendering catalog-grounded explanations. Model prose cannot add integrations or override constraints.
- Credentials stay server-side. The adapter uses a fixed HTTPS endpoint, timeout and output budget. Provider error bodies are not returned or logged.
- No authentication, persistence, generated apps, ZIP export, deployment or maintenance execution was added. Intake state lasts only in the open page.

Observed checks on October 31, 2026:

| Check | Observed result |
|---|---|
| `pnpm install --frozen-lockfile` | Passed after explicitly allowing the pinned resolver's setup script |
| `pnpm typecheck` | Passed |
| `pnpm lint` | Passed after correcting a Next.js navigation rule and anonymous config export |
| `pnpm test` | 36 tests passed across contracts, filtering, API and mocked Meta HTTP behavior; fixtures are labeled |
| `pnpm build` | Passed; home page and recommendation endpoint built |
| `pnpm test:e2e` | 2 passed in real headless Edge at desktop and 390px mobile sizes; unknowns, rejection and configuration state exercised |
| `pnpm smoke:meta` | Skipped: no real key configured; not an integration pass |

Initial failures: registry access required network permission; pnpm's first install stopped for an unreviewed dependency setup script; initial restricted check attempts could not create pnpm's local links. Installation completed with permission and the reviewed script enabled. Lint's two findings were fixed. No known failing application checks remain. Screenshots in ignored `test-results/` were inspected for mobile layout; browser tests assert no horizontal overflow.

Known limitations: budget fit and provider eligibility are unverified, not guaranteed by filtering. Idea text and existing services are context; non-negotiable requirements must be declared explicitly. Free-form hard requirements outside the recognized catalog vocabulary are conservatively rejected. Meta ranking is implemented but live behavior/account access remains unverified. ESLint 9.39.4 is deprecated upstream but pinned because the installed React/accessibility plugins declare ESLint 9 compatibility; lint passes. Public deployment will need access/usage controls before exposing paid model requests.

Run: `pnpm dev`, then open `http://localhost:3000`. See `README.md` for configuration, example inspection paths and all check commands.
