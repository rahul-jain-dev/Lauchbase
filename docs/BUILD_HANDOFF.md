# LaunchBase — Implementation Chat Handoff

## Immediate submission override — November 5, 2026

The final submission name is **SaaSFoundation** (previously Skeleton AI and LaunchBase), with tagline **From an idea to a buildable foundation.** The full roadmap is preserved but on hold. Work on `codex/submission-sprint`; read `docs/SUBMISSION_SPRINT.md` and `docs/HACKATHON_SUBMISSION.md` first. The user authorized this sprint's deployment and actual submission using available approved access. Verify the current clock and authenticated portal; working cutoff is 07:30 IST. Do not build generation, exports, dashboards or new providers during the sprint.

PR #1 was inspected and integrated on the submission branch with history preserved. Native Meta smoke currently skips for missing credentials; direct Meta, deployment, final video and portal receipt remain unverified until actual evidence exists. `render.yaml` prepares one Node process, not serverless replicas. Settings and inference must use the trusted configured public origin (`APP_ORIGIN` or Render's server-provided URL), preserving foreign-origin rejection and Secure cookies. Never relax protections to make a proxy work.

## Purpose and authorization

This is the implementation handoff for a project the user has selected for the Meta Global AI Developer Hackathon. The original chat remains for planning, product decisions, scope, and judging strategy. The new chat should implement the agreed product, not restart brainstorming or revive discarded ideas.

**User-selected implementation folder:** `E:\Meta AI Hackathion`. Preserve that exact path and spelling. In the new chat, attach/open this directory as the local project and keep application work there. Planning documents can be copied into its `docs` subfolder as `PROJECT_PLAN.md` and `BUILD_HANDOFF.md`.

The user explicitly requested a dedicated folder on their laptop and a separate implementation chat. The planning chat supplies milestone prompts and setup guidance; the implementation chat performs the requested milestone in that folder. Follow the latest milestone prompt rather than attempting the entire application at once. The initial milestone is workspace and tool setup. No implementation source code has been created by the planning chat.

## Source of truth

For cloud/Linux continuation, the repository-local files are authoritative and complete. Read root `AGENTS.md`, `IMPLEMENTATION_STATUS.md` and [CLOUD_DEVELOPMENT.md](CLOUD_DEVELOPMENT.md). Use the actual checkout root; the original Windows locations below are provenance and do not require access to this laptop. Cloud preparation preserves the existing product milestone; no deployment or generation was added.

Read the full plan. If these documents have been copied into the implementation project's `docs` folder, use the sibling `PROJECT_PLAN.md`. The original source is:

`C:\Users\rahul\Documents\Codex\2026-10-26\new-notification-for-meta-global-ai\outputs\LaunchBase_Meta_Hackathon_Project_Plan.md`

Plan date: October 31, 2026. Check the actual date when resuming and adjust the work sequence accordingly. The supplied submission deadline is November 4, 2026, 9:00 PM Eastern / November 5, 2026, 7:30 AM IST. Target completion and submission on November 4 with margin.

## Agreed product

Working name: **LaunchBase**; the name is provisional and has not been checked for availability.

Audience: solo micro-SaaS builders and freelancers building small SaaS products for clients.

Promise: describe your idea, experience, budget, hosting preferences, and requirements; receive a suitable working foundation, the reasons for its technology choices, personalized setup instructions, and a clear handoff for a person or coding agent to extend it.

The product should select existing maintained technology based on the builder's actual constraints. For example, when Supabase is the selected database/service provider, provide the exact setup steps, connection configuration, migrations, verification, and troubleshooting required for that generated project.

We selected this idea after dropping VoiceHub, general desktop automation, generic issue solvers, testing-service proposals, dataset-builder proposals, and unrelated creative concepts. Do not treat any of those as active requirements.

## MVP scope

Build:

1. Idea and builder-profile intake with targeted clarification and editable assumptions.
2. A small versioned catalog of supported foundations/modules and official-source facts.
3. Deterministic compatibility filtering, followed by Meta-powered ranking and explanations.
4. Two required configurations: individual-user SaaS and team/client-portal SaaS.
5. Real project generation, lockfiles, module manifest, and ZIP download.
6. Personalized beginner/concise setup instructions, setup progress, and diagnostic checks.
7. Actual code verification with timestamped evidence and clear failure/pending states.
8. Coding-agent instructions, architecture notes, extension points, and the next implementation tasks.
9. Saved projects and a dashboard with run/artifact/version history.
10. One real maintenance path: detect a supported change, propose a patch using Meta, verify it, and produce a reviewable candidate catalog release.

A background file-processing preset and GitHub repository export are stretch features. ZIP export is required. Additional stacks/providers, automatic paid-account creation, the platform's own billing, and migration of arbitrary customized customer repositories are later work.

## Stack and implementation direction

### Current requirement-to-foundation planning — November 1, 2026

Read [PLANNING_EXPERIENCE.md](PLANNING_EXPERIENCE.md) and current root status before continuing. The implemented flow is Describe → Review → Confirm scope → Foundation plan/map → Build/setup preview. Scope distinguishes capabilities, custom workflows, integrations, technical constraints and unresolved needs; importance stays independent of coverage. Preserve exact evidence, explicit answers, confirmation of essential changes and stale-plan recalculation. Workflow dependencies still block unsupported integrations/jobs/payments; project-level client authorization is a material extension beyond workspace membership.

Current contracts: `scoped-fixed-fields-v4/scoped-catalog-ranking-v2/representative-v2`; catalog definitions `0.2.0-definition`; blueprint `foundation-plan-v1` in `src/lib/foundation-plan.ts`. The blueprint has capability IDs, module versions, setup/tool choices, custom work, blockers, planned files/checks and truthful readiness. Settings → Developer diagnostics holds attribution/timing/raw planning data; inference providers are not generated-product dependencies. No source/ZIP/cloud resources have been generated.

Live user-selected OpenRouter / `nvidia/nemotron-3-ultra-550b-a55b` passed representative analysis/ranking in 3.803/1.363 seconds. Five additional responses passed structure/excerpts but showed explicit-negation mistakes and extra inferred dependencies; see current evidence, not the historical v3 results below. No alternate provider was called. Direct Meta remains unverified.

**Next:** consume the blueprint in a real assembler. Revalidate requirements, catalog/module versions and blockers server-side; implement actual modules/lockfile, preserve essential custom work and client-permission extensions, create an actual ZIP, run isolated verification and generate OS/tool-specific setup/handoff. The team permission gap must not become a passing isolation claim. Do not mark the whole core slice complete or replace planned checks with fixture evidence.

### Historical analysis reliability — before scoped planning

The exact original failure was short excerpts: `wire_schema` / `too_small` at `proposals.5.excerpt` and `proposals.7.excerpt`, HTTP 200 with normal completion. `fixed-fields-v3` now uses seven named fields with field-specific enum/unknown branches and separate additional requirements, converting explicitly into the existing proposal array. Exact evidence, explicit-answer precedence, user review, unsupported essential needs, catalog validation and all credential/session/timeout protections remain enforced. Experience/skills do not become required stack preferences. Nothing is silently repaired, dropped or confirmed.

Settings calls real representative analysis and ranking separately, displays both outcomes alongside authentication/discovery, and requires both passes before activation. Current combined version: `fixed-fields-v3/catalog-ranking-v1/representative-v2`. Old ranking-only or changed connection/contract proof is invalid. Multiple API requests may consume credits; passing examples are not a guarantee for future inputs.

Live OpenRouter / `nvidia/nemotron-3.5-super-vl:free` passed representative analysis/ranking in 2.060/0.552 seconds. All four case responses passed application schema/exact-excerpt validation. Agency billing/background answers still missed explicit negatives; the ambiguous case retained an extra essential interpretation for review. Individual and Salesforce authored checks passed; Salesforce catalog rejection is correct independently of extraction success. General semantic reliability is not established. Direct Meta requires separate validation. See current status and `PROVIDER_TIMEOUT_EVIDENCE.md`; fixtures remain separate from live reports.

### Historical provider timeout investigation — October 31, 2026

Generation now has a server-configurable 90-second attempt / 120-second total default (150-second hard ceiling), with one bounded transient retry and Retry-After support. Discovery has independent 10-second attempts / 30-second total across pages. Browser intake and Settings waits are 170 seconds; inference routes declare 180 seconds. Timeout, truncation and validation errors remain distinct, progress clears, and confirmed form answers persist after failure. No authentication, billing, parameter or validation failure is retried and there is no fallback.

Use the expandable AI request timing tool for the active Settings session; it writes safe allowlisted reports under ignored `artifacts/provider-diagnostics/`. Keys, cookies, idea text and generated output never enter those reports. Live calls identified OpenRouter / `nvidia/nemotron-3.5-super-vl:free`: the original actual analysis took 30.045 seconds and truncated. After disabling optional reasoning for only the reviewed OpenRouter Nemotron 3.5 Super VL IDs, actual analyses completed in 2.321 and 3.263 seconds with HTTP 200 and zero reasoning tokens, but failed schema/semantic validation. **At that historical milestone, model-output adherence still blocked full analysis; the current contract/results above supersede that status.** No constraints were weakened. Do not claim direct Meta validation from these gateway calls. See `PROVIDER_TIMEOUT_EVIDENCE.md` and the current status for exact observations/check results. Safe field-path and per-rule diagnostics are now available for future validation failures; detailed model-quality changes were not manufactured into a passing test.

### Settings → AI connections milestone supersedes environment-only UI setup

Users now configure named Meta, Gemini, OpenAI and OpenRouter profiles through the app. The Settings dialog preserves intake state, lists provider models, tests a selected model and requires explicit activation. Keys exist only in server process session memory with an opaque HttpOnly SameSite cookie and eight-hour expiry. Reconnect after server restart. Changing a key/profile/model invalidates testing; disconnect/expiry never activates environment credentials or another provider.

Named endpoints and authentication have been checked against official documentation. Extra gateways use only an administrator-approved server endpoint profile, with a labeled manual model-ID path where listing is unavailable. Public settings requests cannot supply destination URLs. Model listing, authentication and model compatibility are separate evidence states. Both representative analysis and ranking checks must pass before readiness; both AI operations receive the same session configuration explicitly.

Environment-based smoke scripts remain optional CLI tools; browser inference uses only its activated session connection. Historical results retain their original provider/model/profile/timestamp. Automated checks use labeled fixtures. Later real OpenRouter examples and their limits are recorded above; those calls do not establish native Meta/Gemini/OpenAI compatibility. See the README and `docs/PROVIDERS.md` for current instructions.

### Updated model-provider decision — October 31, 2026

Provider selection is a permanent product capability. Gemini is the current development option while Meta billing is unavailable. Preserve direct Meta as the hackathon integration and validate it separately. An administrator-configured OpenAI-compatible Chat Completions endpoint is also supported under its documented protocol contract. Selecting Gemini explicitly is authorized; it must never be represented as direct Meta validation.

Shared prompts, application schemas, excerpt/confirmation logic, compatibility filtering and catalog validation live above provider adapters. Use server-only `AI_PROVIDER` and provider-specific model/key settings in ignored `.env.local`. Only the selected provider is called; no silent fallback or automatic routing. Native APIs outside the implemented adapters require additional work. Preserve result provider/model/timestamp independently of current active configuration.

Current implementation: `src/server/ai.ts`, `src/server/providers/`, and `src/lib/inference.ts`. Use `pnpm smoke:provider` for the selected CLI provider and `pnpm smoke:meta` for a separate direct-Meta check. Read `docs/PROVIDERS.md` for compatibility/evidence boundaries and README for configuration. The original environment-based milestone had no real credentials; later private Settings-session OpenRouter evidence is recorded above. Native Meta/Gemini/OpenAI remain live-unverified. No project generation, deployment, authentication, credential marketplace or model routing was added.

- Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui.
- Zod/JSON Schema for shared contracts and model output validation.
- Supabase PostgreSQL, Auth, and private Storage for platform records and artifacts.
- Meta Model API: Muse Spark for intake and routine explanations; Muse Wonder for difficult code adaptation and maintenance, subject to actual account access.
- A small explicit TypeScript workflow; Inngest for durable background steps.
- Versioned template/module files for deterministic project assembly.
- Vercel Sandbox for isolated verification; disposable Docker adapter as a local alternative.
- Vitest, Playwright, TypeScript, and ESLint for relevant checks.
- GitHub/Actions for source, public submission, and maintenance checks; Vercel for platform hosting.

Use the server-side provider abstraction and explicit selection described above. Keep the direct Meta adapter for hackathon validation. Verify current official API details before extending adapters. Never silently replace selected-provider inference with another provider or hardcoded outputs. If access is missing, continue independent work and accurately report what is unverified.

The generated-app stack is separate from the platform stack. Initially support the tested TypeScript family and the two presets; do not represent advisory alternatives as exportable verified integrations.

## Non-negotiable behavior

- “Best” means best supported fit within the evaluated catalog, with trade-offs and unsupported constraints disclosed.
- Distinguish code verified, external service configured, and integration verified.
- Do not mark a build with placeholders, a fixture, or a simulation as a verified live integration.
- Preserve source/license provenance and identify new hackathon contributions.
- Keep API keys out of source, generated archives, logs, and model prompts.
- Use disposable resources for candidate-code execution and tenant-isolation checks for team foundations.
- Catalog updates create candidates; publication requires explicit maintainer action. Do not overwrite users' customized projects.
- Provider eligibility matters. Stripe onboarding is not universally available; optional billing should not block the core vertical slice. Label fixture-based billing checks as simulated.
- No prize, absolute security, production-readiness, or measured time-savings claims without evidence.

## Start here

Inspect the implementation chat's actual working folder and applicable instructions. Preserve existing user work. If it is a fresh folder, create an appropriately scoped application directory. The planning chat's outputs are reference deliverables, not an application repository.

After the initial workspace/setup milestone, the first application milestone is this complete path:

**Idea → validated requirements → supported recommendation → generated Preset A → actual isolated build/checks → personalized setup guide → downloadable archive.**

Persist the core contracts early so intake, generator, verifier, and instructions cannot drift apart. Then add the team preset and maintenance proof. Do not spend the first milestone on cosmetic dashboards or numerous integrations while project export remains nonfunctional.

Validate account access early, but continue work that does not depend on missing credentials. Keep blockers specific. Record implementation status and significant decisions in the implementation repository so the user can bring concise updates back to the planning chat.

The final demo should show appropriate differences between two builder profiles, working generated code, and a clearly labeled controlled compatibility failure repaired through a real Meta/tool execution loop.
