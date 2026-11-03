"use client";
import type { RecommendationResult, Requirements } from "../lib/contracts";
import { capabilityLabels } from "../lib/idea-analysis";
import { inferenceLabel } from "../lib/inference";

export function RecommendationPanel({
  result,
  requirements,
  onReview,
}: {
  result: RecommendationResult;
  requirements: Requirements;
  onReview: () => void;
}) {
  const ranked = result.rankings[0];
  const foundation =
    result.eligible.find((f) => f.id === ranked?.foundationId) ??
    (result.eligible.length === 1 ? result.eligible[0] : null);
  return (
    <section className="results" id="results" aria-live="polite">
      <p className="eyebrow">YOUR FOUNDATION REVIEW</p>
      <h2>
        {result.state === "unsupported"
          ? "Your essential needs exceed this catalog"
          : result.questions.length
            ? "A few decisions still matter"
            : foundation
              ? foundation.name
              : "Two possible starting points"}
      </h2>
      <p className="status-line">
        Planned foundation · Not generated or verified
      </p>
      {result.activeProvider?.issue && (
        <p className="inline-note" role="alert">
          {result.activeProvider.issue.message}
        </p>
      )}
      {result.state === "unsupported" ? (
        <>
          <p>
            Neither definition meets every essential requirement you’ve
            confirmed. Your original needs are retained.
          </p>
          <ul>
            {requirements.billing === "required" && (
              <li>
                Collecting customer payments is essential to your idea. Neither
                definition includes payments yet.
              </li>
            )}
            {requirements.background === "required" && (
              <li>
                Tasks that keep running after someone leaves are essential.
                Background processing is outside this catalog.
              </li>
            )}
            {requirements.stackIsHard &&
              !["unknown", "no-preference", "typescript"].includes(
                requirements.language,
              ) && (
                <li>
                  Your required language is {requirements.language}. Both
                  definitions currently use TypeScript.
                </li>
              )}
            {requirements.stackIsHard &&
              !["unknown", "no-preference", "nextjs"].includes(
                requirements.framework,
              ) && (
                <li>
                  Your required framework is {requirements.framework}. Both
                  definitions currently use Next.js.
                </li>
              )}
            {requirements.supabaseEligibility === "ineligible" && (
              <li>
                Both definitions rely on Supabase, which you said is unavailable
                or prohibited. Another provider is not supported yet.
              </li>
            )}
            {requirements.hostingIsHard && requirements.hosting === "other" && (
              <li>Your essential hosting choice is outside current support.</li>
            )}
            {requirements.hardRequirements.map((h) => (
              <li key={h}>
                Your essential requirement “{h}” must remain satisfied; check
                the exclusions below for its current support.
              </li>
            ))}
          </ul>
          <h3>Supported alternatives</h3>
          <p>
            The catalog covers sign-in and saved records for independent
            customers, or shared workspaces with member permissions and optional
            private files. Payments and background processing need future
            catalog support.
          </p>
          {requirements.accountModel === "individual" &&
            requirements.uploads === "required" && (
              <p>
                The team definition includes private files, but it changes how
                accounts work. Review that trade-off only if shared workspaces
                suit your product.
              </p>
            )}
          <p>
            <b>Next step:</b> keep your essential needs for a future supported
            foundation, or review them and explicitly confirm any change below.
          </p>
          <button type="button" className="secondary" onClick={onReview}>
            Review my original needs
          </button>
        </>
      ) : (
        <>
          <p className="hint">
            {ranked
              ? `Suggested foundation · ranked by ${inferenceLabel(result.meta!)}`
              : "Catalog comparison based on your confirmed answers · no AI recommendation accepted"}
          </p>
          <h3>Why it fits</h3>
          {ranked ? (
            <ul>
              {ranked.explanations.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          ) : (
            <p>
              {foundation
                ? `Its ${foundation.accountModel === "team" ? "shared workspaces match collaborative customer accounts" : "independent accounts match customers who work on their own"}.`
                : "Your answers allow both account structures. Choose the approach that best matches how your customers work."}{" "}
              This is a provisional catalog fit; setup and costs remain
              unresolved.
            </p>
          )}
          <h3>Included capabilities</h3>
          {foundation ? (
            <div className="tags">
              {foundation.capabilities
                .filter(
                  (c) => c !== "uploads" || requirements.uploads === "required",
                )
                .map((c) => (
                  <span key={c}>{capabilityLabels[c] ?? c}</span>
                ))}
            </div>
          ) : (
            <p>
              Both describe sign-in and saved records. The team definition also
              describes shared workspaces, invitations and member permissions.
            </p>
          )}
          <h3>Decisions still needed</h3>
          {result.questions.length > 0 && (
            <p>
              Answer the highlighted questions in your understanding below
              before ranking.
            </p>
          )}
          <ul>
            <li>
              {requirements.monthlyBudget === null
                ? "Budget not decided. Cost fit remains unknown."
                : requirements.monthlyBudget === 0
                  ? "Your budget is $0/month. Free-tier access and usage limits must be checked; free operation is not established."
                  : `Cost fit against your $${requirements.monthlyBudget}/month ceiling is unverified.`}
            </li>
            {requirements.supabaseEligibility === "unknown" && (
              <li>
                Both foundations consider Supabase for sign-in and saved
                records. Confirm account and regional access during setup, after
                reviewing this choice.
              </li>
            )}
            {requirements.hosting === "unknown" && (
              <li>Choose hosting during setup.</li>
            )}
            {(requirements.language === "unknown" ||
              requirements.framework === "unknown") && (
              <li>
                Review the proposed TypeScript / Next.js stack before setup; it
                has not been confirmed.
              </li>
            )}
            {requirements.uploads === "optional" && (
              <li>
                Private file uploads are optional and have not been selected.
              </li>
            )}
          </ul>
          <p>
            <b>Next step:</b>{" "}
            {result.questions.length
              ? "answer the remaining product questions below and compare again."
              : "review the service and cost prerequisites. Project creation will follow in a later milestone."}
          </p>
          {result.state === "provider_configuration_required" && (
            <p className="inline-note">
              AI ranking requires provider configuration. The comparison above
              comes from compatibility rules.
            </p>
          )}
          {result.state === "provider_error" && (
            <p role="alert" className="inline-note">
              The selected provider failed or returned an invalid selection. The
              rules-based comparison remains available.
            </p>
          )}
        </>
      )}
      <details className="result-details">
        <summary>Technical details, exclusions, sources & verification</summary>
        {result.eligible.map((f) => (
          <article key={f.id}>
            <h3>{f.name}</h3>
            <p>{f.technologies.join(" · ")}</p>
            <h4>Prerequisites</h4>
            <ul>
              {f.prerequisites.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <h4>Limitations</h4>
            <ul>
              {f.limitations.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <p>
              Version {f.version} · Sources reviewed {f.reviewedAt}
            </p>
            {f.sources.map((s, i) => (
              <a
                className="source"
                href={s}
                key={s}
                target="_blank"
                rel="noreferrer"
              >
                Official reference {i + 1} ↗
              </a>
            ))}
          </article>
        ))}
        {result.eliminated.map((f) => (
          <article key={f.foundationId}>
            <h4>Excluded: {f.foundationId}</h4>
            <ul>
              {f.reasons.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </article>
        ))}
        <h4>Unresolved compatibility</h4>
        <ul>
          {result.unresolved.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
        <h4>Omitted or optional</h4>
        <ul>
          {result.omissions.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
        <p>
          Code verification: planned. External configuration: pending.
          Integration verification: planned. No generated application checks
          have been executed.
        </p>
        {result.meta && (
          <p>
            Real {inferenceLabel(result.meta)} ranking call ·{" "}
            {result.meta.model} · {result.meta.calledAt}
          </p>
        )}
      </details>
    </section>
  );
}
