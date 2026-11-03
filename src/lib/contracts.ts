import { z } from "zod";
import { InferenceEvidence, ProviderStatus } from "./inference";
import { ScopeRequirement } from "./scope";

export const Need = z.enum(["unknown", "required", "optional", "no"]);
export const Assumption = z
  .object({
    field: z.enum(["accountModel", "hosting"]),
    value: z.enum(["individual", "team", "vercel", "self-host"]),
    confirmed: z.boolean(),
  })
  .strict()
  .refine(
    (a) =>
      a.field === "accountModel"
        ? ["individual", "team"].includes(a.value)
        : ["vercel", "self-host"].includes(a.value),
    "Assumption value does not match its field",
  );
export const Requirements = z
  .object({
    idea: z
      .string()
      .trim()
      .min(10, "Describe your idea in at least 10 characters.")
      .max(3000),
    experience: z.enum(["unknown", "beginner", "comfortable", "experienced"]),
    language: z.enum([
      "unknown",
      "no-preference",
      "typescript",
      "python",
      "other",
    ]),
    framework: z.enum([
      "unknown",
      "no-preference",
      "nextjs",
      "django",
      "other",
    ]),
    stackIsHard: z.boolean(),
    monthlyBudget: z.number().finite().min(0).max(1000000).nullable(),
    accountModel: z.enum(["unknown", "either", "individual", "team"]),
    billing: Need,
    uploads: Need,
    background: Need,
    hosting: z.enum([
      "unknown",
      "no-preference",
      "vercel",
      "self-host",
      "other",
    ]),
    hostingIsHard: z.boolean(),
    existingServices: z.string().trim().max(1000),
    country: z.string().trim().max(100),
    supabaseEligibility: z.enum(["unknown", "eligible", "ineligible"]),
    hardRequirements: z.array(z.string().trim().min(1).max(200)).max(10),
    assumptions: z.array(Assumption).max(2),
    scope: z.array(ScopeRequirement).max(30).optional(),
  })
  .strict()
  .refine(
    (r) =>
      new Set(r.assumptions.map((a) => a.field)).size === r.assumptions.length,
    "Only one assumption per field is allowed",
  )
  .refine(
    (r) => new Set(r.scope?.map((s) => s.id)).size === (r.scope?.length ?? 0),
    "Scope requirement identifiers must be unique",
  )
  .refine(
    (r) =>
      (r.scope ?? []).every(
        (s) =>
          s.source !== "model" ||
          (s.excerpt !== null && r.idea.includes(s.excerpt)),
      ),
    "Model-sourced scope must retain an exact excerpt of the current idea",
  );
export type Requirements = z.infer<typeof Requirements>;

export const Verification = z.discriminatedUnion("state", [
  z.object({ state: z.literal("planned") }),
  z.object({
    state: z.literal("pending_configuration"),
    reason: z.string().min(1),
  }),
  z.object({
    state: z.literal("executed"),
    executedAt: z.iso.datetime(),
    evidence: z.string().min(1),
  }),
  z.object({
    state: z.literal("passed"),
    executedAt: z.iso.datetime(),
    evidence: z.string().min(1),
  }),
  z.object({
    state: z.literal("failed"),
    executedAt: z.iso.datetime(),
    evidence: z.string().min(1),
  }),
]);
export const Clarification = z.object({
  id: z.string(),
  fields: z.array(z.string()),
  question: z.string(),
});
export const ModuleEntry = z.object({
  id: z.string(),
  version: z.string(),
  purpose: z.string(),
  capabilities: z.array(z.string()),
  prerequisites: z.array(z.string()),
  incompatibleWith: z.array(z.string()),
  technologies: z.array(
    z.object({ name: z.string(), supportedRange: z.string() }),
  ),
  limitations: z.array(z.string()),
  sources: z.array(z.url()),
  reviewedAt: z.iso.date(),
  verification: Verification,
});
export const Foundation = z.object({
  id: z.enum(["individual", "team"]),
  version: z.string(),
  name: z.string(),
  description: z.string(),
  accountModel: z.enum(["individual", "team"]),
  moduleIds: z.array(z.string()),
  capabilities: z.array(z.string()),
  prerequisites: z.array(z.string()),
  technologies: z.array(z.string()),
  limitations: z.array(z.string()),
  sources: z.array(z.url()),
  reviewedAt: z.iso.date(),
  maturity: z.literal("catalog_definition"),
  verification: Verification,
});
export type Foundation = z.infer<typeof Foundation>;
export const ReasonCode = z.enum([
  "account_fit",
  "stack_fit",
  "private_uploads",
  "managed_services",
  "hosting_fit",
]);
export type ReasonCode = z.infer<typeof ReasonCode>;
export const ModelRanking = z
  .object({
    rankings: z
      .array(
        z
          .object({
            foundationId: z.string(),
            reasonCodes: z.array(ReasonCode).min(1).max(5),
          })
          .strict(),
      )
      .min(1)
      .max(2),
  })
  .strict();
export const RecommendationResult = z.object({
  state: z.enum([
    "needs_clarification",
    "unsupported",
    "provider_configuration_required",
    "provider_error",
    "recommended",
  ]),
  eligible: z.array(Foundation),
  eliminated: z.array(
    z.object({ foundationId: z.string(), reasons: z.array(z.string()) }),
  ),
  unresolved: z.array(z.string()),
  omissions: z.array(z.string()),
  questions: z.array(Clarification),
  rankings: z.array(
    z.object({ foundationId: z.string(), explanations: z.array(z.string()) }),
  ),
  message: z.string(),
  meta: InferenceEvidence.nullable(),
  activeProvider: ProviderStatus.optional(),
});
export type RecommendationResult = z.infer<typeof RecommendationResult>;
