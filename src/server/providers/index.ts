import "server-only";
import { z } from "zod";
import { loadProviderConfig, type ProviderConfig } from "./config";
import { metaAdapter, compatibleAdapter } from "./chat";
import { geminiAdapter } from "./gemini";
import { wireSchema } from "./schema";
import { InferenceEvidence } from "../../lib/inference";
import { ProviderError } from "./errors";
import { traceProvider, currentTiming } from "./timing";

export async function requestStructured<T>(
  schema: z.ZodType<T>,
  name: string,
  instruction: string,
  context: unknown,
  config: ProviderConfig = loadProviderConfig(),
) {
  const traced = await traceProvider(
    {
      provider: config.provider,
      model: config.model,
      profileId: config.profileId,
      operation: name,
    },
    "generation",
    async () => {
      const serializedContext = JSON.stringify(context);
      if (serializedContext?.includes(config.apiKey))
        throw new ProviderError(
          "invalid_input",
          "Remove connection credentials from the idea or input. No model request was sent.",
        );
      const adapter = {
        meta: metaAdapter,
        gemini: geminiAdapter,
        "openai-compatible": compatibleAdapter,
      }[config.provider];
      // Config contains credentials/endpoint; only application context enters prompts.
      const response = await adapter(config, {
        name,
        instruction,
        context,
        schema: wireSchema(z.toJSONSchema(schema, { target: "draft-7" })),
      });
      const validationStart = Date.now();
      if (
        response.reportedModel &&
        /^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,149}$/.test(response.reportedModel) &&
        !response.reportedModel.includes(config.apiKey)
      )
        currentTiming()!.timing.reportedModel = response.reportedModel;
      const parsed = schema.safeParse(response.raw);
      currentTiming()!.timing.validationMs += Date.now() - validationStart;
      if (!parsed.success) {
        currentTiming()!.timing.validationStage = "wire_schema";
        const allowedPaths = new Set([
          "proposals",
          "field",
          "value",
          "kind",
          "essential",
          "excerpt",
          "rankings",
          "foundationId",
          "reasonCodes",
          "ok",
          "accountModel",
          "billing",
          "uploads",
          "background",
          "language",
          "framework",
          "hosting",
          "additionalRequirements",
          "category",
          "dependencies",
        ]);
        currentTiming()!.timing.validationIssues = parsed.error.issues
          .slice(0, 20)
          .map((issue) => ({
            code: issue.code,
            path: issue.path
              .map((part) =>
                typeof part === "number"
                  ? part
                  : allowedPaths.has(String(part))
                    ? part
                    : "[field]",
              )
              .join("."),
          }));
        throw new ProviderError(
          "invalid_output",
          "The selected provider returned data outside the application schema. No result was accepted.",
        );
      }
      if (JSON.stringify(parsed.data).includes(config.apiKey))
        throw new ProviderError(
          "invalid_output",
          "Provider output contained credential material and was rejected.",
        );
      const reported = response.reportedModel;
      const model =
        reported &&
        /^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,149}$/.test(reported) &&
        !reported.includes(config.apiKey)
          ? reported
          : config.model;
      return {
        raw: parsed.data,
        meta: InferenceEvidence.parse({
          provider: config.provider,
          profileId: config.profileId,
          model,
          requestedModel: config.model,
          calledAt: new Date().toISOString(),
        }),
      };
    },
  );
  return {
    ...traced.value,
    meta: { ...traced.value.meta, timing: traced.timing },
  };
}
