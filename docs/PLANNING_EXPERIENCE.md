# Requirement-to-foundation planning — November 1, 2026

## Implemented boundary

The flow is **Describe idea → Review understanding → Confirm scope → Foundation plan and project map → Build/setup preview**. Code generation, installation, cloud connections, executable verification, ZIP export and deployment are not implemented here. The existing catalog still describes intended foundations; none is a verified generated application.

Analysis contract `scoped-fixed-fields-v4` retains the seven fixed fields, exact excerpts and unknown branches, and adds category/dependency metadata to additional requirements. Domain importance is separate from category and coverage: essential workflows remain essential custom development. Categories distinguish foundation capabilities, product workflows, external integrations, technical constraints and unresolved needs. User confirmation is required before proposals enter the requirements profile. Explicit answers remain authoritative; conflicts require an explicit decision. Confirmed model-sourced scope retains an exact excerpt from the current idea. Scoped identifiers are unique, and essential edits/removals require confirmation.

The deterministic filter checks scoped dependencies as well as existing hard requirements. Workflows using supported records/workspace/private-file infrastructure can fit a foundation without their business screens being present. Essential external integrations, payments and background execution remain unsupported. Unknown dependencies require clarification. Project-level client permissions are a material authorization extension/decision: workspace membership is not equivalent. Privacy and authorization are not cosmetic customizations. Known technical constraints can be explicitly mapped to supported TypeScript/Next.js/self-hosted Node choices; Python-only is rejected, unknown constraints require clarification, and conflicting explicit choices are not silently overwritten.

Saved database records persist without a background worker. Background work is explained with scheduled reminders, batch processing and long-running tasks. Budget unknown and zero remain distinct and no price/free-tier fit is claimed.

## Plan and map

`src/lib/foundation-plan.ts` creates and validates `foundation-plan-v1` from confirmed requirements and approved catalog selection. It includes catalog/module versions, internal capability IDs, proposed configuration, custom work, user exclusions, technology roles and source needs, unresolved setup/security decisions, build readiness, planned files and verification steps. It contains no Settings API key or inference connection configuration. A model cannot add a catalog module by writing an explanation: catalog selection/validation remains server-side, and plan content is derived from catalog facts and requirement mappings.

The page shows **“Proposed foundation — code has not been generated.”** only after scope confirmation. Edits mark the previous plan outdated and require confirmation/recalculation. Review remains before the plan in document order. Advanced technology controls remain collapsed initially. Timing tools, raw JSON, contract IDs and inference attribution are in **Settings → Developer diagnostics**; historical results retain their original provider/model metadata. Provider attribution is separate from generated-product technology choices.

The project map has two connected views: application architecture, and development/run workflow. Accessible native expandable nodes and direction/meaning lists are the same information on desktop and mobile; mobile uses one vertical column. Nodes are derived from selected capabilities and explicit tool choices, not a fixed count. They explain purpose, requirement, relationships, choice status, user-reported ownership, setup, planned verification, unchecked cost and next action. Owning an account never marks it configured or verified. Cursor, ChatGPT, Codex and repositories are optional explicit development choices, never universal dependencies. No storage-to-file estimates or invented prices are shown.

“Review build plan” works: it shows the configuration, planned module/file list, custom workflows, external setup and planned checks. OS/editor/assistant/repository choices are collected at this stage. The versioned blueprint is also available in Developer diagnostics for inspection by the next implementation milestone; there is no fake Build/Download action or progress animation.

## Acceptance evidence

Deterministic/fixture tests cover the agency portal with essential deliverable reviews, milestone approvals, private files and project-level access needs; an individual contact manager; ambiguous booking; essential Salesforce; scheduled workflow dependencies; supported/unsupported technical constraints; unknown/conflicting dependencies; explicit answers; map ownership/verification; current/stale plans; and both map views/build review. The agency case selects the team infrastructure after correct user confirmation, retains essential custom work and explicitly lists permission extensions. Salesforce and scheduled work remain blocked even when categorized as workflows.

Screenshots are **browser fixtures**, not live provider or generated-project evidence:

- `docs/screenshots/planning-application-desktop.png`, `planning-application-mobile.png` — application plan, custom work, private files and permission gap.
- `docs/screenshots/planning-development-desktop.png`, `planning-development-mobile.png` — development choices and build review.
- `docs/screenshots/planning-map-desktop.png`, `planning-map-mobile.png` — focused expandable development map, ownership separate from verification.

The focused map screenshots were visually inspected; browser checks assert no horizontal overflow at desktop and 390 px mobile. Typecheck, lint, production build and 152 tests across 10 files passed. All 20 desktop/mobile Edge scenarios passed, including essential text corrections retaining the original proposal identity without reappearing as unreviewed. Typecheck caught a misplaced variable in the final correction-retention edit; it was fixed before the passing build/browser rerun.

## Actual live evidence — separate from fixtures

The user invoked the real checks from their private Settings session. The selected profile was **OpenRouter**, requested/reported model **`nvidia/nemotron-3-ultra-550b-a55b`**. This differs from the earlier 3.5 Super free model by the user's Settings selection; no automatic provider/model switch was implemented. It is not native Meta validation. Combined compatibility version: `scoped-fixed-fields-v4/scoped-catalog-ranking-v2/representative-v2`.

Representative Settings analysis passed in **3,803 ms** and ranking in **1,363 ms**, HTTP 200, normal completion. Safe files: `settings-analysis-1793481480920.json`, `settings-ranking-1793481482522.json` in ignored `artifacts/provider-diagnostics/`.

All five new case calls returned HTTP 200, completed normally and passed the wire/domain/excerpt checks. Their semantic accuracy is **not** implied by that success:

| Case | Elapsed | Safe observed findings | Hypothetical catalog result if confirmed |
|---|---:|---|---|
| Individual contact manager | 2,993 ms | Fixed-field checks passed, but extra foundation/integration interpretations and unknown/private-file dependencies need review. This is not a fully correct semantic pass. | Unsupported due to additional interpretation; correct the interpretation explicitly before selecting infrastructure |
| Agency reviews/approvals/private uploads | 2,532 ms | Preserved essential workflow category plus infrastructure/security needs. Payments and uploads failed expected-value checks. | Team remained eligible; clarification needed. Correct user-confirmed answers produce the fixture-tested team plan with custom work and permission gap |
| Ambiguous ticket booking | 1,786 ms | Account/capability fields stayed unknown; workflow interpretation also proposed workspaces/project permissions that are not established by the short idea. Limited field checks passed, not full meaning certification. | Clarification needed; no final plan before answers |
| Required Salesforce integration | 1,758 ms | Integration preserved with external-service dependency; payments failed expected-value check. | Unsupported correctly; preservation of the essential integration is successful extraction even though another answer was wrong |
| Scheduled workflow | 3,405 ms | Workflow and background dependency preserved. Payments/uploads exclusions failed expected-value checks. | Unsupported correctly; scheduled execution is not reclassified as ordinary saved data |

Case reports: `analysis_case-1793482000450.json`, `analysis_case-1793482003494.json`, `analysis_case-1793482006340.json`, `analysis_case-1793482008183.json`, `analysis_case-1793482014049.json`. These are UTC October 31 / India November 1 observations. Reports contain only approved metadata, category counts, dependency codes, field/rule codes, timing/status and hypothetical catalog assessment; no keys, cookies, raw idea/response content or reasoning text. The assessment's `extractionPassed` flag tests a limited authored predicate set; it does not validate every inferred dependency or extra requirement. Extra interpretations are explicitly called out above rather than counted as full semantic success.

## Remaining limitations and next milestone

The selected model still misreads explicit negation and overinterprets dependencies. Human review/correction remains necessary; no semantic-accuracy guarantee, alternate-model fallback or native Meta success is claimed. Requirements/plans are held only in the current page session. Account eligibility, usage costs and real service configuration are unverified. Foundation verification remains planned, and project-level client authorization still needs implementation/testing.

Next: consume the validated versioned blueprint in a real assembler; build actual core/workspace/private-file modules and pinned lockfile, preserve custom-work/permission gaps, generate an actual ZIP, execute checks and create OS/tool-specific setup and handoff instructions. Revalidate scope, catalog versions and blockers server-side before assembly. No broad dashboard/provider expansion is needed for that step.

Actual implementation issues encountered: old fixture assumptions/selectors were updated for the new confirmation sequence and collapsed developer evidence. Hidden diagnostic JSON caused broad text selectors to match twice; tests now scope assertions to the visible plan/node. A test rerun initially collided with the still-running test server and was restarted after it exited. A cached Turbopack/PostCSS worker failure occurred in restricted and normal runs; production caches were preserved under ignored `artifacts/planning-build-cache-backup/`, leaving development session keys/cache intact, and the build then passed. ESLint now explicitly excludes ignored generated artifacts rather than linting preserved build-cache JavaScript.
