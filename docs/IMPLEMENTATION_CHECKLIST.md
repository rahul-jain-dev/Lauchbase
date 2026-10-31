# LaunchBase implementation milestone checklist

This checklist tracks the agreed plan. A milestone is complete only when its exit evidence exists; planned features are not reported as built.

## 0. Workspace setup

- [x] Confirm the implementation folder and inspect existing files.
- [x] Read `PROJECT_PLAN.md` and `BUILD_HANDOFF.md`.
- [x] Check applicable workspace instructions.
- [x] Check Node.js, Git, and package-manager availability.
- [x] Initialize Git and add a baseline ignore file for credentials and build output.
- [x] Add this checklist and root `IMPLEMENTATION_STATUS.md`.
- [ ] Verify Meta Model API account/model access and available credits.
- [ ] Verify Supabase project access.
- [ ] Verify Vercel deployment and Sandbox access, or confirm Docker is usable.
- [ ] Verify Inngest account access.
- [ ] Verify GitHub repository/Actions access when needed.

## 1. Core vertical slice — idea to verified Preset A archive

- [x] Define shared Zod contracts for requirements, constraints, assumptions, clarification, catalog modules, recommendations, and verification results (Milestone 1A).
- [ ] Extend contracts for durable runs and generated setup instructions during later milestones.
- [x] Create a small versioned catalog with source links, review dates, compatibility, and planned verification state. These are definitions only.
- [x] Build idea and builder-profile intake with targeted questions and editable assumptions.
- [x] Apply deterministic hard-constraint filtering before Meta-powered ranking and catalog-grounded explanation; validate model selections.
- [x] Add server-only Meta adapter and explicit missing-configuration/error states, with placeholder environment files.
- [x] Verify Milestone 1A locally: typecheck, lint, production build, 36 fixture tests and desktop/mobile browser flow.
- [ ] Validate a real Meta call using our account; no real key is currently configured.
- [ ] Implement Preset A: individual accounts, protected dashboard, and working CRUD example.
- [ ] Generate a real project with manifest, source/license attribution, setup docs, agent handoff, and lockfile.
- [ ] Run the generated project in an isolated environment and record actual check results and timestamps.
- [ ] Produce a personalized setup guide and actionable pending/failure states.
- [ ] Export a downloadable ZIP; keep unconfigured external integrations marked pending.
- [ ] Demonstrate one idea from validated requirements through a generated, checked archive.

## 2. Team/client-portal preset

- [ ] Implement workspace, invitation/member-role, and tenant-scoped example flows.
- [ ] Generate Preset B with its distinct schema, policies, setup instructions, and extension notes.
- [ ] Exercise isolation using two separate accounts/workspaces and record evidence.
- [ ] Show comparison trade-offs and reject unsupported hard requirements visibly.

## 3. Persistence, durable runs, and dashboard

- [ ] Persist projects, requirement revisions, selections, catalog versions, runs, setup progress, artifacts, and verification evidence.
- [ ] Add durable workflow stages, run identifiers, bounded retries, and resumable progress.
- [ ] Keep code verification, external service setup, and integration verification as separate statuses.
- [ ] Add artifact retrieval/download and a setup doctor for missing/broken configuration.

## 4. Catalog maintenance proof

- [ ] Monitor one approved upstream change path.
- [ ] Reproduce a controlled compatibility failure in a candidate workspace.
- [ ] Use Meta tool calls to diagnose/propose a real patch and explanation.
- [ ] Run relevant checks with a bounded repair limit and retain evidence.
- [ ] Produce a reviewable candidate release; require maintainer action to publish.

## 5. Release and hackathon submission

- [ ] Freeze features and run the end-to-end checks for both presets and maintenance proof.
- [ ] Deploy the public application and verify submission links.
- [ ] Publish source, reproducible instructions, attribution, and evidence.
- [ ] Record a concise demo that distinguishes measured results from hypotheses.
- [ ] Submit before the supplied deadline: November 4, 2026, 9:00 PM Eastern / November 5, 2026, 7:30 AM IST.

## Stretch and later — only after required milestones

- [ ] File-processing preset with private uploads, persistent job states, bounded retry, and result retrieval.
- [ ] Explicit GitHub repository export after ZIP export works.
- [ ] Additional stacks/providers only after each exportable combination is integrated and verified.
- [ ] Propose migrations for customized customer repositories with conflict handling and regression evidence.
