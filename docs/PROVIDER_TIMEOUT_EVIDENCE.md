# Provider timing and analysis-reliability evidence

## Current scoped-planning evidence — November 1, 2026 (India)

Current contract: `scoped-fixed-fields-v4/scoped-catalog-ranking-v2/representative-v2`. The user explicitly selected **OpenRouter / `nvidia/nemotron-3-ultra-550b-a55b`**; requested/reported model agree in every new report. This supersedes earlier current-status references to the 3.5 Super free model below, which remain historical evidence. No automatic provider/model switch occurred, and native Meta is not verified by gateway calls. Timeouts, session isolation, approved endpoints and credential protections are unchanged.

User-triggered private Settings-session checks passed actual analysis in **3,803 ms** and ranking in **1,363 ms**, HTTP 200, finish `stop`. Safe report filenames: `settings-analysis-1793481480920.json`, `settings-ranking-1793481482522.json` under ignored `artifacts/provider-diagnostics/`.

All five case calls returned HTTP 200, finish `stop`, one attempt, successful wire/domain/excerpt validation. These are structural successes; the model still made semantic errors:

| Case / safe report suffix | Time | Semantic evidence; catalog assessment is hypothetical if confirmed |
|---|---:|---|
| Individual / `1793482000450` | 2,993 ms | Limited fixed-field predicates passed; extra integration/private-file/unknown dependencies require review and caused unsupported catalog outcome |
| Agency / `1793482003494` | 2,532 ms | Workflow/infrastructure/security needs preserved; `billing` and `uploads` → `representative_value_mismatch`; team eligible, clarification needed |
| Ambiguous booking / `1793482006340` | 1,786 ms | Core unknowns retained; extra workspace/project-permission interpretation not established by the short idea. Limited field-check pass is not full semantic success |
| Salesforce / `1793482008183` | 1,758 ms | Essential integration/external-service dependency preserved and correctly unsupported; `billing` → `representative_value_mismatch` |
| Scheduled / `1793482014049` | 3,405 ms | Essential workflow/background dependency preserved and correctly unsupported; `billing` and `uploads` → `representative_value_mismatch` |

Case files are `analysis_case-<suffix>.json`, UTC October 31 21:26:40–54 / November 1 IST. Only allowlisted metadata, categories/dependencies, paths/rule codes, timings/status and hypothetical catalog assessment are saved. No key, cookie, raw idea/provider response, excerpts or reasoning text is recorded. HTTP 200 does not establish correct meaning, and the authored `extractionPassed` flag covers only a limited predicate set. Review/correction remains required; no invented requirement is silently dropped or repaired. Fixtures separately demonstrate the correctly confirmed agency plan and preserved unsupported dependencies. Full findings, screenshots and next milestone: [PLANNING_EXPERIENCE.md](PLANNING_EXPERIENCE.md).

## Historical analysis-reliability investigation — before scoped planning

This section supersedes the historical claim below that no full analysis has succeeded. All new live calls used the Settings-session **OpenRouter** connection, requested and reported **`nvidia/nemotron-3.5-super-vl:free`**. No provider/model was selected automatically; keys/cookies never entered tools, reports, logs or prompts. Timeouts/retries and session/endpoint protections were preserved. HTTP success, application validation and representative semantic accuracy remain separate.

### Exact failure and correction

Actual original-contract analysis at **2026-10-31 20:01:14.976 UTC / November 1, 01:31:14.976 IST** took **7,263 ms**, HTTP 200, finish `stop`, 660 output tokens, zero reasoning tokens, one attempt. It failed **wire-schema validation**, code **`too_small`**, paths **`proposals.5.excerpt`** and **`proposals.7.excerpt`**. Both excerpts were below eight characters; no content was recorded. Ignored report: `artifacts/provider-diagnostics/analysis-1793476874976.json`. An earlier semantic report recorded `invalid_excerpt` without a field path. A later original-format run passed in 2,086 ms, showing variability rather than proving reliability.

The portable schema omitted string-length constraints; generic values and array uniqueness relied largely on prose/later checks. This allowed short excerpts that runtime validation correctly rejected. `fixed-fields-v3` now requires seven named fields with field-specific enum values and separate additional requirements. Unknown branches require unknown value/kind, false essential and null excerpt; known branches require a string excerpt. Literal constraints survive portable conversion as enums. Prompt instructions require exact complete clauses/sentences of at least eight characters and distinguish skills/experience from stack preference. Runtime length/exact-substring checks remain enforced: there is no excerpt repair, requirement dropping, automatic confirmation or catalog accommodation. Portable string-length omissions remain documented; schema validity alone cannot guarantee provenance or meaning.

Settings uses real `analyzeIdea` and `rankFoundations` in separate bounded requests. Authentication, discovery, analysis and ranking have independent visible outcomes. Both representative operations must pass before activation. Key/profile/model/approved-endpoint or contract changes invalidate proof; current combined version is **`fixed-fields-v3/catalog-ranking-v1/representative-v2`**. These are example checks, not a guarantee for future inputs. Safe errors now retain wire/domain/semantic stage, allowlisted path/rule, reported model and completion/timing metadata without rejected values.

### Final live outcomes

All six final requests returned HTTP 200, finish `stop`, zero reasoning tokens, one attempt, on the same requested/reported model above. Settings representative analysis passed actual validation and authored checks in **2,060 ms**; foundation ranking passed schema/catalog validation in **552 ms**. Reports: `settings-analysis-1793477722193.json`, `settings-ranking-1793477722817.json` under ignored `artifacts/provider-diagnostics/`.

The four authored cases do not confirm real user answers. Catalog results are hypothetical **only if a user confirmed the extracted requirements**.

| Case, UTC start October 31 (November 1 IST) | Total | Application validation | Representative semantic findings | Hypothetical catalog result |
|---|---:|---|---|---|
| Individual contact manager, 20:15:29.557 | 1,430 ms | Passed wire/domain/excerpts | Field checks passed; knowing Python did not become a required stack | Individual eligible; rules-only state `provider_configuration_required` does not describe session authentication |
| Agency/private uploads, 20:15:31.066 | 1,449 ms | Passed wire/domain/excerpts | Team/uploads recognized; `billing` and `background` failed `representative_value_mismatch` against explicit negatives | Team eligible; clarification still needed |
| Ambiguous booking, 20:15:32.552 | 6,102 ms | Passed wire/domain/excerpts | Four account/capability unknowns preserved; one extra essential interpretation needs review. Field checks passed, not full semantic certification | Unsupported if that extra need is confirmed; it was retained |
| Essential Salesforce integration, 20:15:38.722 | 1,511 ms | Passed wire/domain/excerpts | Authored checks passed; essential integration and explicit negatives preserved | Unsupported correctly; successful extraction does not imply catalog support |

Case report filenames: `analysis_case-1793477729557.json`, `analysis_case-1793477731066.json`, `analysis_case-1793477732552.json`, `analysis_case-1793477738722.json`. Assessment stage/version: `representative_semantics` / `representative-cases-v2`. No raw ideas, generated content, excerpts or reasoning text are recorded.

The earlier v2 Settings run passed analysis/ranking in 1,907/704 ms; its unsupported case missed billing/uploads/background negatives. An initial assessment incorrectly called every additional requirement invented, including an agency need. That overstrict assessment was corrected to retain extra needs for review; old reports were not rewritten as passes. Final v3 still missed agency negatives and produced an extra ambiguous interpretation. **The structural mismatch is addressed and representative analysis/ranking succeeded; general semantic reliability is not established.** Native Meta/Gemini/OpenAI/NVIDIA were not live-verified by these gateway calls.

### Automated evidence and actual issues encountered

Typecheck, lint and **144 tests across nine files passed**. Tests use labeled synthetic provider responses and mocked evidence-file writes, separate from live files. New checks cover fixed fields/enums/literals, exact excerpt failure paths, unknowns, explicit overrides, unsupported needs, skills/preferences, dual-operation readiness, failed analysis with passed ranking, version invalidation, sessions and redaction. Final build/browser results are recorded in `IMPLEMENTATION_STATUS.md`.

Initial checks failed against old array/ranking-only fixtures; fixtures were migrated without weakening production validation. A fixture helper's index typing/unused fields were corrected. A production build later hit a cached Turbopack/PostCSS worker panic both with restricted and normal permissions; preserving `.next/cache/turbopack` and `.next/build` in ignored `artifacts/build-cache-reliability-backup/` resolved it. Development session cache and keys remained intact. A browser assertion expected the old credit-warning wording and was updated before rerunning.

## Historical timeout investigation — October 31, 2026

## Connection trace

The idea screen posts confirmed form data to `/api/analyze`. The route resolves its opaque HttpOnly cookie with `resolveConnection(request)`, checks the active session's exact tested selection, and passes a copied provider/model/key configuration explicitly to `analyzeIdea` → `requestStructured` → the selected adapter. The same path is used by the full-analysis timing diagnostic. The OpenRouter profile fixes the destination to `https://openrouter.ai/api/v1`; the key is used only in its authorization header. There is no environment or provider fallback. Connection tests cover the actual route handlers, selected model and authorization using labeled synthetic keys; they are separate from the live reports below.

## Observed live comparison

The user invoked the comparison from their own browser session. Reports were saved by the application; the implementation tools never accessed the session cookie or key. Only allowlisted timing and status fields are recorded, without idea or response text.

Provider/profile: **OpenAI-compatible / OpenRouter**. Requested/reported model: **`nvidia/nemotron-3.5-super-vl:free`**. These calls do not verify direct Meta, native Gemini or direct NVIDIA endpoints.

| UTC start | Request | Total | DNS | Headers | Body | HTTP | Application outcome |
|---|---|---:|---:|---:|---:|---|---|
| 2026-10-31 15:26:32.096 | Minimal structured check | 1,512 ms | 72 ms | 797 ms | 641 ms | 200 | Passed schema validation |
| 2026-10-31 15:26:33.801 | Actual idea-analysis prompt/schema | 30,045 ms | 51 ms | 343 ms | 29,637 ms | 200 | Failed: `truncated`; output budget exhausted, no interpretation accepted |
| 2026-10-31 15:31:49.299 | Minimal, optional reasoning disabled | 454 ms | 49 ms | 281 ms | 116 ms | 200 | Passed; finish `stop`, 6 output tokens, 0 reasoning tokens |
| 2026-10-31 15:31:49.812 | Actual analysis, optional reasoning disabled | 2,321 ms | 2 ms | 285 ms | 2,027 ms | 200 | Failed: `invalid_output` at schema validation (4 ms); finish `stop`, 330 output tokens, 0 reasoning tokens |
| 2026-10-31 15:35:32.438 | Minimal, optional reasoning disabled | 1,062 ms | 80 ms | 916 ms | 63 ms | 200 | Passed; finish `stop`, 6 output tokens, 0 reasoning tokens |
| 2026-10-31 15:35:33.544 | Actual analysis, optional reasoning disabled | 3,263 ms | 33 ms | 605 ms | 2,620 ms | 200 | Failed: `invalid_output` at application semantic validation (1 ms); finish `stop`, 496 output tokens, 0 reasoning tokens |

All six calls made one attempt, using the same selected provider/model. The initial analysis completed just beyond the former 30-second server limit; it also exhausted the configured 4,096-token budget. Waiting for the response body dominated; DNS, headers and local validation were not the observed bottleneck. Non-streaming gateway headers can arrive before upstream generation is complete, so body time includes upstream generation/queue/delivery and does not isolate pure model compute. Reasoning consuming the shared budget was a plausible cause, not directly proven by this first report because token-usage counts were not yet recorded.

## Reviewed parameter adjustment

After the reasoning adjustment, both repeated analyses completed quickly without truncation or retries, but neither was accepted: one violated the runtime schema, the next passed the schema and failed semantic checks. At the end of that historical timeout work, no full analysis had succeeded; the current contract and live results above supersede that status. The timeout/latency symptom has improved in observed runs; increasing the deadline alone was not the evidence. The first schema failure predates sanitized field-path recording, and the later semantic failure predates per-rule recording, so these reports do not identify a specific field/rule. Current diagnostics record bounded allowlisted paths and application rule codes without values. No validation was weakened to manufacture success. Provider load and stochastic outputs mean these few requests are observations, not a latency benchmark or reliability guarantee.

The [OpenRouter reasoning documentation](https://openrouter.ai/docs/guides/best-practices/reasoning-tokens) explains that reasoning and visible output share the Chat Completions token budget. Its public `GET /api/v1/models` was checked separately (HTTP 200, no key): this exact free model advertises `reasoning`, `structured_outputs`, and `reasoning.mandatory: false`. No supported effort levels were supplied. The [NVIDIA model guide](https://docs.nvidia.com/nim/large-language-models/2.0.13/get-started/advanced/get-started-nemotron-3.5-super-vl.html) documents default-on reasoning, shorter modes and disabling thinking. NVIDIA native fields are not sent to OpenRouter.

For only the reviewed OpenRouter IDs `nvidia/nemotron-3.5-super-vl` and `nvidia/nemotron-3.5-super-vl:free`, the adapter now sends the documented gateway control `reasoning: { enabled: false }` for this bounded extraction/ranking task. The 4,096-token limit and strict schema remain unchanged. Other gateway models retain their existing defaults; no universal reasoning-parameter support is assumed. Safe telemetry records finish reason and provider-reported token counts when present, never reasoning text.

Native Meta retains its documented `reasoning_effort: minimal`. Native Gemini 3.8 Flash uses `thinkingConfig.thinkingLevel: LOW` for extraction/ranking, as supported by the [model guide](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash) and [generateContent reference](https://ai.google.dev/api/generate-content#ThinkingConfig). No thinking-level parameter is sent to older or unknown Gemini models. These native changes have fixture coverage; no native live verification is implied.

## Deadline and error behavior

- Generation: 90-second attempt default, 120-second overall deadline including DNS, body and retry waits. Configurable server-side; hard ceiling 150 seconds. At most two attempts, only for transient timeout, known connection resets, retryable 5xx/408 or rate limiting. Retry-After seconds and dates are honored; a wait exceeding the remaining budget returns the error rather than retrying early.
- Discovery: independent 10-second attempt and 30-second total defaults, shared across authentication and pagination. Its hard ceiling is 60 seconds.
- Authentication, billing exhaustion, access denial, unsupported parameters/models, refusals, invalid output and truncation are not retried. No provider/model fallback occurs. A timeout is classified separately from schema/semantic validation failure.
- Intake and Settings browser calls now allow 170 seconds; routes declare `maxDuration = 180`. The installed Next.js documentation describes this as a deployment-platform duration hint, not a guarantee against hosting/proxy limits. No shorter configured project route/proxy limit was found. Client progress always clears in `finally`; input and confirmed-answer state remain intact after failure.
- Timings include requested provider/model/profile, UTC start, HTTP status per attempt, phase times, retry waits and final classification. No upstream error body, prompt, key or cookie is returned or logged.

## Automated evidence

Automated transport, session and UI cases use explicitly labeled fixtures and do not establish actual provider latency or availability. Final check counts and any later live comparison are recorded in `IMPLEMENTATION_STATUS.md`.
