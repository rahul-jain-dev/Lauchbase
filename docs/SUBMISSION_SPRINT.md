# SaaSFoundation submission sprint — November 5, 2026

## Active scope and deadline

This temporary sprint preserves the original roadmap but defers its unfinished milestones until after submission. Ship the existing **AI-powered micro-SaaS foundation architect**, not a simulated project generator.

Final tagline: **From an idea to a buildable foundation.**

Initial clock check: November 5, 02:45 IST. Working deadline: **07:30 IST**, pending the authenticated portal. The public [Meta event page](https://dev.meta.ai/events/global-hackathon) and [organizer schedule](https://cerebralvalley.ai/e/meta-ai-developer-hackathon) state November 4, 9 PM ET. The exact submission form, eligibility confirmation and video limits are not verified by those public pages.

## Execution order

| Time box | Work | Exit evidence |
|---|---|---|
| 20 min | Audit, preserve local work, integrate branding PR #1 on a submission branch | Inspected source/PR, preserved histories, branded prototype |
| 35 min | Verify existing critical journey and fix only blockers | Current typecheck/lint/tests/build and browser results |
| 20 min | Direct Meta verification | Real analysis/ranking outcomes, or precise missing configuration/access blocker |
| 45 min | One Node deployment and live checks | Actual hosted URL, session/operation checks; configuration alone is not deployment |
| 45 min | Video and accurate materials | Recorded file/link and completed submission copy |
| Remaining time | Upload, portal completion and contingency | Actual receipt/confirmation; never infer submission |

Do not wait for blocked account access while independent testing/material preparation remains possible. Reserve final portal/upload time; defer polish first.

## Audit and evidence

- Intake, reviewed analysis, explicit corrections/confirmation, deterministic filtering, catalog ranking, two foundation definitions, both map views and build-plan preview exist in the current source. Relevant browser fixtures exercise the agency/individual paths, unsupported needs, stale plans and Settings lifecycle.
- Foundation definitions are not runnable generated applications. Generation, ZIP export, generated-code execution, persistence/dashboard and automated customer-app deployment remain deferred.
- PR #1 (`codex/skeleton-ai-branding`) was inspected and integrated into `codex/submission-sprint`, preserving the local branding/demo checkpoint and the PR history. The original development branch was not overwritten. GitHub PR status may remain open until its base incorporates that history.
- Direct Meta configuration check found no usable `META_API_KEY`. Current `pnpm smoke:meta` returned `state: skipped`, `configuration_required`, `liveInference: false` for `muse-spark-1.3`. This is **not a successful API call**, nor evidence of an authentication/billing failure. Prior OpenRouter success is not native Meta verification.
- Hosting account access and authenticated participant form details have been requested from the user. No live URL, video or submission confirmation currently exists in this sprint's evidence.
- Updated command results will be recorded in `IMPLEMENTATION_STATUS.md`; historical counts are not current reruns.

Final current rerun: typecheck/lint/build passed, 164 unit/route tests passed, and 22 desktop/mobile scenarios passed. Two new scenarios use real local production routes without provider fixtures. A real loopback Settings check returned 403 before the origin fix and 200 afterward; configured-public-origin and foreign-origin probes returned 200/403 respectively. All four affected routes use the shared helper. Existing fixture-only Settings tests had not exposed the runtime listener-origin mismatch. These observations do not prove a public deployment.

Silent, visibly labeled manual footage was captured at `artifacts/submission-demo/saasfoundation-manual-demo.webm` (33.72 seconds, 1440×1000), with `evidence.json` and screenshots. It contains no model inference or fabricated provider responses. The local video and two map screenshots were inspected. It is fallback footage, not a final hosted/AI-powered recording or upload. Its first attempts failed for a missing video encoder and the inference-route origin guard; both were addressed and the capture then succeeded.

## Deployment handoff while account access is pending

`render.yaml` prepares one native Node web service, using the pinned runtime/package manager and `next start`. This matches the process-local credential store more directly than independently executing serverless functions. It has **not been provisioned or tested on Render**. Do not claim Linux/hosted compatibility from local Windows checks alone.

1. In an authorized Render account, connect the existing `rahul-jain-dev/Lauchbase` repository and create a Blueprint using `render.yaml` on `codex/submission-sprint` after it is pushed. Review any account/billing prerequisites before creation. The configuration requests a free service; availability depends on the account.
2. Keep exactly **one instance/process** and disable autoscaling/multi-worker wrappers. Do not replace the start command with a cluster or serverless deployment. Reconnect Settings after restarts or deployments; free-instance idle suspension can lose all session keys. See [Render free-instance limits](https://render.com/docs/free).
3. The current UI uses session-supplied credentials. Do not add a shared paid provider key to the public app or assume server environment variables activate browser inference.
4. Use the actual host-provided HTTPS URL; never guess a subdomain. The server uses `APP_ORIGIN` when configured, otherwise Render's documented `RENDER_EXTERNAL_URL`. For another reverse proxy or a custom domain, set `APP_ORIGIN` to the exact public HTTPS origin (no credentials/path/query). Local loopback hosts work without this setting. The fix does not trust arbitrary public Host/forwarded headers; foreign/null origins stay rejected. HTTPS public origins require Secure cookies even when the internal listener is HTTP.
5. In a real browser: connect a key privately, test analysis and ranking separately, activate the exact selection, run the complete idea-to-plan journey and verify attribution. Repeat with a separate browser session and confirm it has no access to the first session's connection. A restart must require reconnection. Never record cookies or secrets.
6. Record HTTP/application outcomes and exact model/timestamps safely. A 200 home page or provider catalog list alone is insufficient.

Build/runtime configuration references: [Render web services](https://render.com/docs/web-services), [Blueprint fields](https://render.com/docs/blueprint-spec). No hosting deployment access is configured locally as of the initial audit; the user must authorize an account or perform these steps manually.

## Native Meta acceptance

Use the current Settings native Meta profile with a privately configured account key, or the explicitly authorized `pnpm smoke:meta` CLI check. The CLI exercises actual analysis and ranking but does not activate a browser session. Preserve endpoint restrictions, exact excerpts, review, catalog validation and no fallback.

Record authentication/access errors separately from billing/quota, transport, structural and semantic failures. A representative pass does not establish arbitrary-input accuracy. If blocked, disclose that blocker and check actual portal model-use requirements. Do not silently select a hosted Meta model or present a non-Meta model as Meta.

## Material and final handoff

Use `docs/HACKATHON_SUBMISSION.md` for copy and `docs/DEMO_SUBMISSION.md` for narration/shots. Both are drafts until the authenticated portal/video limits are known. Fill only real portal fields. Add verified app/video URLs and a receipt only when they exist. Keep secrets out of recordings and source.
