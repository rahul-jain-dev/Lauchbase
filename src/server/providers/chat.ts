import "server-only";
import { z } from "zod";
import { ProviderError } from "./errors";
import { fetchProviderJSON } from "./http";
import type { Adapter } from "./types";
import type { ProviderConfig } from "./config";
import { currentTiming } from "./timing";

function compatibleReasoning(config: ProviderConfig) {
  // This exact model supports optional reasoning in OpenRouter's public catalog.
  // Do not send NVIDIA's native chat-template knobs to a gateway or guess for other models.
  const disabled =
    config.profileId === "openrouter" &&
    [
      "nvidia/nemotron-3.5-super-vl",
      "nvidia/nemotron-3.5-super-vl:free",
    ].includes(config.model);
  const trace = currentTiming();
  if (trace)
    trace.timing.parameters = {
      reasoning: disabled ? "disabled" : "provider_default",
      maxOutputTokens: 4096,
    };
  return disabled ? { reasoning: { enabled: false } } : {};
}

export function parseChatResponse(raw: unknown) {
  const body = z
    .object({
      model: z.string().optional(),
      choices: z
        .array(
          z.object({
            finish_reason: z.string(),
            message: z.object({
              content: z.string().nullable().optional(),
              refusal: z.string().nullable().optional(),
            }),
          }),
        )
        .length(1),
    })
    .parse(raw);
  const choice = body.choices[0];
  const trace = currentTiming();
  if (trace) {
    const counts = z
      .object({
        usage: z
          .object({
            completion_tokens: z.number().int().nonnegative().optional(),
            completion_tokens_details: z
              .object({
                reasoning_tokens: z.number().int().nonnegative().optional(),
              })
              .optional(),
          })
          .optional(),
      })
      .safeParse(raw);
    trace.timing.generation = {
      finishReason: (["stop", "length", "content_filter"].includes(
        choice.finish_reason,
      )
        ? choice.finish_reason
        : "other") as "stop" | "length" | "content_filter" | "other",
      ...(counts.success
        ? {
            outputTokens: counts.data.usage?.completion_tokens,
            reasoningTokens:
              counts.data.usage?.completion_tokens_details?.reasoning_tokens,
          }
        : {}),
    };
  }
  if (choice.message.refusal || choice.finish_reason === "content_filter")
    throw new ProviderError(
      "refused",
      "The selected provider refused or filtered the request. Revise the idea or use manual input.",
    );
  if (choice.finish_reason === "length")
    throw new ProviderError(
      "truncated",
      "The selected model exhausted the output budget. No partial output was accepted. Use a shorter idea or review the adapter/model limits.",
    );
  if (choice.finish_reason !== "stop" || !choice.message.content)
    throw new ProviderError(
      "invalid_output",
      "The selected model did not return a complete structured text response.",
    );
  try {
    return {
      raw: JSON.parse(choice.message.content) as unknown,
      reportedModel: body.model,
    };
  } catch {
    throw new ProviderError(
      "invalid_output",
      "The selected model returned invalid JSON. Strict structured output is required; no result was accepted.",
    );
  }
}
export const metaAdapter: Adapter = async (config, request) =>
  parseChatResponse(
    await fetchProviderJSON(
      `${config.endpoint}/chat/completions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: config.model,
          max_completion_tokens: 4096,
          reasoning_effort: "minimal",
          messages: [
            { role: "developer", content: request.instruction },
            { role: "user", content: JSON.stringify(request.context) },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: request.name,
              strict: true,
              schema: request.schema,
            },
          },
        }),
      },
      false,
    ),
  );
export const compatibleAdapter: Adapter = async (config, request) =>
  parseChatResponse(
    await fetchProviderJSON(
      `${config.endpoint}/chat/completions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        // Baseline non-reasoning Chat Completions protocol. No Meta-specific knobs.
        body: JSON.stringify({
          model: config.model,
          ...(config.profileId === "openai"
            ? { max_completion_tokens: 4096 }
            : { max_tokens: 4096 }),
          ...(config.profileId === "openrouter"
            ? { provider: { allow_fallbacks: false, require_parameters: true } }
            : {}),
          ...compatibleReasoning(config),
          messages: [
            { role: "system", content: request.instruction },
            { role: "user", content: JSON.stringify(request.context) },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: request.name,
              strict: true,
              schema: request.schema,
            },
          },
        }),
      },
      true,
    ),
  );
