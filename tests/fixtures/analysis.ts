import { ideaFields } from "../../src/lib/idea-analysis";
import { analysisCases } from "../../src/lib/analysis-cases";

// Synthetic provider payloads only. Never imported by application code.
export function wireFixture(
  proposals: { field: string; [key: string]: unknown }[],
): Record<string, unknown> & {
  additionalRequirements: Record<string, unknown>[];
} {
  return {
    ...Object.fromEntries(
      proposals
        .filter((p) => p.field !== "hardRequirement")
        .map(({ field, ...value }) => [field, value]),
    ),
    additionalRequirements: proposals
      .filter((p) => p.field === "hardRequirement")
      .map((p) => ({
        value: p.value,
        kind: p.kind,
        essential: p.essential,
        category: p.category ?? "unresolved",
        dependencies: p.dependencies ?? ["unknown"],
        excerpt: p.excerpt,
      })),
  };
}
export const unknownWireFixture = () =>
  wireFixture(
    ideaFields.map((field) => ({
      field,
      value: "unknown",
      kind: "unknown",
      essential: false,
      excerpt: null,
    })),
  );
export function individualWireFixture() {
  const result = unknownWireFixture();
  for (const [field, value] of Object.entries({
    accountModel: "individual",
    billing: "no",
    uploads: "no",
    background: "no",
  }))
    result[field] = {
      value,
      kind: "explicitly_stated",
      essential: false,
      excerpt: analysisCases.individual.idea,
    };
  return result;
}
