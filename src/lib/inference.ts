import { z } from "zod";
import { ProviderTiming } from "./provider-timing";

export const Provider = z.enum(["meta", "gemini", "openai-compatible"]);
export type Provider = z.infer<typeof Provider>;
export const providerLabels: Record<Provider, string> = {
  meta: "Meta",
  gemini: "Gemini",
  "openai-compatible": "OpenAI-compatible endpoint",
};
export const InferenceEvidence = z.object({
  // Before provider support, only direct Meta could produce this metadata shape.
  provider: Provider.default("meta"),
  model: z.string(),
  profileId: z.string().optional(),
  requestedModel: z.string().optional(),
  calledAt: z.iso.datetime(),
  contractVersion: z.string().optional(),
  timing: ProviderTiming.optional(),
});
export type InferenceEvidence = z.infer<typeof InferenceEvidence>;
export const ProviderStatus = z.object({
  provider: Provider.nullable(),
  model: z.string().nullable(),
  ready: z.boolean(),
  profileId: z.string().optional(),
  issue: z
    .object({
      code: z.string(),
      message: z.string(),
      retryAfterSeconds: z.number().optional(),
      timing: ProviderTiming.optional(),
    })
    .nullable(),
});
export type ProviderStatus = z.infer<typeof ProviderStatus>;
export function inferenceLabel(evidence: {
  provider?: Provider;
  profileId?: string;
}) {
  if (evidence.profileId === "openai") return "OpenAI";
  if (evidence.profileId === "openrouter") return "OpenRouter";
  return providerLabels[evidence.provider ?? "meta"];
}
