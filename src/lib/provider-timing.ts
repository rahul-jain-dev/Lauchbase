import { z } from "zod";
export const ProviderTiming = z.object({
  provider: z.string(),
  model: z.string(),
  profileId: z.string().optional(),
  operation: z.string(),
  startedAt: z.string(),
  elapsedMs: z.number(),
  validationMs: z.number(),
  reportedModel: z.string().optional(),
  validationStage: z
    .enum(["wire_schema", "domain_schema", "semantic"])
    .optional(),
  validationIssues: z
    .array(z.object({ path: z.string(), code: z.string() }))
    .optional(),
  deadlineMs: z.number(),
  parameters: z
    .object({
      reasoning: z.enum(["provider_default", "disabled"]),
      maxOutputTokens: z.number(),
    })
    .optional(),
  generation: z
    .object({
      finishReason: z.enum(["stop", "length", "content_filter", "other"]),
      outputTokens: z.number().optional(),
      reasoningTokens: z.number().optional(),
    })
    .optional(),
  attempts: z.array(
    z.object({
      attempt: z.number(),
      phase: z.enum(["dns", "request", "body", "complete"]),
      dnsMs: z.number(),
      headersMs: z.number(),
      bodyMs: z.number(),
      elapsedMs: z.number(),
      httpStatus: z.number().nullable(),
      classification: z.string(),
      retryDelayMs: z.number().optional(),
    }),
  ),
  classification: z.string(),
});
export type ProviderTiming = z.infer<typeof ProviderTiming>;
export const MAX_GENERATION_DEADLINE_MS = 150000;
export const AI_CLIENT_TIMEOUT_MS = 170000;
