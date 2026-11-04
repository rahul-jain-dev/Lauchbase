"use client";
import { useEffect, useState } from "react";
import { emptyRequirements } from "../lib/idea-analysis";
import type { Requirements } from "../lib/contracts";
import { ProviderDiagnostics } from "./provider-diagnostics";
export function DeveloperDiagnostics({ connection }: { connection: unknown }) {
  const [context, setContext] = useState<{
    requirements: Requirements;
    [key: string]: unknown;
  }>({ requirements: emptyRequirements });
  useEffect(() => {
    const receive = (event: Event) => setContext((event as CustomEvent).detail);
    window.addEventListener("launchbase-context", receive);
    window.dispatchEvent(new Event("launchbase-context-request"));
    return () => window.removeEventListener("launchbase-context", receive);
  }, []);
  return (
    <details className="developer-diagnostics">
      <summary>Developer diagnostics</summary>
      <p>
        This is SaaSFoundation’s inference connection and evidence, separate from
        your product’s technology stack. Historical results keep their original
        provider/model attribution.
      </p>
      <ProviderDiagnostics
        requirements={context.requirements}
        disabled={false}
      />
      <details>
        <summary>
          Safe provider, model, contract and verification evidence
        </summary>
        <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
          {JSON.stringify(
            {
              connection,
              analysis: context.analysisMeta,
              ranking: context.rankingMeta,
              issue: context.issue,
              history: context.history,
              foundationPlan: context.plan,
              requirementChanges: context.requirementChanges,
            },
            null,
            2,
          )}
        </pre>
      </details>
    </details>
  );
}
