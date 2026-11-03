"use client";
import { useState } from "react";
import type { Requirements } from "../lib/contracts";
import { AI_CLIENT_TIMEOUT_MS } from "../lib/provider-timing";
import { analysisCaseIds } from "../lib/analysis-cases";

export function ProviderDiagnostics({
  requirements,
  disabled,
}: {
  requirements: Requirements;
  disabled: boolean;
}) {
  const [busy, setBusy] = useState("");
  const [reports, setReports] = useState<unknown[]>([]);
  const [error, setError] = useState("");
  async function run(cases = false) {
    setReports([]);
    setError("");
    try {
      for (const step of cases ? analysisCaseIds : ["minimal", "analysis"]) {
        const operation = cases ? "analysis_case" : step;
        setBusy(
          cases
            ? `Checking representative analysis: ${step}…`
            : operation === "minimal"
              ? "Timing a minimal structured request…"
              : "Timing the full idea analysis…",
        );
        const response = await fetch("/api/provider-diagnostics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            cases ? { operation, caseId: step } : { operation, requirements },
          ),
          signal: AbortSignal.timeout(AI_CLIENT_TIMEOUT_MS),
        });
        const report = await response.json();
        if (!response.ok)
          throw new Error(
            report.error ?? "Could not run the timing comparison.",
          );
        setReports((previous) => [...previous, report]);
        // Do not spend another call when the connection is unusable.
        if (
          [
            "authentication_failed",
            "billing_quota",
            "access_denied",
            "incompatible_model",
          ].includes(report.issue?.code)
        )
          break;
      }
    } catch (e) {
      setError(
        e instanceof Error && ["TimeoutError", "AbortError"].includes(e.name)
          ? "The timing check exceeded the client deadline. Your idea and answers are preserved."
          : e instanceof Error
            ? e.message
            : "Timing check failed.",
      );
    } finally {
      setBusy("");
    }
  }
  return (
    <details className="request-diagnostics">
      <summary>AI request timing tools</summary>
      <p>
        Compare a minimal structured request with analysis of your current idea
        using the active Settings connection. This makes up to two API requests,
        with at most one retry each, and may consume provider credits. Results
        contain timings and status only; proposed requirements still need review
        through Understand my idea.
      </p>
      <button
        type="button"
        className="secondary"
        disabled={disabled || !!busy}
        onClick={() => void run()}
      >
        Compare AI request timings
      </button>
      <p>
        Reliability check: five representative ideas (individual contact
        manager, agency with private uploads, ambiguous booking, and an
        essential unsupported integration, and scheduled work). This makes five
        analysis requests, each with at most one transient retry, using only the
        selected Settings connection. It may consume credits. Extraction and
        catalog fit are assessed separately; no form answers are confirmed or
        changed.
      </p>
      <button
        type="button"
        className="secondary"
        disabled={disabled || !!busy}
        onClick={() => void run(true)}
      >
        Run five analysis checks
      </button>
      {busy && <p role="status">{busy}</p>}
      {error && <p role="alert">{error}</p>}
      {reports.length > 0 && (
        <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
          {JSON.stringify(reports, null, 2)}
        </pre>
      )}
    </details>
  );
}
