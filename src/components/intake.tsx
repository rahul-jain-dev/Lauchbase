"use client";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Requirements, RecommendationResult } from "../lib/contracts";
import {
  AnalysisResponse,
  confirmProposal,
  emptyRequirements,
  fieldLabels,
  fieldOptions,
  valueLabel,
  type IdeaField,
  type Proposal,
} from "../lib/idea-analysis";
import { FoundationPlanPanel } from "./foundation-plan-panel";
import { SetupChoices, createFoundationPlan } from "../lib/foundation-plan";
import { ScopeReview } from "./scope-review";
import { filterCatalog } from "../lib/recommendation";
import { ProviderStatus } from "../lib/inference";
import { AI_CLIENT_TIMEOUT_MS } from "../lib/provider-timing";

const productFields: IdeaField[] = [
  "accountModel",
  "billing",
  "uploads",
  "background",
];
type Change = { field: string; before: string; after: string };

export function Intake() {
  const [activeProvider, setActiveProvider] = useState<ProviderStatus | null>(
    null,
  );
  useEffect(() => {
    let mounted = true;
    let sequence = 0;
    const refresh = (replace = false) => {
      const revision = ++sequence;
      return fetch("/api/provider", { cache: "no-store" })
        .then((r) => r.json())
        .then((raw) => {
          const parsed = ProviderStatus.safeParse(raw);
          if (mounted && revision === sequence && parsed.success)
            setActiveProvider((current) =>
              replace ? parsed.data : (current ?? parsed.data),
            );
        })
        .catch(() => {});
    };
    void refresh();
    const onChange = () => {
      void refresh(true);
    };
    window.addEventListener("ai-connection-changed", onChange);
    return () => {
      mounted = false;
      window.removeEventListener("ai-connection-changed", onChange);
    };
  }, []);
  const [form, setForm] = useState<Requirements>(emptyRequirements);
  const [review, setReview] = useState(false);
  const [analysis, setAnalysis] = useState<ReturnType<
    typeof AnalysisResponse.parse
  > | null>(null);
  const [answered, setAnswered] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"analysis" | "ranking" | null>(null);
  const [pending, setPending] = useState<{
    field: keyof Requirements;
    value: Requirements[keyof Requirements];
  } | null>(null);
  const [history, setHistory] = useState<Change[]>([]);
  const [hardDraft, setHardDraft] = useState("");
  const [evidenceHistory, setEvidenceHistory] = useState<
    { idea: string; response: ReturnType<typeof AnalysisResponse.parse> }[]
  >([]);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [pendingDismiss, setPendingDismiss] = useState<Proposal | null>(null);

  const [confirmedSnapshot, setConfirmedSnapshot] = useState<string | null>(
    null,
  );
  const [planStale, setPlanStale] = useState(false);
  const [clarifications, setClarifications] = useState<string[]>([]);
  const [setup, setSetup] = useState(() => SetupChoices.parse({}));
  const scopeConfirmed = confirmedSnapshot === JSON.stringify(form);
  const blueprint = useMemo(
    () =>
      result && !planStale && scopeConfirmed
        ? createFoundationPlan(form, result, setup)
        : null,
    [form, result, setup, planStale, scopeConfirmed],
  );
  useEffect(() => {
    const send = () =>
      window.dispatchEvent(
        new CustomEvent("launchbase-context", {
          detail: {
            requirements: form,
            analysisMeta: analysis?.meta,
            rankingMeta: result?.meta,
            issue:
              analysis?.activeProvider?.issue ?? result?.activeProvider?.issue,
            history: evidenceHistory
              .map((e) => e.response.meta)
              .filter(Boolean),
            plan: blueprint,
            requirementChanges: history,
          },
        }),
      );
    send();
    window.addEventListener("launchbase-context-request", send);
    return () => window.removeEventListener("launchbase-context-request", send);
  }, [form, analysis, result, evidenceHistory, blueprint, history]);
  function unreviewedNeeds() {
    return (
      analysis?.analysis?.proposals.filter(
        (p) =>
          p.essential &&
          p.kind !== "unknown" &&
          (p.field === "hardRequirement"
            ? p.category
              ? !(form.scope ?? []).some(
                  (s) =>
                    (s.text === p.value || s.originalText === p.value) &&
                    s.confirmed,
                ) && !dismissed.includes(p.value)
              : !form.hardRequirements.includes(p.value) &&
                !dismissed.includes(p.value)
            : !answered.has(p.field)),
      ) ?? []
    );
  }
  function confirmScope() {
    setError("");
    if (unreviewedNeeds().length) {
      setError(
        "Review the essential interpretations below before confirming scope. Confirm them or explicitly correct them; none will be silently omitted.",
      );
      return;
    }
    try {
      const input = payload();
      const filtered = filterCatalog(input);
      setClarifications(filtered.questions.map((q) => q.question));
      if (filtered.questions.length) {
        setError(
          "Answer the material scope questions before confirming. Unknown answers have not been assumed compatible.",
        );
        return;
      }
      setConfirmedSnapshot(JSON.stringify(form));
      setClarifications([]);
    } catch {
      setError("Check your idea and scope answers before confirming.");
    }
  }

  function update<K extends keyof Requirements>(
    field: K,
    value: Requirements[K],
    confirmed = false,
  ) {
    if (
      !confirmed &&
      ((field === "scope" &&
        (form.scope ?? []).some(
          (old) =>
            old.importance === "essential" &&
            !(value as NonNullable<Requirements["scope"]>).some(
              (next) =>
                next.id === old.id &&
                next.text === old.text &&
                next.importance === old.importance &&
                next.category === old.category &&
                next.constraint === old.constraint &&
                old.dependencies.every((d) => next.dependencies.includes(d)),
            ),
        )) ||
        (["billing", "uploads", "background"].includes(field) &&
          form[field] === "required" &&
          value !== "required") ||
        (field === "hardRequirements" &&
          form.hardRequirements.some(
            (h) => !(value as string[]).includes(h),
          )) ||
        ((field === "language" || field === "framework") &&
          form.stackIsHard &&
          form[field] !== "unknown" &&
          form[field] !== value) ||
        (field === "stackIsHard" && form.stackIsHard && !value) ||
        (field === "accountModel" &&
          form.accountModel !== "unknown" &&
          form.accountModel !== value) ||
        (field === "hostingIsHard" && form.hostingIsHard && !value) ||
        (field === "supabaseEligibility" &&
          form.supabaseEligibility === "ineligible" &&
          value !== "ineligible") ||
        (field === "hosting" &&
          form.hostingIsHard &&
          form.hosting !== "unknown" &&
          form.hosting !== value))
    ) {
      setPending({ field, value });
      return;
    }
    if (confirmed)
      setHistory((h) => [
        ...h,
        {
          field,
          before: JSON.stringify(form[field]),
          after: JSON.stringify(value),
        },
      ]);
    setForm((p) => ({ ...p, [field]: value }));
    if (confirmed && field === "hardRequirements")
      setDismissed((prev) => [
        ...prev,
        ...form.hardRequirements.filter(
          (h) => !(value as string[]).includes(h),
        ),
      ]);
    if (confirmed && field === "scope")
      setDismissed((prev) => [
        ...prev,
        ...(form.scope ?? [])
          .filter(
            (old) =>
              !(value as NonNullable<Requirements["scope"]>).some(
                (next) => next.id === old.id,
              ),
          )
          .map((old) => old.originalText ?? old.text),
      ]);
    setAnswered((p) => new Set([...p, field]));
    setPlanStale(Boolean(result));
    setError("");
    if (field === "idea") {
      setAnalysis(null);
      setDismissed([]);
    }
  }
  function accept(p: Proposal) {
    try {
      const next = confirmProposal(form, p, answered);
      setForm(next);
      if (p.field === "hardRequirement")
        setHardDraft(next.hardRequirements.join("\n"));
      setAnswered((prev) => new Set([...prev, p.field]));
      setPlanStale(Boolean(result));
    } catch {
      setError(
        "Could not accept that interpretation. Enter your answer directly.",
      );
    }
  }
  function payload() {
    return Requirements.parse(form);
  }
  async function analyze(event: FormEvent) {
    event.preventDefault();
    setError("");
    setPlanStale(Boolean(result));
    setConfirmedSnapshot(null);
    if (analysis?.state !== "analyzed") setAnalysis(null);
    try {
      const input = payload();
      setBusy("analysis");
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(AI_CLIENT_TIMEOUT_MS),
      });
      if (!response.ok)
        throw new Error(
          "Could not analyze the idea. Check your answers and retry.",
        );
      const understood = AnalysisResponse.parse(await response.json());
      setAnalysis(understood);
      window.dispatchEvent(new Event("ai-connection-changed"));
      if (understood.state === "analyzed")
        setEvidenceHistory((prev) => [
          ...prev,
          { idea: input.idea, response: understood },
        ]);
      setReview(true);
    } catch (e) {
      setError(
        e instanceof Error && e.name === "ZodError"
          ? "Check your idea, budget and scope. Model-sourced scope items must still have evidence in the current idea; explicitly correct or remove outdated interpretations."
          : e instanceof Error &&
              ["TimeoutError", "AbortError"].includes(e.name)
            ? "Idea analysis timed out while waiting for the server. Your answers are preserved; retry or compare AI request timings."
            : e instanceof Error
              ? e.message
              : "Idea analysis failed. Try again or enter needs manually.",
      );
    } finally {
      setBusy(null);
    }
  }
  async function compare() {
    setError("");
    if (!scopeConfirmed) {
      setError("Confirm your current scope before comparing foundations.");
      return;
    }
    const unreviewed = unreviewedNeeds();
    if (unreviewed?.length) {
      setError(
        "Review the essential interpretations below before comparing. Confirm them or explicitly correct the interpretation; none will be silently omitted.",
      );
      return;
    }
    try {
      const input = payload();
      setBusy("ranking");
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(AI_CLIENT_TIMEOUT_MS),
      });
      if (!response.ok)
        throw new Error(
          "Could not compare foundations. Check your answers and retry.",
        );
      const compared = RecommendationResult.parse(await response.json());
      setResult(compared);
      setPlanStale(false);
      window.dispatchEvent(new Event("ai-connection-changed"));
      setTimeout(
        () =>
          document
            .getElementById("results")
            ?.scrollIntoView({ behavior: "smooth", block: "start" }),
        50,
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Comparison failed. Please retry.",
      );
    } finally {
      setBusy(null);
    }
  }
  const proposalFor = (field: string) =>
    analysis?.analysis?.proposals.find((p) => p.field === field);
  function editor(field: IdeaField) {
    const p = proposalFor(field);
    const needed = result?.questions.some((q) => q.fields.includes(field));
    return (
      <div
        className={`understanding-field ${needed ? "needs-answer" : ""}`}
        key={field}
      >
        <label className="field">
          <span>{fieldLabels[field]}</span>
          <select
            id={field}
            value={form[field]}
            onChange={(e) =>
              update(field, e.target.value as Requirements[typeof field])
            }
          >
            {fieldOptions[field].map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        {field === "background" && (
          <p className="hint">
            Saved records remain saved without a worker. Choose background work
            for scheduled reminders, batch processing or long-running tasks.
          </p>
        )}
        {answered.has(field) ? (
          <small className="answer-source">
            Your confirmed answer — kept when analyzing again.
          </small>
        ) : p && p.kind !== "unknown" ? (
          <div className="proposal">
            <small>
              {p.kind === "explicitly_stated"
                ? "Stated in your idea · review the model’s interpretation"
                : "Suggested interpretation · not confirmed"}
            </small>
            <p>{valueLabel(field, p.value)}</p>
            {p.excerpt && <blockquote>“{p.excerpt}”</blockquote>}
            <button
              className="secondary"
              type="button"
              onClick={() => accept(p)}
            >
              Confirm{p.essential ? " essential need" : ""}:{" "}
              {valueLabel(field, p.value)}
            </button>
          </div>
        ) : (
          <small>
            {p
              ? "Unknown from the idea — please clarify."
              : "Your answer helps identify a suitable definition."}
          </small>
        )}
      </div>
    );
  }

  return (
    <section className="workspace" aria-labelledby="intake-title">
      <ol className="journey" aria-label="Planning stages">
        {[
          "Describe idea",
          "Review understanding",
          "Confirm scope",
          "Foundation plan and project map",
          "Build/setup — next milestone",
        ].map((name, i) => (
          <li
            key={name}
            aria-current={
              (result && !planStale && scopeConfirmed
                ? 3
                : scopeConfirmed
                  ? 2
                  : review
                    ? 1
                    : 0) === i
                ? "step"
                : undefined
            }
          >
            {i + 1}. {name}
            {i === 4 && (
              <small>
                Generation unavailable; plan review follows selection.
              </small>
            )}
          </li>
        ))}
      </ol>
      <p className="hint">
        {activeProvider?.ready
          ? "AI understanding is available. Review interpretations before accepting them."
          : "Set up idea analysis in Settings, or enter requirements manually."}
      </p>
      <div className="workspace-header">
        <div>
          <p className="eyebrow">START WITH YOUR WORLD</p>
          <h2 id="intake-title">What are you building?</h2>
        </div>
        <span className="save-note">Session only · answers aren’t saved</span>
      </div>
      <form onSubmit={analyze}>
        <fieldset disabled={!!busy}>
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
              placeholder="e.g. A client portal for ticket booking. Tell us what customers should be able to do…"
            />
            <small>
              Describe the experience you want. We’ll ask about the choices that
              matter. Don’t include secrets.
            </small>
          </label>
          <div className="form-grid">
            <label className="field">
              <span>Building experience</span>
              <select
                value={form.experience}
                onChange={(e) =>
                  update(
                    "experience",
                    e.target.value as Requirements["experience"],
                  )
                }
              >
                <option value="unknown">Not sure / prefer not to say</option>
                <option value="beginner">Beginner</option>
                <option value="comfortable">Comfortable with code</option>
                <option value="experienced">Experienced builder</option>
              </select>
            </label>
            <label className="field">
              <span>Monthly infrastructure budget (USD)</span>
              <input
                type="number"
                min={0}
                max={1000000}
                step="0.01"
                value={form.monthlyBudget ?? ""}
                placeholder="Not sure yet"
                onChange={(e) =>
                  update(
                    "monthlyBudget",
                    e.target.value === "" ? null : Number(e.target.value),
                  )
                }
              />
              <small>
                {form.monthlyBudget === null
                  ? "Not sure is fine — leave this blank."
                  : form.monthlyBudget === 0
                    ? "A $0 ceiling is different from an unknown budget."
                    : "A ceiling, not a verified cost estimate."}
              </small>
            </label>
          </div>
          <label className="field">
            <span>Existing technologies or services (optional)</span>
            <input
              maxLength={1000}
              value={form.existingServices}
              onChange={(e) => update("existingServices", e.target.value)}
              placeholder="e.g. an existing website or database"
            />
            <small>
              Add non-negotiable services as hard requirements in Advanced
              choices.
            </small>
          </label>
          <details
            className="advanced"
            open={result?.questions.some((q) =>
              q.fields.some((f) =>
                ["language", "framework", "hosting"].includes(f),
              ),
            )}
          >
            <summary>Advanced choices · technologies & constraints</summary>
            <p className="hint">
              These answers remain supported. Leave them unspecified if you want
              to consider the proposed stack later.
            </p>
            <div className="form-grid">
              {editor("language")}
              {editor("framework")}
            </div>
            <label className="check">
              <input
                type="checkbox"
                checked={form.stackIsHard}
                onChange={(e) => update("stackIsHard", e.target.checked)}
              />{" "}
              Language and framework are essential requirements
            </label>
            {editor("hosting")}
            <label className="check">
              <input
                type="checkbox"
                checked={form.hostingIsHard}
                onChange={(e) => update("hostingIsHard", e.target.checked)}
              />{" "}
              Hosting choice is essential
            </label>
            <label className="field">
              <span>Operating country (optional)</span>
              <input
                value={form.country}
                maxLength={100}
                onChange={(e) => update("country", e.target.value)}
              />
            </label>
            <label className="field">
              <span>Supabase access or restrictions</span>
              <select
                value={form.supabaseEligibility}
                onChange={(e) =>
                  update(
                    "supabaseEligibility",
                    e.target.value as Requirements["supabaseEligibility"],
                  )
                }
              >
                <option value="unknown">
                  Not checked — explain during setup
                </option>
                <option value="eligible">
                  Account and region access confirmed
                </option>
                <option value="ineligible">Unavailable or prohibited</option>
              </select>
              <small>
                Both definitions consider Supabase for sign-in and saved
                records. You can review that service and its prerequisites after
                comparing.
              </small>
            </label>
            <label className="field">
              <span>Other essential requirements (one per line)</span>
              <textarea
                rows={2}
                value={hardDraft}
                onChange={(e) => setHardDraft(e.target.value)}
                placeholder="e.g. must use an existing provider"
              />
            </label>
            <button
              className="secondary"
              type="button"
              onClick={() =>
                update(
                  "hardRequirements",
                  hardDraft
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean),
                )
              }
            >
              Apply essential requirements
            </button>
            <p className="hint">
              Applied: {form.hardRequirements.join("; ") || "none"}. Unsupported
              needs are retained and explained.
            </p>
          </details>
          <div className="submit-row">
            <p>
              The selected provider proposes an understanding. You confirm what
              matters before comparing foundations.
            </p>
            <div className="actions">
              <button type="submit">
                {busy === "analysis"
                  ? "Understanding your idea…"
                  : "Understand my idea →"}
              </button>
              <button
                className="secondary"
                type="button"
                onClick={() => {
                  setReview(true);
                  setPlanStale(Boolean(result));
                }}
              >
                Enter needs manually
              </button>
            </div>
          </div>
        </fieldset>
      </form>

      {busy && (
        <p className="notice" role="status">
          {busy === "analysis"
            ? "Asking the selected provider to propose requirements from your idea…"
            : "Checking confirmed constraints before AI ranking…"}
        </p>
      )}
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {pending && (
        <div className="notice change-confirm" role="alert">
          <h3>Confirm a change to your original requirement</h3>
          <p>
            Original: {String(form[pending.field])}. Proposed:{" "}
            {String(pending.value)}. Your original remains in force until you
            confirm.
          </p>
          <div className="actions">
            <button
              type="button"
              onClick={() => {
                update(pending.field, pending.value, true);
                setPending(null);
              }}
            >
              Confirm requirement change
            </button>
            <button
              className="secondary"
              type="button"
              onClick={() => setPending(null)}
            >
              Keep original requirement
            </button>
          </div>
        </div>
      )}
      {pendingDismiss && (
        <div className="notice change-confirm" role="alert">
          <h3>Confirm your correction</h3>
          <p>
            The model interpreted “{pendingDismiss.value}” as an essential need.
            Confirm that it is not a requirement. The original interpretation
            and your correction will remain in the change history.
          </p>
          <div className="actions">
            <button
              type="button"
              onClick={() => {
                setDismissed((v) => [...v, pendingDismiss.value]);
                setHistory((h) => [
                  ...h,
                  {
                    field: "idea interpretation",
                    before: pendingDismiss.value,
                    after: "Not essential — corrected by user",
                  },
                ]);
                setPendingDismiss(null);
                setError("");
              }}
            >
              Confirm interpretation correction
            </button>
            <button
              className="secondary"
              type="button"
              onClick={() => setPendingDismiss(null)}
            >
              Keep for review
            </button>
          </div>
        </div>
      )}
      {review && (
        <>
          {analysis?.state === "provider_configuration_required" && (
            <div className="notice">
              <h3>Idea analysis requires provider configuration</h3>
              <p>{analysis.activeProvider?.issue?.message}</p>
              <p>
                No AI extraction ran. You can enter structured needs manually
                below, or configure the selected provider and retry.
              </p>
            </div>
          )}
          {!busy && analysis?.state === "provider_error" && (
            <div className="notice" role="alert">
              <h3>
                {analysis.activeProvider?.issue?.code === "timeout"
                  ? "Idea analysis timed out"
                  : analysis.activeProvider?.issue?.code === "invalid_output"
                    ? "Invalid model output"
                    : "Idea analysis unavailable"}
              </h3>
              <p>{analysis.activeProvider?.issue?.message}</p>
              <p>
                No new interpretations were accepted. Your answers are
                preserved. Retry or use the manual fields below.
              </p>
            </div>
          )}
          <div className="understanding" id="understanding">
            <p className="eyebrow">
              {analysis?.state === "analyzed"
                ? "REVIEW BEFORE CONFIRMING"
                : "MANUAL STRUCTURED INPUT"}
            </p>
            <h2>
              {analysis?.state === "analyzed"
                ? "Our proposed understanding"
                : "Tell us how the product should work"}
            </h2>
            <p className="hint">
              Only your answers and confirmed interpretations affect selection.
              Changing an essential need requires confirmation.
            </p>
            <fieldset disabled={!!busy}>
              <div className="form-grid">{productFields.map(editor)}</div>
              {analysis?.analysis?.proposals
                .filter((p) => p.field === "hardRequirement" && !p.category)
                .map((p, i) => (
                  <article className="proposal" key={i}>
                    <h3>
                      {p.kind === "explicitly_stated"
                        ? "Essential need stated in the idea · review interpretation"
                        : "Suggested additional need · needs confirmation"}
                    </h3>
                    <p>{p.value}</p>
                    <blockquote>“{p.excerpt}”</blockquote>
                    {dismissed.includes(p.value) ? (
                      <small>
                        Explicitly corrected: not an essential requirement.
                        Original interpretation retained in history.
                      </small>
                    ) : form.hardRequirements.includes(p.value) ? (
                      <small>
                        Confirmed and retained as an essential requirement.
                      </small>
                    ) : (
                      <div className="actions">
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => {
                            accept(p);
                            setHardDraft(
                              [...form.hardRequirements, p.value].join("\n"),
                            );
                          }}
                        >
                          Confirm essential need
                        </button>
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => setPendingDismiss(p)}
                        >
                          This is not an essential need
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              {analysis?.state === "analyzed" && (
                <details
                  open={analysis.analysis?.proposals.some(
                    (p) =>
                      p.essential &&
                      ["language", "framework", "hosting"].includes(p.field) &&
                      !answered.has(p.field),
                  )}
                >
                  <summary>Technology interpretations & idea evidence</summary>
                  <p>
                    Confirming an interpretation labeled essential also confirms
                    that technology constraint. Your explicit Advanced choices
                    take priority.
                  </p>
                  {analysis.analysis?.proposals
                    .filter((p) =>
                      ["language", "framework", "hosting"].includes(p.field),
                    )
                    .map((p) => (
                      <div key={p.field}>
                        <h4>{fieldLabels[p.field as IdeaField]}</h4>
                        <p>
                          {p.kind === "unknown"
                            ? "Unknown from the idea"
                            : `${p.kind === "explicitly_stated" ? "Stated in idea (review interpretation)" : "Suggested"}: ${valueLabel(p.field, p.value)}`}
                        </p>
                        {p.excerpt && <blockquote>“{p.excerpt}”</blockquote>}
                        {p.kind !== "unknown" && !answered.has(p.field) && (
                          <button
                            type="button"
                            className="secondary"
                            onClick={() => accept(p)}
                          >
                            Confirm{" "}
                            {p.essential
                              ? "essential technology"
                              : "preference"}
                          </button>
                        )}
                        {answered.has(p.field) && (
                          <small>Your explicit answer takes priority.</small>
                        )}
                      </div>
                    ))}
                </details>
              )}
              <ScopeReview
                items={form.scope ?? []}
                proposals={
                  analysis?.analysis?.proposals.filter(
                    (p) =>
                      p.field === "hardRequirement" &&
                      !!p.category &&
                      !dismissed.includes(p.value),
                  ) ?? []
                }
                change={(items) => update("scope", items)}
              />
              {clarifications.length > 0 && (
                <div className="notice" role="alert">
                  <h3>Clarify these dependencies</h3>
                  <ul>
                    {clarifications.map((q) => (
                      <li key={q}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="submit-row">
                <p>
                  Saved records persist in a database without a worker.
                  Background work means scheduled processing or long-running
                  tasks. Essential dependencies remain visible even for custom
                  workflows.
                </p>
                <button type="button" onClick={confirmScope}>
                  Confirm scope
                </button>
              </div>
            </fieldset>
            {evidenceHistory.length > 0 && (
              <details>
                <summary>
                  Supporting excerpts & original interpretations
                </summary>
                {evidenceHistory.map((entry, i) => (
                  <article key={i}>
                    <h4>Idea review {i + 1}</h4>
                    <p>{entry.idea}</p>
                    {entry.response.analysis?.proposals.map((p, j) => (
                      <div key={j}>
                        <p>
                          {p.field === "hardRequirement"
                            ? p.category
                              ? "Scope interpretation"
                              : "Additional essential need"
                            : fieldLabels[p.field]}
                          : {valueLabel(p.field, p.value)} ·{" "}
                          {p.kind.replaceAll("_", " ")}
                          {p.essential ? " · essential interpretation" : ""}
                        </p>
                        {p.excerpt && <blockquote>“{p.excerpt}”</blockquote>}
                      </div>
                    ))}
                  </article>
                ))}
              </details>
            )}
            {history.length > 0 && (
              <details>
                <summary>Original requirements & confirmed changes</summary>
                {history.map((h, i) => (
                  <p key={i}>
                    {h.field === "scope"
                      ? "Scoped requirements changed after explicit confirmation. Original evidence remains in Developer diagnostics."
                      : `${h.field}: ${h.before} → ${h.after}`}
                  </p>
                ))}
              </details>
            )}
          </div>
          {result && planStale && (
            <div className="notice" role="status">
              Plan outdated — confirmed requirements changed. Review and confirm
              the current scope, then recalculate. Previous selection is not a
              current verdict.
            </div>
          )}
          {scopeConfirmed && (
            <section className="confirmed-scope">
              <p className="eyebrow">3 · CONFIRMED SCOPE</p>
              <h2>Your confirmed product scope</h2>
              <p>
                Your account/capability answers and scoped requirements drive
                the plan. Essential custom workflows remain essential.
              </p>
              <ul>
                {(form.scope ?? []).map((item) => (
                  <li key={item.id}>
                    {item.text} · {item.importance}
                  </li>
                ))}
                {form.hardRequirements.map((item) => (
                  <li key={item}>
                    {item} · essential infrastructure constraint
                  </li>
                ))}
              </ul>
              <button type="button" disabled={!!busy} onClick={compare}>
                {planStale
                  ? "Recalculate foundation plan"
                  : "Compare foundations →"}
              </button>
            </section>
          )}
          {result && !planStale && scopeConfirmed && (
            <FoundationPlanPanel
              result={result}
              requirements={form}
              setup={setup}
              change={setSetup}
              review={() =>
                document
                  .getElementById("understanding")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            />
          )}
        </>
      )}
    </section>
  );
}
