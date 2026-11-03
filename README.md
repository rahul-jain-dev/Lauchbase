# LaunchBase

LaunchBase has reviewed idea analysis, explicit scope confirmation, deterministic foundation filtering, grounded plans, an interactive project map and build-plan review. Provider choice is permanent; direct Meta remains the hackathon integration with separate validation. The catalog contains **definitions**, not generated or verified applications. Real generation and ZIP export are the next milestone.

## Run locally

Prerequisites: Node.js 22.12 or later and pnpm 11.25.0 (the versions used here are pinned in `package.json`).

```powershell
cd 'E:\Meta AI Hackathion'
pnpm install --frozen-lockfile
pnpm dev
```

Open [localhost:3000](http://localhost:3000). Answers remain in the current page session; refreshing clears them.

For Linux/Codex Cloud continuation, use [docs/CLOUD_DEVELOPMENT.md](docs/CLOUD_DEVELOPMENT.md). It covers the pinned runtime, browser installation, network access, credentials and the limits of phone/cloud previews. Run commands from the checkout root; the Windows path above is only the local example.

## Inspect the planning flow

Describe the idea, review interpretations or enter needs manually, answer clarifications and confirm scope. Then compare foundations. The plan explains infrastructure fit, essential custom work, exclusions and unresolved setup/security decisions. Changes require confirmation and recalculation. Essential unsupported integrations or scheduled work remain blockers; ordinary saved records do not need a background worker.

Explore **How your application works** and **How you build and run it**, expanding nodes for requirements, connections, setup, ownership and planned verification. **Review build plan** shows modules/files/checks and collects OS and optional tools. Owning an account is not a verified connection. Project-level client permissions remain an explicit extension beyond workspace membership. Nothing is generated or installed yet. See [planning implementation and live limitations](docs/PLANNING_EXPERIENCE.md).

## Settings → AI connections

Use the visible **Settings** button in the header. You do not need to edit source or environment files for Meta, Gemini, OpenAI or OpenRouter connections.

1. Choose the provider explicitly and enter its API key in the password input. Recognizable key formats suggest a provider only; ambiguous keys require your selection. A key is never probed against multiple providers.
2. Click **Connect**. The input clears. The server checks authentication where the provider offers a protected endpoint and fetches available models. OpenRouter uses its private `/key` endpoint before its public model catalog; a public model list alone is not authentication evidence.
3. Search the model list and select a text model. Provider-listed capabilities are displayed when supplied; missing capability metadata remains unknown. Known image/embedding/audio/realtime-only workflows are disabled. For an approved gateway with no listing implementation, or failed listing, an explicitly labeled manual model-ID option is available.
4. Click **Test selected model**. This makes two separate bounded API requests through real idea analysis and foundation ranking, and may consume provider credits (each operation can retry once for a transient failure). Authentication, model discovery, analysis and ranking have separate results. Both representative operation checks must pass; a passing example does not guarantee every future input succeeds.
5. After both checks pass, click **Use this connection**. Both operations now use this exact session connection. Changing the key, provider/profile, model, approved endpoint or application/test contract invalidates testing. **Replace key** removes the old key first; **Disconnect** clears it and does not select another connection. Contract upgrades require both checks again; historical page results keep their original attribution.

**Connection lasts for this session. Reconnect after the server restarts.**

Keys are stored only in this local Node server's process memory with an eight-hour absolute expiry; expired sessions are rejected on access and swept every minute. The browser has only an opaque, random HttpOnly, SameSite=Strict session cookie (Secure on HTTPS). No keys are written to localStorage, sessionStorage, URLs, logs, API responses, browser bundles or permanent credential files. Tabs sharing the same cookie context share the connection; separate browser sessions are isolated. Closing Settings preserves all intake answers and clears any unsubmitted key text.

The browser application requires an activated Settings connection and has **no environment fallback**, including after disconnect, expiry or restart. Existing environment configuration remains available only for optional command-line smoke checks. This is a single-process local prototype, not shared durable credential storage or application-user authentication.

## Optional administrator / command-line provider configuration

These optional `.env.local` settings are for CLI smoke checks and administrator gateway approval. They do not activate a connection in the browser application. Normal users should configure named profiles in Settings instead. Never put keys in chat, source, `NEXT_PUBLIC_` variables, prompts or exports.

Current development configuration (replace the key locally):

```dotenv
AI_PROVIDER=gemini
GEMINI_MODEL=gemini-3.8-flash
GEMINI_API_KEY=replace_with_your_gemini_api_key
```

Direct Meta / hackathon configuration, for separate validation:

```dotenv
AI_PROVIDER=meta
META_MODEL=muse-spark-1.3
META_API_KEY=replace_with_your_meta_api_key
```

Administrator-configured compatible gateway (replace all endpoint/model/key placeholders):

```dotenv
AI_PROVIDER=openai-compatible
OPENAI_COMPATIBLE_BASE_URL=https://gateway.example.com/v1
OPENAI_COMPATIBLE_MODEL=your_gateway_model_id
OPENAI_COMPATIBLE_API_KEY=replace_with_your_endpoint_api_key
OPENAI_COMPATIBLE_STRUCTURED_OUTPUT=json_schema
```

The gateway must support non-streaming **Chat Completions**, a `system` message, `max_tokens`, and strict `response_format.json_schema`, returning one `choices[0].message.content` JSON text response. The schema declaration is an administrator assertion, not a live compatibility pass. Native Responses, Anthropic Messages, Vertex AI, local HTTP gateways, and different parameter profiles require additional adapter implementation. There is no claim of universal API compatibility.

Gateway base URLs must be HTTPS on port 443 with a public DNS hostname; URL credentials, queries, fragments, IP literals and local/private hosts are rejected. DNS is checked server-side and redirects are refused. Settings accepts only approved profile IDs, never destination URLs. For the optional **Approved gateway** profile, the administrator configures `OPENAI_COMPATIBLE_BASE_URL` and `OPENAI_COMPATIBLE_STRUCTURED_OUTPUT=json_schema`; the user supplies their own session key in Settings. Changing gateway approval invalidates an existing test and requires reconnection.

Run the selected provider's actual idea-analysis and recommendation smoke path:

```powershell
pnpm smoke:provider
```

Explicitly validate direct Meta without changing the application's selected development provider:

```powershell
pnpm smoke:meta
```

The smoke commands skip explicitly if their selected credentials are missing/placeholders. Otherwise they make real idea-analysis and recommendation calls through the same adapters, application schemas and semantic validation used by the app. They print only safe check results, provider/model/timestamps and errors, never keys or raw provider bodies. Failed/partial runs do not verify a provider. `--provider meta` is an explicit command override, not fallback.

Provider documentation and the tested/unverified/unsupported matrix are in [docs/PROVIDERS.md](docs/PROVIDERS.md). Generation allows 90 seconds per attempt within a 120-second overall deadline (server-configurable, maximum 150 seconds overall). Discovery has separate 10-second attempts within 30 seconds across pagination. At most one transient retry is allowed within that deadline, honoring Retry-After. Invalid credentials, exhausted billing, incompatible parameters and invalid output are never retried. Browser waits allow 170 seconds; inference routes declare a 180-second platform duration. The UI shows active configuration separately from each result's immutable inference attribution. Gateway model names do not prove direct upstream API validation.

To diagnose your active connection, open **Settings → Developer diagnostics → AI request timing tools → Compare AI request timings**. This makes a minimal structured request followed by full analysis using the same idea and currently activated connection. Each step may retry once for a transient failure and consume credits. No provider/model fallback occurs. Timings distinguish DNS, headers, body and validation; HTTP 200 can still contain refused, truncated or invalid output. Safe ignored reports under `artifacts/provider-diagnostics/` contain no keys, cookies, endpoint URLs, ideas, prompts or generated content. Reports persist locally until removed; session keys remain only in memory.

Optional timeout overrides belong in ignored `.env.local`: `AI_GENERATION_TIMEOUT_MS=90000`, `AI_GENERATION_DEADLINE_MS=120000`, `AI_DISCOVERY_TIMEOUT_MS=10000`, `AI_DISCOVERY_DEADLINE_MS=30000`. Values must be integer milliseconds, at least 100; discovery ceiling is 60000 and generation ceiling 150000. Attempts are clamped to the overall deadline. Keys still connect through Settings. Restarting the server to change environment settings requires reconnecting the session. Hosted proxy/function limits must independently accommodate the route duration.

## Inspect the flow

Analysis uses a versioned wire object with seven fixed named fields, field-specific values and exact unknown branches, plus separate essential requirements. It is converted into the existing editable proposal representation and checked for exact supporting excerpts. Experience/skills do not establish a required language/framework. Nothing is accepted until user review, and unsupported needs remain preserved.

For the authored live set, use **Settings → Developer diagnostics → AI request timing tools → Run five analysis checks**. This makes five analysis requests on the explicitly selected connection, even before activation, with bounded retries and credit usage. Cases cover contacts, agency reviews/approvals/private uploads, ambiguous booking, Salesforce and scheduled workflow dependencies. Intake answers do not change. Extraction is assessed separately from hypothetical catalog fit; limited field-check passes do not certify every interpretation. Observed semantic mistakes are recorded in [the evidence document](docs/PLANNING_EXPERIENCE.md).

1. Enter an idea, your experience, an optional budget and existing services. Technical constraints are in **Advanced choices**.
2. Configure a connection through **Settings → AI connections**, test a model and click **Use this connection**. Without an active session connection, **Understand my idea** shows the explicitly identified manual alternative. It never simulates an extraction.
3. With a configured key, review stated interpretations, suggested needs, unknowns and supporting excerpts. Confirm each interpretation or answer directly. Your existing explicit answers win. Essential interpretations must be reviewed before comparing.
4. Choose **Enter needs manually** at any time to answer product questions directly. Independent customers, no payments, no uploads and no background tasks leave the individual definition. Budget/provider/technology unknowns remain unresolved without blocking a provisional comparison.
5. Mark customer payments essential to see the catalog limitation. Changing that requirement later needs explicit confirmation. Select Python as an essential language in Advanced choices to exercise the existing hard-constraint rejection.
6. Shared workspaces plus essential uploads leave the team definition. Individual-only accounts plus essential uploads have no supported match.

The product description is analyzed only by the explicitly configured provider. Interpretation is never automatically treated as a confirmed hard constraint. Excerpts must match the idea exactly; that establishes provenance, not semantic truth. Review and confirm requirements, especially essential unsupported needs. Unknown values are never converted into positive compatibility claims. Budget not sure (`null`) and an explicit zero remain different. Answers, excerpts and change history are retained in the page session only.

## Checks

```powershell
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
```

Browser tests start the production build on port 3100. Windows uses installed Edge; Linux uses Playwright Chromium (`pnpm exec playwright install --with-deps chromium`). `PLAYWRIGHT_CHANNEL` can override the installed channel. The app does not activate the test server's environment key. Manual flows use the local UI/API; model/settings scenarios intercept labeled fixtures. Server tests exercise actual routes with provider HTTP fixtures, including isolation, expiry, redaction and activation. No fixture is live provider evidence. Routine screenshots go to ignored `artifacts/screenshots/`; explicitly set `PLAYWRIGHT_SCREENSHOT_DIR=docs/screenshots` to refresh the committed, reviewed evidence.

## Source map and limits

- `src/lib/contracts.ts`: shared Zod contracts and evidence states.
- `src/lib/idea-analysis.ts`: extraction contracts, excerpt validation, explicit-answer priority and confirmation helpers.
- `src/lib/catalog.ts`: versioned module and foundation metadata with dated official sources.
- `src/lib/scope.ts`: categorized needs, independent importance and infrastructure/security dependencies.
- `src/lib/foundation-plan.ts`: validated `foundation-plan-v1` blueprint, grounded technology roles, dynamic map, planned files/checks.
- `src/components/scope-review.tsx` and `foundation-plan-panel.tsx`: scope editing, map and build-plan review.
- `src/lib/recommendation.ts`: filtering, clarification, assumption handling and model selection validation.
- `src/server/ai.ts`: shared prompts, schemas and application semantic validation.
- `src/server/providers/`: explicit configuration, provider-specific transports/parsers, portable wire schema, and safe errors. `meta.ts` preserves the direct Meta adapter entry point.
- `src/lib/inference.ts`: provider/model/timestamp attribution and safe configuration status.
- `src/lib/connections.ts`: settings contracts, model metadata and key-format hints.
- `src/server/connections/`: fixed endpoint profiles, model discovery, session store and lifecycle/activation checks.
- `src/components/ai-settings.tsx` and `src/app/api/connections/route.ts`: Settings screen and guarded session API.
- `src/app/api/recommend/route.ts`: validated HTTP boundary and safe provider failure state.
- `src/app/api/analyze/route.ts`: validated idea-analysis boundary and honest missing-configuration state.
- `src/components/intake.tsx`: responsive intake and results.

Every model provider can rank only eligible IDs and select only explanations grounded in approved catalog facts. Displayed explanations come from those validated reason codes; arbitrary model prose is intentionally excluded to prevent unsupported integration claims. Budget/cost fit remains unresolved; no fixed monthly-cost promise is made. Country and provider eligibility are builder declarations, not independently verified account access.

Generation, ZIP export, authentication, persistence, deployment, execution sandboxes and maintenance execution are future milestones. This local prototype has no public-service authentication or distributed request limits; address those before a public deployment using a paid model key. See `IMPLEMENTATION_STATUS.md` for observed verification and the recommended next step.
