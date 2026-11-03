"use client";
import { useState } from "react";
import {
  createFoundationPlan,
  type SetupChoices,
  type FoundationPlan,
} from "../lib/foundation-plan";
import type { Requirements, RecommendationResult } from "../lib/contracts";
import { categoryLabels } from "../lib/scope";

function ProjectMap({
  plan,
  setup,
  change,
}: {
  plan: FoundationPlan;
  setup: SetupChoices;
  change: (next: SetupChoices) => void;
}) {
  const [view, setView] = useState<"application" | "development">(
    "application",
  );
  return (
    <section className="project-map" aria-label="Interactive project map">
      <h3>Your project map</h3>
      <div className="actions">
        <button
          type="button"
          className="secondary"
          aria-pressed={view === "application"}
          onClick={() => setView("application")}
        >
          How your application works
        </button>
        <button
          type="button"
          className="secondary"
          aria-pressed={view === "development"}
          onClick={() => setView("development")}
        >
          How you build and run it
        </button>
      </div>
      <p>
        Expand any node to inspect its role and connections. Lines describe the
        plan; no live connections have been made.
      </p>
      <ol className="map-nodes">
        {plan.nodes
          .filter((n) => n.view === view)
          .map((node) => (
            <li key={node.id}>
              <details>
                <summary>
                  <b>{node.title}</b>{" "}
                  <span>
                    ·{" "}
                    {node.choice === "confirmed" ? "chosen by you" : "proposed"}{" "}
                    · planned
                  </span>
                </summary>
                <p>{node.purpose}</p>
                <p>
                  <b>Why:</b> {node.reason}
                </p>
                <p>
                  <b>Source requirement:</b>{" "}
                  {node.requirementIds
                    .map(
                      (id) =>
                        ({
                          accountModel: "Confirmed account structure",
                          saved_records: "Saved records",
                          uploads: "Confirmed private uploads",
                          setup: "Setup choice",
                          development_tools: "Your development tool choice",
                          hosting: "Your hosting preference",
                        })[id] ?? "Confirmed scope item",
                    )
                    .join(", ")}
                </p>
                <ul>
                  {plan.edges
                    .filter((e) => e.from === node.id || e.to === node.id)
                    .map((e, i) => (
                      <li key={i}>
                        {plan.nodes.find((n) => n.id === e.from)?.title} →{" "}
                        {plan.nodes.find((n) => n.id === e.to)?.title}:{" "}
                        {e.meaning}
                      </li>
                    ))}
                </ul>
                <label className="field">
                  Your ownership: {node.title}
                  <select
                    value={node.ownership}
                    onChange={(e) =>
                      change({
                        ...setup,
                        ownership: {
                          ...setup.ownership,
                          [node.id]: e.target.value as
                            "unknown" | "have_account" | "need_account",
                        },
                      })
                    }
                  >
                    <option value="unknown">Not reported</option>
                    <option value="have_account">
                      I have an account / tool
                    </option>
                    <option value="need_account">I need to set this up</option>
                  </select>
                </label>
                <p>
                  Ownership is user-reported. It does not mean connected,
                  configured or verified.
                </p>
                <p>
                  <b>Setup needed:</b> {node.setup.join(" ")}
                </p>
                <p>
                  <b>Execution / verification:</b> planned; no project check has
                  run.
                </p>
                <p>
                  <b>Cost:</b> {node.cost}
                </p>
                <p>
                  <b>Next action:</b> {node.nextAction}
                </p>
              </details>
            </li>
          ))}
      </ol>
    </section>
  );
}
export function FoundationPlanPanel({
  requirements,
  result,
  setup,
  change,
  review,
}: {
  requirements: Requirements;
  result: RecommendationResult;
  setup: SetupChoices;
  change: (next: SetupChoices) => void;
  review: () => void;
}) {
  const [buildReview, setBuildReview] = useState(false);
  const plan = createFoundationPlan(requirements, result, setup);
  if (!plan)
    return (
      <section id="results" className="results">
        <h2>
          {result.state === "unsupported"
            ? "Your essential needs exceed current catalog support"
            : "Decisions needed before a foundation plan"}
        </h2>
        <p>Your original requirements remain in force.</p>
        <ul>
          {result.questions.map((q) => (
            <li key={q.id}>{q.question}</li>
          ))}
          {[...new Set(result.eliminated.flatMap((x) => x.reasons))].map(
            (x) => (
              <li key={x}>{x}</li>
            ),
          )}
        </ul>
        {result.eligible.length > 1 && !result.questions.length && (
          <p>
            Both account structures remain eligible. Choose independent or
            shared-workspace accounts in your understanding before creating one
            project plan.
          </p>
        )}
        <p>
          Supported alternatives cover sign-in and saved records, with shared
          workspaces and private uploads in the team definition. Essential
          integrations and scheduled/background execution require additional
          supported modules; they are not silently removed.
        </p>
        <button type="button" className="secondary" onClick={review}>
          Review my original needs
        </button>
      </section>
    );
  return (
    <section id="results" className="results">
      <p className="eyebrow">4 · FOUNDATION PLAN AND PROJECT MAP</p>
      <h2>{plan.foundationName}</h2>
      <p className="notice">
        Proposed foundation — code has not been generated.
      </p>
      <p>{plan.explanation}</p>
      {plan.blockers.length > 0 && (
        <div role="alert" className="notice error">
          <h3>Material decisions before building</h3>
          <ul>
            {plan.blockers.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      )}
      <h3>Foundation capabilities in the proposed scope</h3>
      <ul>
        {plan.capabilities.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
      <h3>Custom product work still required</h3>
      {plan.customWork.length ? (
        <ul>
          {plan.customWork.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      ) : (
        <p>
          Define your product’s specific screens and behavior on top of the
          reusable foundation.
        </p>
      )}
      <p>
        {plan.foundationId === "team"
          ? "Workspace member roles do not provide project-level client permissions. Define client access boundaries and extend/test authorization before using those workflows."
          : "Record ownership policies and behavior still need implementation and tests."}
      </p>
      <h3>Intentionally excluded by you</h3>
      {plan.excluded.length ? (
        <ul>
          {plan.excluded.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      ) : (
        <p>No optional feature is silently selected.</p>
      )}
      <h3>Proposed tools and why</h3>
      <div className="technology-reasons">
        {plan.technologies.map((t) => (
          <article key={t.name}>
            <h4>{t.name}</h4>
            <p>
              {t.role}. {t.need}
            </p>
          </article>
        ))}
      </div>
      <h3>Dependencies and setup decisions</h3>
      <ul>
        {plan.decisions.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
      <ProjectMap plan={plan} setup={setup} change={change} />
      <p>
        <b>Next action:</b> review the build plan and choose setup preferences.
        Real assembly and ZIP export follow in the next milestone.
      </p>
      <button type="button" onClick={() => setBuildReview((v) => !v)}>
        Review build plan
      </button>
      {buildReview && (
        <section className="build-review">
          <h2>Build / setup preview</h2>
          <p>
            This is a reviewable plan for the future building agent. Generation,
            installation, cloud setup and verification have not run.
          </p>
          <div className="form-grid">
            <label className="field">
              Operating system
              <select
                value={setup.os}
                onChange={(e) =>
                  change({ ...setup, os: e.target.value as SetupChoices["os"] })
                }
              >
                {["unknown", "windows", "macos", "linux"].map((x) => (
                  <option key={x} value={x}>
                    {x === "unknown" ? "Choose before setup" : x}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Editor or coding agent
              <select
                value={setup.editor}
                onChange={(e) =>
                  change({
                    ...setup,
                    editor: e.target.value as SetupChoices["editor"],
                  })
                }
              >
                {["undecided", "VS Code", "Cursor", "Codex", "other"].map(
                  (x) => (
                    <option key={x}>{x}</option>
                  ),
                )}
              </select>
            </label>
            <label className="field">
              Optional planning assistant
              <select
                value={setup.assistant}
                onChange={(e) =>
                  change({
                    ...setup,
                    assistant: e.target.value as SetupChoices["assistant"],
                  })
                }
              >
                {["none", "ChatGPT", "Meta AI", "other"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label className="field">
              Repository preference
              <select
                value={setup.repository}
                onChange={(e) =>
                  change({
                    ...setup,
                    repository: e.target.value as SetupChoices["repository"],
                  })
                }
              >
                {["undecided", "none", "GitHub"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
          </div>
          <h3>Confirmed configuration</h3>
          <p>
            {requirements.accountModel} accounts · {plan.foundationName}.
            Proposed TypeScript / Next.js / Supabase stack; account access,
            costs and configuration remain unverified.
          </p>
          <ul>
            {requirements.scope?.map((s) => (
              <li key={s.id}>
                {s.text} · {s.importance} · {categoryLabels[s.category]}
              </li>
            ))}
          </ul>
          <h3>Planned modules and files</h3>
          <ul>
            {plan.modules.map((m) => (
              <li key={m.id}>
                {m.id} · {m.version} · planned
              </li>
            ))}
            {plan.plannedFiles.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <h3>Custom work remaining</h3>
          <ul>
            {plan.customWork.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <h3>External setup requirements</h3>
          <ul>
            {plan.decisions.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <h3>Planned verification</h3>
          <ul>
            {plan.verificationPlan.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <p className="notice">
            Real generation and ZIP download are unavailable in this milestone.
            No build has started.
          </p>
        </section>
      )}
      <details className="result-details">
        <summary>Catalog limitations and sources</summary>
        {result.eligible
          .filter((f) => f.id === plan.foundationId)
          .map((f) => (
            <article key={f.id}>
              <ul>
                {f.limitations.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              {f.sources.map((url, i) => (
                <p key={url}>
                  <a href={url} target="_blank" rel="noreferrer">
                    Catalog source {i + 1}
                  </a>
                </p>
              ))}
            </article>
          ))}
        <p>No generated application verification has been executed.</p>
      </details>
    </section>
  );
}
