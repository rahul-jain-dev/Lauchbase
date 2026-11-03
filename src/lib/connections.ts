import { z } from "zod";
import { InferenceEvidence } from "./inference";
import { ProviderTiming } from "./provider-timing";
import { CONNECTION_TEST_VERSION } from "./ai-contract-version";
export const ConnectionIssue = z.object({
  code: z.string(),
  message: z.string(),
  retryAfterSeconds: z.number().optional(),
  timing: ProviderTiming.optional(),
});
export const OperationCheck = z.object({
  state: z.enum(["planned", "passed", "failed"]),
  meta: InferenceEvidence.nullable(),
  issue: ConnectionIssue.nullable(),
});
export const ConnectionChecks = z.object({
  contractVersion: z.string(),
  analysis: OperationCheck,
  ranking: OperationCheck,
});
export type ConnectionChecks = z.infer<typeof ConnectionChecks>;
export function freshChecks(): ConnectionChecks {
  return {
    contractVersion: CONNECTION_TEST_VERSION,
    analysis: { state: "planned", meta: null, issue: null },
    ranking: { state: "planned", meta: null, issue: null },
  };
}
export function checksPassed(checks: ConnectionChecks | null | undefined) {
  return (
    checks?.contractVersion === CONNECTION_TEST_VERSION &&
    checks.analysis.state === "passed" &&
    checks.ranking.state === "passed"
  );
}

export const ProfileId = z.enum([
  "meta",
  "gemini",
  "openai",
  "openrouter",
  "approved-gateway",
]);
export type ProfileId = z.infer<typeof ProfileId>;
export const connectionProfiles = [
  { id: "meta", name: "Meta", description: "Direct Meta Model API" },
  { id: "gemini", name: "Gemini", description: "Native Google Gemini API" },
  {
    id: "openai",
    name: "OpenAI",
    description: "OpenAI Chat Completions with JSON Schema",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    description: "An explicitly selected model through OpenRouter",
  },
  {
    id: "approved-gateway",
    name: "Approved gateway",
    description:
      "Only an endpoint approved in server settings; manual model ID",
  },
] as const;
export function recognizeKey(key: string): ProfileId | null {
  if (key.startsWith("sk-or-v1-")) return "openrouter";
  if (key.startsWith("AIza")) return "gemini";
  if (key.startsWith("sk-proj-") || key.startsWith("sk-svcacct-"))
    return "openai";
  return null; // Generic sk- and opaque keys are ambiguous. Never probe providers.
}
export const ListedModel = z.object({
  id: z.string(),
  name: z.string(),
  textOutput: z.boolean().nullable(),
  structuredOutput: z.boolean().nullable(),
  supportedActions: z.array(z.string()),
  inputTokenLimit: z.number().nullable(),
  outputTokenLimit: z.number().nullable(),
  selectable: z.boolean(),
  reason: z.string().nullable(),
});
export type ListedModel = z.infer<typeof ListedModel>;
export const ConnectionView = z.object({
  profileId: ProfileId.nullable(),
  keyConfigured: z.boolean(),
  expiresAt: z.string().nullable(),
  authentication: z.enum(["unknown", "verified", "failed"]),
  models: z.array(ListedModel),
  listing: z.enum(["not_loaded", "listed", "failed", "manual"]),
  listedAt: z.string().nullable(),
  selectedModel: z.string().nullable(),
  active: z.boolean(),
  test: InferenceEvidence.nullable(),
  checks: ConnectionChecks.nullable().default(null),
  issue: z
    .object({
      code: z.string(),
      message: z.string(),
      retryAfterSeconds: z.number().optional(),
      timing: ProviderTiming.optional(),
    })
    .nullable(),
});
export type ConnectionView = z.infer<typeof ConnectionView>;
export const ConnectionAction = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("connect"),
      profileId: ProfileId,
      apiKey: z
        .string()
        .trim()
        .min(8)
        .max(4096)
        .regex(/^[\x21-\x7E]+$/),
    })
    .strict(),
  z
    .object({
      action: z.literal("select"),
      model: z
        .string()
        .trim()
        .regex(/^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,149}$/),
    })
    .strict(),
  z.object({ action: z.literal("refresh") }).strict(),
  z
    .object({
      action: z.literal("test"),
      operation: z.enum(["analysis", "ranking"]),
    })
    .strict(),
  z.object({ action: z.literal("activate") }).strict(),
  z.object({ action: z.literal("disconnect") }).strict(),
]);
