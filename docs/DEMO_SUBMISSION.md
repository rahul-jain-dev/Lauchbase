# SaaSFoundation submission demo brief

Prepared November 5, 2026. The user confirmed the final name **SaaSFoundation**. Cloud setup work is stopped. The submission-only sprint uses a working cutoff of 07:30 IST, subject to the authenticated portal. The video limit is not yet verified; the two-minute format below is provisional.

## Positioning

An AI foundation planner for freelancers building micro-SaaS products: turn a client brief into reviewed requirements, a proposed application foundation, an understandable project map and a concrete build plan.

Longer-term vision: assemble and verify that foundation, then guide local setup and further product development. Generation, ZIP export, executed generated-code checks and deployment are future work in the current repository.

## One demo story

Use this example throughout:

> A client portal for a freelance design agency. Team members invite clients, share private design PDFs and collect project feedback. No payments or scheduled background processing initially.

Confirm the access boundary explicitly: should clients see only their assigned projects? The current team foundation definition provides workspace membership; project-specific client permissions require an extension and isolation tests. Do not imply that confirming an access rule implements it.

Show these working prototype behaviors:

1. Describe the idea in plain language with experience and optional budget.
2. Review AI interpretations if a real connection works, or use the clearly identified manual input flow. Retain explicit answers and exclusions.
3. Confirm scope, including required custom feedback workflows and access decisions.
4. Present the proposed team foundation: intended sign-in, records, workspaces, invitations and private-file infrastructure. Show product-specific work and permission gaps separately.
5. Expand the application map to explain sign-in, saved records and private files. Open the development view; optional tools appear only after the user chooses them.
6. Open Review build plan. Show planned modules, setup choices and checks. Finish with the next implementation milestone.

## Two-minute draft narration and shots

| Time | Screen | Narration |
|---|---|---|
| 0:00–0:15 | Product title and brief | “Freelancers can understand a client's idea and still spend time deciding how to start building it. SaaSFoundation helps turn that brief into a clear micro-SaaS foundation plan.” |
| 0:15–0:35 | Enter the agency idea | “Describe what clients should be able to do, your experience and your constraints. Here we need invitations, private design PDFs and project feedback, without payments or scheduled jobs.” |
| 0:35–0:55 | Review and confirm requirements | “The prototype makes its understanding editable. You confirm important requirements, correct interpretations and answer decisions that affect the foundation.” |
| 0:55–1:15 | Proposed foundation and custom work | “This proposes shared-workspace infrastructure. Feedback screens and project-specific client permissions remain visible work, so the foundation's coverage is clear.” |
| 1:15–1:40 | Both map views; expand two nodes | “The map explains how the application pieces connect and how the freelancer will build it. Each component has a reason, setup needs and an honest status. Existing accounts and optional development tools remain the user's choices.” |
| 1:40–1:55 | Review build plan | “The build plan records the proposed modules, configuration, custom work and verification steps. This prototype prepares the plan; code assembly and verification are the next milestone.” |
| 1:55–2:00 | Closing card | “SaaSFoundation: a clearer foundation for your next micro-SaaS.” |

Adjust this draft to the actual submission time limit. The times are editorial targets, not a required hackathon format.

## Recording and evidence

- Record the real app. Do not animate generation, fabricate API success, show invented checks or disguise fixtures as live inference.
- If using AI, test the explicitly selected connection before recording and show its actual outcome. Never expose the key or private session state. A manual path can demonstrate the working deterministic planner, but must not be narrated as live AI extraction.
- Current live evidence is for OpenRouter/Nemotron and includes semantic limitations. Direct Meta verification is still pending; do not describe gateway calls as direct Meta API validation. Confirm the hackathon's integration/submission requirements against the actual submission page.
- Keep one clear “Proposed — code not generated” status visible. Label future generation/setup scenes as roadmap or concept if included.
- Capture the screen at readable zoom. Expand only the nodes needed for the story; avoid scrolling through developer diagnostics, raw JSON or the full technical file list during narration.
- End with what works now and the next milestone. Do not expand today's scope into a general-purpose product-development agent.

## Available local manual-path footage

`artifacts/submission-demo/saasfoundation-manual-demo.webm` is a silent 33.72-second clip of the actual local production app. Its visible banner reads “MANUAL INPUT DEMO · NO AI REQUESTS · PROPOSED FOUNDATION.” It demonstrates manual confirmation, a real deterministic comparison, both map views and build-plan review. Sidecar screenshots and `evidence.json` distinguish it from fixture and live-model evidence. Do not use the AI-analysis narration above over this clip without explicitly explaining that the recorded path uses manual input.

Recreate after starting the production app on `http://127.0.0.1:3200`:

```sh
pnpm exec playwright install ffmpeg
node scripts/record-manual-demo.mjs
```

It is not a final edited/voiced video, public video URL, direct Meta validation, deployed-app proof or submission receipt. Use it for fallback/screenshots or record the real configured AI path once authorized access is available.

## Scope before the final recording

The name is confirmed as SaaSFoundation. The working cutoff is 07:30 IST, subject to the authenticated portal; confirm the video limit and required form fields. Keep real project generation and broader product-development features for a subsequent explicitly scoped milestone.
