import { z } from "zod";
import { Requirements } from "./contracts";
import { InferenceEvidence, ProviderStatus } from "./inference";
import { ScopeCategory, ScopeDependency, nextScopeId } from "./scope";

export const ideaFields = [
  "accountModel",
  "billing",
  "uploads",
  "background",
  "language",
  "framework",
  "hosting",
] as const;
export type IdeaField = (typeof ideaFields)[number];
export const Proposal = z
  .object({
    field: z.enum([...ideaFields, "hardRequirement"]),
    value: z.string().min(1).max(200),
    kind: z.enum(["explicitly_stated", "suggested", "unknown"]),
    essential: z.boolean(),
    excerpt: z.string().min(8).max(1000).nullable(),
    category: ScopeCategory.optional(),
    dependencies: z.array(ScopeDependency).max(10).optional(),
  })
  .strict();
export type Proposal = z.infer<typeof Proposal>;
export const IdeaAnalysis = z
  .object({ proposals: z.array(Proposal).min(7).max(17) })
  .strict();
export type IdeaAnalysis = z.infer<typeof IdeaAnalysis>;
export class IdeaValidationError extends Error {
  constructor(
    public path: string,
    public rule: string,
    message: string,
  ) {
    super(message);
  }
}
export const AnalysisResponse = z.object({
  state: z.enum([
    "analyzed",
    "provider_configuration_required",
    "provider_error",
  ]),
  analysis: IdeaAnalysis.nullable(),
  meta: InferenceEvidence.nullable(),
  activeProvider: ProviderStatus.optional(),
});

export function validateIdeaAnalysis(raw: unknown, idea: string): IdeaAnalysis {
  const analysis = IdeaAnalysis.parse(raw);
  for (const field of ideaFields) {
    if (analysis.proposals.filter((p) => p.field === field).length !== 1)
      throw new IdeaValidationError(
        `proposals.${field}`,
        "missing_or_duplicate_fields",
        "Each structured field must appear exactly once",
      );
  }
  const extra = analysis.proposals.filter((p) => p.field === "hardRequirement");
  if (new Set(extra.map((p) => p.value)).size !== extra.length)
    throw new IdeaValidationError(
      "proposals.hardRequirement",
      "duplicate_requirements",
      "Duplicate requirements",
    );
  for (const [index, p] of analysis.proposals.entries()) {
    const path = `proposals.${index}`;
    if (p.field === "hardRequirement" && !p.category && !p.essential)
      throw new IdeaValidationError(
        `${path}.essential`,
        "weakened_requirement",
        "Additional hard requirements must retain their essential status",
      );
    if (p.kind === "unknown") {
      if (
        p.value !== "unknown" ||
        p.excerpt !== null ||
        p.essential ||
        p.field === "hardRequirement"
      )
        throw new IdeaValidationError(
          path,
          "invalid_unknown",
          "Unknowns must not invent values or evidence",
        );
      continue;
    }
    if (!p.excerpt || !idea.includes(p.excerpt) || p.excerpt.trim().length < 8)
      throw new IdeaValidationError(
        `${path}.excerpt`,
        "invalid_excerpt",
        "Evidence must be a relevant verbatim excerpt of the idea",
      );
    if (p.field !== "hardRequirement") {
      // Reuse approved field vocabularies; model values cannot add integrations.
      const schema = Requirements.shape[p.field];
      if (!schema.safeParse(p.value).success || p.value === "unknown")
        throw new IdeaValidationError(
          `${path}.value`,
          "unsupported_value",
          "Unsupported extracted value",
        );
    }
  }
  return analysis;
}

export function confirmProposal(
  input: Requirements,
  p: Proposal,
  explicitlyAnswered: ReadonlySet<string>,
): Requirements {
  if (p.kind === "unknown")
    throw new Error("An unknown interpretation cannot be accepted");
  if (p.field !== "hardRequirement" && explicitlyAnswered.has(p.field))
    return input;
  if (p.field === "hardRequirement") {
    if (p.category) {
      if (
        input.scope?.some(
          (item) => item.text === p.value || item.originalText === p.value,
        )
      )
        return input;
      return Requirements.parse({
        ...input,
        scope: [
          ...(input.scope ?? []),
          {
            id: nextScopeId(input.scope ?? []),
            text: p.value,
            originalText: p.value,
            category: p.category,
            importance: p.essential ? "essential" : "optional",
            dependencies: p.dependencies?.length ? p.dependencies : ["unknown"],
            source: "model",
            excerpt: p.excerpt,
            confirmed: true,
          },
        ],
      });
    }
    return Requirements.parse({
      ...input,
      hardRequirements: [...new Set([...input.hardRequirements, p.value])],
    });
  }
  // Confirmation is explicit; mere extraction never changes these fields.
  return Requirements.parse({
    ...input,
    [p.field]: p.value,
    ...((p.field === "language" || p.field === "framework") &&
    p.essential &&
    !explicitlyAnswered.has("stackIsHard")
      ? { stackIsHard: true }
      : {}),
    ...(p.field === "hosting" &&
    p.essential &&
    !explicitlyAnswered.has("hostingIsHard")
      ? { hostingIsHard: true }
      : {}),
  });
}

export const emptyRequirements: Requirements = {
  idea: "",
  experience: "unknown",
  monthlyBudget: null,
  existingServices: "",
  language: "unknown",
  framework: "unknown",
  stackIsHard: false,
  accountModel: "unknown",
  billing: "unknown",
  uploads: "unknown",
  background: "unknown",
  hosting: "unknown",
  hostingIsHard: false,
  country: "",
  supabaseEligibility: "unknown",
  hardRequirements: [],
  assumptions: [],
};
export const capabilityLabels: Record<string, string> = {
  auth: "Sign-in",
  crud: "Saved records",
  teams: "Shared workspaces",
  roles: "Member permissions",
  invitations: "Invitations",
  uploads: "Private file uploads",
};
export const fieldLabels: Record<IdeaField, string> = {
  accountModel:
    "Will customers work independently, or collaborate in shared workspaces?",
  billing: "Does your product need to collect payments from customers?",
  uploads: "Will people upload or share files?",
  background:
    "Does your product need scheduled processing or long-running tasks?",
  language: "Preferred language",
  framework: "Preferred framework",
  hosting: "Hosting preference",
};
export const fieldOptions: Record<IdeaField, [string, string][]> = {
  accountModel: [
    ["unknown", "Not sure yet"],
    ["individual", "Independently"],
    ["team", "In shared workspaces"],
    ["either", "Either approach works"],
  ],
  billing: [
    ["unknown", "Not sure yet"],
    ["required", "Essential"],
    ["optional", "Nice to have"],
    ["no", "Not needed"],
  ],
  uploads: [
    ["unknown", "Not sure yet"],
    ["required", "Essential"],
    ["optional", "Nice to have"],
    ["no", "Not needed"],
  ],
  background: [
    ["unknown", "Not sure yet"],
    ["required", "Essential"],
    ["optional", "Nice to have"],
    ["no", "Not needed"],
  ],
  language: [
    ["unknown", "Not specified"],
    ["no-preference", "No preference"],
    ["typescript", "TypeScript"],
    ["python", "Python"],
    ["other", "Other"],
  ],
  framework: [
    ["unknown", "Not specified"],
    ["no-preference", "No preference"],
    ["nextjs", "Next.js / React"],
    ["django", "Django"],
    ["other", "Other"],
  ],
  hosting: [
    ["unknown", "Not specified"],
    ["no-preference", "No preference"],
    ["vercel", "Vercel"],
    ["self-host", "Self-hosted Node.js"],
    ["other", "Other provider"],
  ],
};
export function valueLabel(field: Proposal["field"], value: string) {
  return field === "hardRequirement"
    ? value
    : (fieldOptions[field].find(([v]) => v === value)?.[1] ?? value);
}
