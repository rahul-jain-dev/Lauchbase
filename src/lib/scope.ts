import { z } from "zod";
export const ScopeCategory = z.enum([
  "foundation_capability",
  "product_workflow",
  "external_integration",
  "technical_constraint",
  "unresolved",
]);
export const ScopeDependency = z.enum([
  "sign_in",
  "saved_records",
  "workspaces",
  "invitations",
  "private_files",
  "project_permissions",
  "background",
  "payments",
  "external_service",
  "unknown",
]);
export const ScopeRequirement = z
  .object({
    id: z.string().min(1).max(80),
    text: z.string().min(3).max(200),
    originalText: z.string().min(3).max(200).optional(),
    category: ScopeCategory,
    constraint: z
      .enum([
        "none",
        "typescript_only",
        "nextjs_only",
        "python_only",
        "self_host_only",
        "other",
      ])
      .optional(),
    importance: z.enum(["essential", "optional", "unknown"]),
    dependencies: z.array(ScopeDependency).max(10),
    source: z.enum(["user", "model"]),
    excerpt: z.string().min(8).max(1000).nullable(),
    confirmed: z.boolean(),
  })
  .strict();
export type ScopeRequirement = z.infer<typeof ScopeRequirement>;
export function nextScopeId(items: ScopeRequirement[], prefix = "scope") {
  let i = 0;
  while (items.some((item) => item.id === `${prefix}-${i}`)) i++;
  return `${prefix}-${i}`;
}
export const categoryLabels: Record<z.infer<typeof ScopeCategory>, string> = {
  foundation_capability: "Foundation capability",
  product_workflow: "Product workflow to develop",
  external_integration: "External integration",
  technical_constraint: "Technical constraint",
  unresolved: "Needs clarification",
};
export const dependencyLabels: Record<
  z.infer<typeof ScopeDependency>,
  string
> = {
  sign_in: "Sign-in",
  saved_records: "Saved database records",
  workspaces: "Shared workspaces",
  invitations: "Invitations",
  private_files: "Private file uploads",
  project_permissions: "Project-level client permissions",
  background: "Scheduled or long-running background work",
  payments: "Customer payments",
  external_service: "An external integration",
  unknown: "Dependencies need clarification",
};
export function scopeDecisions(scope: ScopeRequirement[]) {
  const blockers: string[] = [],
    questions: string[] = [],
    gaps: string[] = [];
  for (const r of scope) {
    if (!r.confirmed) {
      questions.push(`Review and confirm: ${r.text}`);
      continue;
    }
    if (r.importance === "unknown" || r.category === "unresolved")
      questions.push(`Clarify the importance/category of: ${r.text}`);
    if (r.importance !== "essential") continue;
    if (r.category === "external_integration")
      blockers.push(`Essential integration outside this catalog: ${r.text}`);
    if (r.category === "technical_constraint" && r.constraint === "python_only")
      blockers.push(`Python-only is outside this catalog: ${r.text}`);
    if (
      r.category === "technical_constraint" &&
      ![
        "typescript_only",
        "nextjs_only",
        "python_only",
        "self_host_only",
      ].includes(r.constraint ?? "none")
    )
      questions.push(
        `Map this technical constraint or keep it unresolved: ${r.text}`,
      );
    if (r.dependencies.includes("background"))
      blockers.push(
        `“${r.text}” needs scheduled/background execution, which this catalog does not provide.`,
      );
    if (r.dependencies.includes("payments"))
      blockers.push(
        `“${r.text}” needs payment processing, which this catalog does not provide.`,
      );
    if (r.dependencies.includes("external_service"))
      blockers.push(
        `“${r.text}” depends on an external integration without a catalog adapter.`,
      );
    if (
      (r.dependencies.includes("unknown") || !r.dependencies.length) &&
      r.category !== "technical_constraint"
    )
      questions.push(
        `Clarify infrastructure/security dependencies for: ${r.text}`,
      );
    if (r.dependencies.includes("project_permissions"))
      gaps.push(
        `“${r.text}” needs project-level client access rules. Workspace membership alone is insufficient; an authorization extension and isolation tests are required.`,
      );
  }
  return {
    blockers: [...new Set(blockers)],
    questions: [...new Set(questions)],
    gaps: [...new Set(gaps)],
  };
}
