import { z } from "zod";
import { Requirements } from "./contracts";
import { Proposal, ideaFields, validateIdeaAnalysis } from "./idea-analysis";
import { ScopeCategory, ScopeDependency } from "./scope";

// A provider-facing shape only. UI/domain proposals still require explicit user review.
export { ANALYSIS_CONTRACT_VERSION } from "./ai-contract-version";
function field(values: readonly string[]) {
  return z.union([
    z
      .object({
        value: z.enum(["unknown"]),
        kind: z.enum(["unknown"]),
        essential: z.literal(false),
        excerpt: z.null(),
      })
      .strict(),
    z
      .object({
        value: z.enum(
          values.filter((value) => value !== "unknown") as [
            string,
            ...string[],
          ],
        ),
        kind: z.enum(["explicitly_stated", "suggested"]),
        essential: z.boolean(),
        excerpt: z
          .string()
          .min(8)
          .max(1000)
          .describe(
            "A verbatim substring of the idea, at least 8 characters. For unknown, use null, never an empty string or invented evidence.",
          ),
      })
      .strict(),
  ]);
}
export const WireIdeaAnalysis = z
  .object({
    accountModel: field(Requirements.shape.accountModel.options),
    billing: field(Requirements.shape.billing.options),
    uploads: field(Requirements.shape.uploads.options),
    background: field(Requirements.shape.background.options),
    language: field(Requirements.shape.language.options),
    framework: field(Requirements.shape.framework.options),
    hosting: field(Requirements.shape.hosting.options),
    additionalRequirements: z
      .array(
        z
          .object({
            value: Proposal.shape.value,
            kind: z.enum(["explicitly_stated", "suggested"]),
            essential: z.boolean(),
            category: ScopeCategory,
            dependencies: z.array(ScopeDependency).max(10),
            excerpt: z.string().min(8).max(1000),
          })
          .strict(),
      )
      .max(10)
      .describe(
        "Product workflows, extra foundation capabilities, external integrations, technical constraints and unresolved needs. Importance (essential) is independent of category. Preserve all important requirements with exact idea evidence; list infrastructure/security dependencies explicitly. Use unknown dependencies when unclear.",
      ),
  })
  .strict();
export type WireIdeaAnalysis = z.infer<typeof WireIdeaAnalysis>;
export function analysisFromWire(raw: unknown, idea: string) {
  const wire = WireIdeaAnalysis.parse(raw);
  return validateIdeaAnalysis(
    {
      proposals: [
        ...ideaFields.map((field) => ({ field, ...wire[field] })),
        ...wire.additionalRequirements.map((requirement) => ({
          field: "hardRequirement",
          ...requirement,
        })),
      ],
    },
    idea,
  );
}
