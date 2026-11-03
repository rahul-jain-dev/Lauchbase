import { emptyRequirements, type IdeaAnalysis } from "./idea-analysis";
import { Requirements } from "./contracts";
import { filterCatalog } from "./recommendation";

// Representative inputs explicitly authored for live/fixture checks. Not user requirements.
export const analysisCaseIds = [
  "individual",
  "agency",
  "ambiguous",
  "unsupported",
  "scheduled",
] as const;
export type AnalysisCaseId = (typeof analysisCaseIds)[number];
export const analysisCases: Record<
  AnalysisCaseId,
  { idea: string; expected: Partial<Requirements> }
> = {
  individual: {
    idea: "A personal contact manager. Each customer works independently with their own private saved contacts. No customer payments, file uploads or background tasks are needed. I am a beginner who knows Python, but I have no programming language or framework requirement.",
    expected: {
      accountModel: "individual",
      billing: "no",
      uploads: "no",
      background: "no",
    },
  },
  agency: {
    idea: "A design agency client portal. Staff and clients collaborate in shared workspaces. Clients must upload private design files. Reviewing deliverables and approving milestones are essential product workflows. Clients must only access their own projects. No customer payments or background tasks are needed.",
    expected: {
      accountModel: "team",
      billing: "no",
      uploads: "required",
      background: "no",
    },
  },
  ambiguous: {
    idea: "A client portal for ticket booking.",
    expected: {
      accountModel: "unknown",
      billing: "unknown",
      uploads: "unknown",
      background: "unknown",
    },
  },
  unsupported: {
    idea: "An individual-user contact manager with independently owned records. It must integrate with Salesforce; this integration is essential. No customer payments, file uploads or background tasks are needed.",
    expected: {
      accountModel: "individual",
      billing: "no",
      uploads: "no",
      background: "no",
    },
  },
  scheduled: {
    idea: "An individual contact manager. Each customer owns their records independently. It must send scheduled reminder emails every day. These scheduled reminders are essential. No customer payments or file uploads are needed.",
    expected: {
      accountModel: "individual",
      billing: "no",
      uploads: "no",
      background: "required",
    },
  },
};
export function assessAnalysisCase(
  caseId: AnalysisCaseId,
  analysis: IdeaAnalysis,
) {
  const scenario = analysisCases[caseId];
  const byField = new Map(analysis.proposals.map((p) => [p.field, p]));
  const issues: { path: string; code: string }[] = [];
  for (const [field, expected] of Object.entries(scenario.expected)) {
    if (byField.get(field as never)?.value !== expected)
      issues.push({ path: field, code: "representative_value_mismatch" });
  }
  if (caseId === "individual")
    for (const field of ["language", "framework"] as const) {
      const p = byField.get(field)!;
      if (!["unknown", "no-preference"].includes(p.value) || p.essential)
        issues.push({ path: field, code: "skill_is_not_stack_requirement" });
    }
  const additional = analysis.proposals.filter(
    (p) => p.field === "hardRequirement",
  );
  if (caseId === "agency") {
    const workflows = additional.filter(
      (p) => p.category === "product_workflow" && p.essential,
    );
    if (
      !workflows.some((p) => /review|deliverable/i.test(p.value)) ||
      !workflows.some((p) => /approv|milestone/i.test(p.value))
    )
      issues.push({
        path: "additionalRequirements",
        code: "essential_agency_workflows_missing_or_miscategorized",
      });
  }
  if (
    caseId === "unsupported" &&
    !additional.some((p) => p.essential && /salesforce/i.test(p.value))
  )
    issues.push({
      path: "additionalRequirements",
      code: "essential_integration_missing",
    });
  // Extra requirements, such as agency file privacy, are not automatically invented.
  // Preserve them for user review; do not discard them to manufacture a catalog match.
  // Hypothetical projection for assessment only. This never confirms answers in the app.
  const projected = Requirements.parse({
    ...emptyRequirements,
    idea: scenario.idea,
    ...Object.fromEntries(
      analysis.proposals
        .filter((p) => p.field !== "hardRequirement")
        .map((p) => [p.field, p.value]),
    ),
    hardRequirements: additional.filter((p) => !p.category).map((p) => p.value),
    scope: additional
      .filter((p) => p.category)
      .map((p, i) => ({
        id: `case-${i}`,
        text: p.value,
        category: p.category!,
        importance: p.essential ? "essential" : "optional",
        dependencies: p.dependencies ?? ["unknown"],
        excerpt: p.excerpt,
        source: "model",
        confirmed: true,
      })),
  });
  const catalog = filterCatalog(projected);
  return {
    categoryCounts: Object.fromEntries(
      [
        "foundation_capability",
        "product_workflow",
        "external_integration",
        "technical_constraint",
        "unresolved",
      ].map((category) => [
        category,
        additional.filter((p) => p.category === category).length,
      ]),
    ),
    dependencyCodes: [
      ...new Set(additional.flatMap((p) => p.dependencies ?? ["unknown"])),
    ],
    assessmentStage: "representative_semantics",
    extractionPassed: issues.length === 0,
    assessmentVersion: "representative-cases-v2",
    additionalRequirementCount: additional.length,
    decisionsNeeded:
      caseId !== "unsupported" && additional.length
        ? ["review_additional_requirements"]
        : [],
    issues,
    catalogAssessment: "hypothetical_if_user_confirmed",
    catalogState: catalog.state,
    eligibleIds: catalog.eligible.map((f) => f.id),
    unsupportedRequirementPreserved:
      caseId === "unsupported"
        ? additional.some((p) => p.essential && /salesforce/i.test(p.value))
        : null,
  };
}
