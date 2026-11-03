# Model-provider integration

Decision: provider choice is permanent. The Settings milestone supersedes the earlier decision to defer user-facing connection setup. Users choose a connection through Settings, with keys stored only in server-side session memory. Direct Meta remains the hackathon integration and must be validated separately. There is no automatic fallback, automatic routing or permanent shared credential storage.

## Settings profiles and discovery

| Profile | Fixed base URL / auth | Model discovery | Authentication evidence |
|---|---|---|---|
| Meta | `https://api.meta.ai/v1`, bearer key | `GET /models`; documented response has no pagination | Successful protected model request; compatibility remains separate |
| Gemini | `https://generativelanguage.googleapis.com/v1beta`, `x-goog-api-key` header | `GET /models`, follows `nextPageToken` with `pageToken` | Successful key-authenticated model request; compatibility remains separate |
| OpenAI | `https://api.openai.com/v1`, bearer key | `GET /models`; preserves unknown capability metadata | Successful protected list request; list does not prove Chat Completions/schema support |
| OpenRouter | `https://openrouter.ai/api/v1`, bearer key | Private `GET /key` first, then model catalog `GET /models` | Public model listing alone never validates a key |
| Approved gateway | Administrator-approved HTTPS base only, bearer key | Explicit manual model-ID mode; no invented list | Unknown until a successful compatibility request |

Discovery normalizes IDs/names, supplied generation methods, output modalities, structured-output metadata and token limits. Missing fields remain `null`/unknown. Pagination is bounded to 20 pages and 10,000 entries; incomplete or repeated cursors fail rather than producing an invented complete catalog. Native models not previously allowlisted may be selected from the provider's list and tested; this is not a pre-existing compatibility claim. Known unsupported modality/API families are disabled. Meta Wonder still needs another API adapter. OpenRouter automatic router aliases are disabled, model requests are explicit, and its fallback preference is off.

The OpenAI named profile reuses the compatible adapter with `max_completion_tokens`; OpenRouter and the approved generic profile use `max_tokens`. All use the same application schemas and semantic checks. OpenAI Responses-only models, other native APIs and unapproved destinations are unsupported. Unknown text-model compatibility is decided by an actual explicit test, not by its name or presence in a list.

Settings distinguishes **listed**, **authentication verified**, **idea-analysis check**, **foundation-ranking check**, and **active**. Testing makes two separate bounded requests through real application functions; each may retry once for an existing transient failure and consume credits. Both representative checks must pass for the exact selected connection and current contract before activation. Credentials, profile/model, approved endpoint or analysis/ranking/test contract changes invalidate proof. Passing examples do not guarantee every future input succeeds. Failures retain separate safe diagnostics.

## Session storage and inference

The local single Node process stores keys in memory, keyed by a hash of a random 256-bit token. The browser stores only the opaque HttpOnly SameSite=Strict cookie (Secure on HTTPS). Sessions expire absolutely after eight hours; access rejects expired state, with minute cleanup. Cookie contexts are isolated. Key replacement rotates the token; disconnect clears the key and proof. A non-secret cookie may remain after disconnect; it cannot restore a key. Restarting the process loses all keys. Browser persistence, URL parameters, logs, model prompts and API response DTOs contain no key values.

Both browser AI routes resolve only the activated session config. They never read an environment key as fallback, even when the session is missing, disconnected or expired. Optional environment credentials are for CLI smoke scripts only. Historical inference metadata gains `profileId` for named OpenAI/OpenRouter attribution and remains independent of whichever connection is currently active.

Settings mutations require a same-origin JSON request and reject missing/foreign Origin and extra endpoint fields. Gateway validation, public-address checks and refused redirects remain in place. Expiry/disconnect or changes during a pending test cannot revive readiness. Keys are not permanently stored; the UI states: “Connection lasts for this session. Reconnect after the server restarts.”

## Settings verification evidence

The original Settings lifecycle, discovery, failure classification, model eligibility, session isolation, redaction and activation checks used synthetic provider responses. Browser Settings flows also use labeled fixtures. **No live provider request succeeded during the original Settings milestone.** Later timeout-investigation evidence is recorded below; a fixture pass remains separate from live verification.

## Current scoped-planning evidence — November 1, 2026

The user-selected **OpenRouter / `nvidia/nemotron-3-ultra-550b-a55b`** passed actual representative analysis/ranking in **3.803/1.363 seconds** using `scoped-fixed-fields-v4/scoped-catalog-ranking-v2/representative-v2`. Five subsequent cases passed structure/excerpts, but semantic checks exposed exclusion mistakes and extra inferred dependencies. Human review remains necessary; a structural pass is not general extraction accuracy. No automatic model/provider switch occurred. Direct Meta, native Gemini/OpenAI/NVIDIA remain separately unverified. See [current planning findings](PLANNING_EXPERIENCE.md) and [safe live evidence](PROVIDER_TIMEOUT_EVIDENCE.md). Old compatibility evidence is invalidated by the contract change.

Timing/raw data and historical attribution are in **Settings → Developer diagnostics**. These inference connections are separate from user-selected development tools and the proposed product's technology stack.

## Historical analysis-reliability evidence — before scoped planning

The selected **OpenRouter / `nvidia/nemotron-3.5-super-vl:free`** connection passed representative analysis/ranking on `fixed-fields-v3` in 2.060/0.552 seconds. Four live cases passed application schema/exact-excerpt validation, but the agency case missed billing/background negatives and the ambiguous case retained an extra essential interpretation requiring review. Individual and Salesforce authored checks passed; Salesforce remains correctly unsupported by the catalog. These are scoped observations, not general semantic reliability. Original failures were reproduced as short excerpts at `proposals.5.excerpt` and `.7.excerpt` (`wire_schema` / `too_small`). Fixed named fields, enum/unknown branches and stronger evidence instructions address the structural gap. Direct Meta/Gemini/OpenAI/NVIDIA remain live-unverified here. Full evidence: [PROVIDER_TIMEOUT_EVIDENCE.md](PROVIDER_TIMEOUT_EVIDENCE.md).

Generation defaults to 90 seconds per attempt and a 120-second overall deadline; discovery separately defaults to 10 seconds per attempt and 30 seconds total across pages. There is at most one transient retry within the remaining deadline; Retry-After is respected, including when it exceeds that budget (no early retry). Server overrides, hard ceilings, longer browser/route waits and the session-authenticated timing tool are documented in the README. Timings record HTTP and application failures separately, plus safe validation paths/codes. They never contain prompts, responses or credential material.

Official discovery/authentication references reviewed October 31, 2026:

- [Meta model listing](https://dev.meta.ai/docs/api-reference/models/list-models) and [model response schema](https://dev.meta.ai/docs/api-reference/models/schemas).
- [Gemini models API and pagination](https://ai.google.dev/api/models).
- [OpenAI model listing](https://developers.openai.com/api/reference/resources/models/methods/list), [bearer authentication](https://developers.openai.com/api/reference/overview#authentication), and [Chat Completions](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create).
- [OpenRouter model catalog](https://openrouter.ai/docs/api/api-reference/models/list-all-models-and-their-properties), [private key authentication endpoint](https://openrouter.ai/docs/api/api-reference/api-keys/get-current-api-key), and [structured Chat Completions](https://openrouter.ai/docs/guides/features/structured-outputs).

## Historical environment-adapter evidence — October 31, 2026

| Adapter / model | Implemented protocol | Fixture evidence | Live evidence |
|---|---|---|---|
| Meta / `muse-spark-1.3` | Direct Meta Chat Completions, strict JSON Schema, `max_completion_tokens`, minimal reasoning | Transport, app contracts and selection validation tested | Unverified; smoke skipped for missing real key. Billing unavailable per user |
| Gemini / `gemini-3.8-flash` | Native Google `generateContent`, `responseMimeType` + `responseJsonSchema`; native candidate parser | Transport, app contracts and selection validation tested | Unverified; selected smoke skipped for missing real key |
| Gemini / `gemini-3.5-flash-lite`, `gemini-2.5-flash` | Recognized model IDs using the same native adapter | Shared transport tested using 3.8 fixtures; these IDs not exercised | Unverified; 2.5 access can depend on existing account eligibility |
| OpenAI-compatible / administrator's exact model and base URL | Non-streaming Chat Completions + strict JSON Schema + `max_tokens` | Gateway request/response, endpoint guards, app contracts and attribution tested with synthetic model | Unverified; no endpoint/account configured |
| OpenRouter / `nvidia/nemotron-3-ultra-550b-a55b` | Explicit named gateway Chat Completions; provider-default reasoning | Shared scoped contracts, review/filtering and session guards tested | Real representative analysis/ranking passed; five cases completed structurally but semantic mistakes remain. Not direct Meta/NVIDIA verification |
| Meta Wonder, unlisted Gemini models, audio/image-only models | Not supported by current adapters | Rejected during configuration | Requires reviewed implementation/compatibility work |
| Native Responses, Anthropic Messages, Vertex AI, local gateways, other token/role profiles | Not implemented by these adapters | Not claimed compatible | Additional adapter/profile implementation required |

“Configured” means settings passed local checks. It is not a live provider verification state. Only successful real analysis and recommendation checks establish observed compatibility for that exact provider/model/endpoint, and not for every account or future model revision.

## Shared request and validation path

1. Browser inference receives only the activated session config; CLI smoke uses explicit `AI_PROVIDER` from its environment. Named hosts are fixed. Extra gateway endpoints are validated server-side and never accepted from public bodies.
2. Shared `src/server/ai.ts` builds prompts and contexts from application requirements/catalog facts. Environment objects, endpoint credentials and API keys are never prompt context.
3. Adapters receive a portable JSON Schema. Unsupported wire string-length annotations are omitted, while runtime Zod length checks remain enforced. Native request parameters, authorization and envelope parsing stay in adapters.
4. Refusals, incomplete output, malformed JSON, HTTP incompatibility/access failures, rate limits and timeouts produce safe errors. No raw provider error bodies or key values are returned/logged. One transient retry is allowed within the operation's overall deadline, so it may consume additional credits. There is no fallback. Authentication, exhausted billing, incompatible parameters, refusals, truncation and invalid output are not retried.
5. All adapters pass the same Zod application schemas and semantic checks: source excerpts, complete extraction fields, confirmation/explicit-answer precedence, deterministic hard constraints and approved catalog/reason-code selections. Provider output cannot add supported integrations or override hard constraints.

The gateway uses trusted administrator configuration, HTTPS public DNS hosts, public-address DNS checks and `redirect: error`. This is not an isolated network execution environment or a guarantee about a gateway operator's upstream routing. Do not configure untrusted/rebinding DNS or gateways.

## Attribution

Successful inference returns `meta.provider`, `meta.model`, `meta.requestedModel`, and `meta.calledAt`. `model` uses a safe returned model/version identifier when present, otherwise the requested model. A compatible gateway always retains `provider: openai-compatible`, even when it reports a Meta-named upstream model. Its results do not validate the direct Meta endpoint.

The active-provider indicator comes from safe server status. Stored page-session results retain their original metadata; historical idea reviews show their original source. Legacy metadata without a provider is interpreted as direct Meta because the previous implementation supported only direct Meta. New results always include the provider. This is a legacy format rule, not inference from whichever provider is active now.

## Optional CLI smoke commands — separate from Settings

Browser users configure and activate through Settings without editing files. The following environment-based CLI checks do not use or activate browser sessions. Optional environment blocks are in the root README and `.env.example`; they never become fallback credentials after disconnect.

```powershell
pnpm smoke:provider
pnpm smoke:meta
# Explicitly exercise a configured gateway instead:
pnpm smoke:provider --provider openai-compatible
```

The smoke run uses a small explicit personal-address-book description, validates actual extraction, then ranks an explicitly answered individual-user profile. Smoke answers are deliberately provided by the script; model interpretations are not automatically confirmed on behalf of application users. A partial analysis success followed by ranking failure remains a failed overall run, with per-step evidence reported.

The earlier environment-based smoke checks did not exercise a real model because inspected CLI credentials were absent/placeholders. The later live Settings-session evidence above is independent of CLI environment configuration. Fixture success must not be presented as direct Meta, Gemini or gateway live validation.

## Official references reviewed

- [Meta Chat Completions](https://dev.meta.ai/docs/protocols/chat-completions) and [Meta structured output](https://dev.meta.ai/docs/structured-output).
- [Gemini generateContent reference](https://ai.google.dev/api/generate-content), [structured output](https://ai.google.dev/gemini-api/docs/structured-output), [Gemini 3.8 Flash](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash), and [model availability](https://ai.google.dev/gemini-api/docs/models).
- [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs) defines the baseline JSON Schema response format. Third-party gateways must document their own support; this reference does not establish gateway compatibility.
