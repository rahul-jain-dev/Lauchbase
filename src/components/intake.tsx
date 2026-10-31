"use client";
import { useState, type FormEvent } from "react";
import { Requirements, RecommendationResult } from "../lib/contracts";
import { catalog } from "../lib/catalog";

const initial: Requirements = {
  idea: "",
  experience: "unknown",
  language: "unknown",
  framework: "unknown",
  stackIsHard: true,
  monthlyBudget: null,
  accountModel: "unknown",
  billing: "unknown",
  uploads: "unknown",
  background: "unknown",
  hosting: "unknown",
  hostingIsHard: false,
  existingServices: "",
  country: "",
  supabaseEligibility: "unknown",
  hardRequirements: [],
  assumptions: [
    { field: "accountModel", value: "individual", confirmed: false },
    { field: "hosting", value: "vercel", confirmed: false },
  ],
};
const needOptions = [
  ["unknown", "Not sure yet"],
  ["required", "Required"],
  ["optional", "Optional"],
  ["no", "Not needed"],
];
type StringField =
  | "experience"
  | "language"
  | "framework"
  | "accountModel"
  | "billing"
  | "uploads"
  | "background"
  | "hosting"
  | "supabaseEligibility";
export function Intake() {
  const [form, setForm] = useState<Requirements>(initial);
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  function update<K extends keyof Requirements>(
    key: K,
    value: Requirements[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setResult(null);
    setError("");
  }
  function select(field: StringField, title: string, options: string[][]) {
    return (
      <label className="field" key={field}>
        <span>{title}</span>
        <select
          id={field}
          value={form[field]}
          onChange={(e) =>
            update(field, e.target.value as Requirements[typeof field])
          }
        >
          {options.map(([v, label]) => (
            <option value={v} key={v}>
              {label}
            </option>
          ))}
        </select>
      </label>
    );
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setResult(null);
    const parsed = Requirements.safeParse({
      ...form,
      hardRequirements: form.hardRequirements
        .map((s) => s.trim())
        .filter(Boolean),
    });
    if (!parsed.success) {
      setError(parsed.error.issues.map((i) => i.message).join(" "));
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
        signal: AbortSignal.timeout(40000),
      });
      if (!response.ok)
        throw new Error(
          response.status === 400
            ? "Check your answers and try again."
            : "Could not complete the request. Please retry.",
        );
      setResult(RecommendationResult.parse(await response.json()));
      setTimeout(
        () =>
          document
            .getElementById("results")
            ?.scrollIntoView({ behavior: "smooth", block: "start" }),
        50,
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Request failed. Please retry.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="workspace" aria-labelledby="intake-title">
      <div className="workspace-header">
        <div>
          <p className="eyebrow">START WITH YOUR WORLD</p>
          <h2 id="intake-title">What are you building?</h2>
        </div>
        <span className="save-note">Session only · answers aren’t saved</span>
      </div>
      <form onSubmit={submit}>
        <fieldset disabled={busy}>
          <label className="field">
            <span>Your product idea</span>
            <textarea
              id="idea"
              required
              minLength={10}
              maxLength={3000}
              rows={3}
              value={form.idea}
              onChange={(e) => update("idea", e.target.value)}
              placeholder="e.g. A client portal where freelance designers share project updates and files…"
            />
            <small>
              Describe the product here. Declare non-negotiable constraints
              below so the filter can enforce them. Don’t include secrets.
            </small>
          </label>
          <div className="form-section">
            <h3>
              <span>01</span> You & your stack
            </h3>
            <div className="form-grid">
              {select("experience", "Building experience", [
                ["unknown", "Choose experience"],
                ["beginner", "Beginner"],
                ["comfortable", "Comfortable with code"],
                ["experienced", "Experienced builder"],
              ])}
              {select("language", "Preferred language", [
                ["unknown", "Choose language"],
                ["no-preference", "No preference"],
                ["typescript", "TypeScript"],
                ["python", "Python"],
                ["other", "Other (unsupported)"],
              ])}
              {select("framework", "Preferred framework", [
                ["unknown", "Choose framework"],
                ["no-preference", "No preference"],
                ["nextjs", "Next.js / React"],
                ["django", "Django"],
                ["other", "Other (unsupported)"],
              ])}
            </div>
            <label className="check">
              <input
                type="checkbox"
                checked={form.stackIsHard}
                onChange={(e) => update("stackIsHard", e.target.checked)}
              />{" "}
              My selected language and framework are hard requirements
            </label>
          </div>
          <div className="form-section">
            <h3>
              <span>02</span> Product needs
            </h3>
            <div className="form-grid">
              {select("accountModel", "Account structure", [
                ["unknown", "Not sure yet"],
                ["individual", "Individual users"],
                ["team", "Teams / client workspaces"],
                ["either", "Either structure works"],
              ])}
              {select("billing", "Customer billing", needOptions)}
              {select("uploads", "File uploads", needOptions)}
              {select("background", "Background processing", needOptions)}
            </div>
            <p className="hint">
              Billing and background processing are outside the current
              definitions. Required uploads need the team definition.
            </p>
          </div>
          <div className="form-section">
            <h3>
              <span>03</span> Budget & environment
            </h3>
            <div className="form-grid">
              <label className="field">
                <span>Monthly infrastructure ceiling (USD)</span>
                <input
                  id="monthlyBudget"
                  type="number"
                  min={0}
                  max={1000000}
                  step="0.01"
                  placeholder="Unknown"
                  value={form.monthlyBudget ?? ""}
                  onChange={(e) =>
                    update(
                      "monthlyBudget",
                      e.target.value === "" ? null : Number(e.target.value),
                    )
                  }
                />
              </label>
              {select("hosting", "Hosting preference", [
                ["unknown", "Not sure yet"],
                ["no-preference", "No preference"],
                ["vercel", "Vercel"],
                ["self-host", "Self-hosted Node.js"],
                ["other", "Other provider"],
              ])}
              <label className="field">
                <span>Operating country</span>
                <input
                  id="country"
                  maxLength={100}
                  value={form.country}
                  placeholder="e.g. India"
                  onChange={(e) => update("country", e.target.value)}
                />
              </label>
              {select("supabaseEligibility", "Can you use Supabase?", [
                ["unknown", "Not confirmed"],
                ["eligible", "Yes — account / region checked"],
                ["ineligible", "No — unavailable or prohibited"],
              ])}
            </div>
            <label className="check">
              <input
                type="checkbox"
                checked={form.hostingIsHard}
                onChange={(e) => update("hostingIsHard", e.target.checked)}
              />{" "}
              Hosting preference is a hard requirement
            </label>
            <label className="field">
              <span>Existing services or provider restrictions</span>
              <input
                maxLength={1000}
                value={form.existingServices}
                onChange={(e) => update("existingServices", e.target.value)}
                placeholder="Context only, e.g. existing Supabase account. Declare required integrations below."
              />
            </label>
            <label className="field">
              <span>Other hard requirements (one per line, up to 10)</span>
              <textarea
                rows={2}
                value={form.hardRequirements.join("\n")}
                onChange={(e) =>
                  update("hardRequirements", e.target.value.split("\n"))
                }
                placeholder="e.g. HIPAA compliance, Neon, Python-only"
              />
              <small>
                Only auth, CRUD, TypeScript, Next.js, Supabase, teams and
                uploads are recognized catalog terms. Other nonempty
                requirements are explicitly rejected, never silently
                interpreted.
              </small>
            </label>
          </div>
          <div className="assumptions">
            <h3>Editable assumptions</h3>
            <p>
              Suggestions only. An assumption fills an unanswered field only
              after you confirm it. Explicit form answers take priority.
            </p>
            {form.assumptions.map((a, i) => (
              <div className="assumption-row" key={a.field}>
                <label>
                  {a.field === "accountModel" ? "Account structure" : "Hosting"}
                  <select
                    value={a.value}
                    onChange={(e) =>
                      update(
                        "assumptions",
                        form.assumptions.map((x, j) =>
                          j === i
                            ? {
                                ...x,
                                value: e.target.value as typeof a.value,
                                confirmed: false,
                              }
                            : x,
                        ),
                      )
                    }
                  >
                    {(a.field === "accountModel"
                      ? [
                          ["individual", "Individual users"],
                          ["team", "Team workspaces"],
                        ]
                      : [
                          ["vercel", "Vercel"],
                          ["self-host", "Self-hosted Node.js"],
                        ]
                    ).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={a.confirmed}
                    onChange={(e) =>
                      update(
                        "assumptions",
                        form.assumptions.map((x, j) =>
                          j === i ? { ...x, confirmed: e.target.checked } : x,
                        ),
                      )
                    }
                  />{" "}
                  Confirm this assumption
                </label>
              </div>
            ))}
          </div>
          <div className="submit-row">
            <p>
              We check constraints first. Meta ranks eligible definitions only
              after key questions are resolved.
            </p>
            <button type="submit">
              {busy
                ? "Checking constraints & contacting Meta…"
                : "Explore my foundations →"}
            </button>
          </div>
        </fieldset>
      </form>
      {busy && (
        <p role="status" className="notice">
          Checking your answers. A configured Meta call can take up to 30
          seconds.
        </p>
      )}
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
      {result && (
        <div id="results" className="results" aria-live="polite">
          <p className="eyebrow">YOUR FOUNDATION REVIEW</p>
          <h2>
            {
              {
                needs_clarification: "A few things to clarify",
                unsupported: "No supported match",
                meta_configuration_required: "Meta configuration required",
                meta_error: "Meta recommendation unavailable",
                recommended: "Your catalog recommendation",
              }[result.state]
            }
          </h2>
          <p>{result.message}</p>
          {result.questions.length > 0 && (
            <div className="followups">
              <h3>Answer these follow-ups, then submit again</h3>
              {result.questions.map((q) => (
                <p key={q.id}>
                  <a href={`#${q.fields[0]}`}>{q.question} ↑</a>
                </p>
              ))}
            </div>
          )}
          {result.state === "meta_configuration_required" && (
            <p className="notice">
              The app needs a server-side Meta API key. Deterministic filtering
              ran; no AI recommendation was made.
            </p>
          )}
          {result.rankings.map((rank, i) => (
            <article className="ranked" key={rank.foundationId}>
              <span className="eyebrow">
                META RANK {i + 1} · DEFINITION ONLY
              </span>
              <h3>{catalog.find((f) => f.id === rank.foundationId)?.name}</h3>
              <ul>
                {rank.explanations.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </article>
          ))}
          {result.eligible.length > 0 && (
            <div>
              <h3>
                {result.state === "needs_clarification"
                  ? "Not eliminated yet — compatibility unknown"
                  : "Definitions passing declared hard constraints"}
              </h3>
              {result.eligible.map((f) => (
                <article className="candidate" key={f.id}>
                  <h4>{f.name}</h4>
                  <p>
                    <b>Planned scope:</b>{" "}
                    {f.capabilities
                      .filter(
                        (c) => c !== "uploads" || form.uploads === "required",
                      )
                      .join(", ")}
                  </p>
                  <p>{f.limitations.join(" · ")}</p>
                  <p>
                    Code verification: planned · External setup: pending ·
                    Integration verification: planned
                  </p>
                </article>
              ))}
            </div>
          )}
          {result.eliminated.length > 0 && (
            <div>
              <h3>Eliminated by hard constraints</h3>
              {result.eliminated.map((f) => (
                <div className="eliminated" key={f.foundationId}>
                  <h4>{catalog.find((x) => x.id === f.foundationId)?.name}</h4>
                  <ul>
                    {f.reasons.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
          <h3>Unresolved & outside current support</h3>
          <ul>
            {result.unresolved.map((u) => (
              <li key={u}>{u}</li>
            ))}
          </ul>
          <h3>Omitted or optional</h3>
          <ul>
            {result.omissions.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
          {result.meta && (
            <p className="hint">
              Real Meta call · {result.meta.model} ·{" "}
              {new Date(result.meta.calledAt).toLocaleString()}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
