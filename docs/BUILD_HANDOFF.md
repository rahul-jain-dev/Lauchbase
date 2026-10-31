# LaunchBase — Implementation Chat Handoff

## Purpose and authorization

This is the implementation handoff for a project the user has selected for the Meta Global AI Developer Hackathon. The original chat remains for planning, product decisions, scope, and judging strategy. The new chat should implement the agreed product, not restart brainstorming or revive discarded ideas.

**User-selected implementation folder:** `E:\Meta AI Hackathion`. Preserve that exact path and spelling. In the new chat, attach/open this directory as the local project and keep application work there. Planning documents can be copied into its `docs` subfolder as `PROJECT_PLAN.md` and `BUILD_HANDOFF.md`.

The user explicitly requested a dedicated folder on their laptop and a separate implementation chat. The planning chat supplies milestone prompts and setup guidance; the implementation chat performs the requested milestone in that folder. Follow the latest milestone prompt rather than attempting the entire application at once. The initial milestone is workspace and tool setup. No implementation source code has been created by the planning chat.

## Source of truth

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

- Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui.
- Zod/JSON Schema for shared contracts and model output validation.
- Supabase PostgreSQL, Auth, and private Storage for platform records and artifacts.
- Meta Model API: Muse Spark for intake and routine explanations; Muse Wonder for difficult code adaptation and maintenance, subject to actual account access.
- A small explicit TypeScript workflow; Inngest for durable background steps.
- Versioned template/module files for deterministic project assembly.
- Vercel Sandbox for isolated verification; disposable Docker adapter as a local alternative.
- Vitest, Playwright, TypeScript, and ESLint for relevant checks.
- GitHub/Actions for source, public submission, and maintenance checks; Vercel for platform hosting.

Use a server-side Meta adapter. Keep model selection configurable and verify current official API details before integration. Never silently replace Meta inference with another provider or hardcoded outputs. If access is missing, continue independent scaffolding and request the missing configuration while accurately reporting what is unverified.

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
