import "server-only";
import { z } from "zod";
import { ProviderError } from "./errors";
import { fetchProviderJSON } from "./http";
import type { Adapter } from "./types";

export function parseGeminiResponse(raw: unknown) {
  const body = z
    .object({
      modelVersion: z.string().optional(),
      promptFeedback: z
        .object({ blockReason: z.string().optional() })
        .optional(),
      candidates: z
        .array(
          z.object({
            finishReason: z.string(),
            content: z
              .object({
                parts: z.array(
                  z.object({
                    text: z.string().optional(),
                    thought: z.boolean().optional(),
                  }),
                ),
              })
              .optional(),
          }),
        )
        .optional(),
    })
    .parse(raw);
  if (
    body.promptFeedback?.blockReason &&
    body.promptFeedback.blockReason !== "BLOCK_REASON_UNSPECIFIED"
  )
    throw new ProviderError(
      "refused",
      "Gemini blocked this prompt. Revise it or use manual input.",
    );
  const candidate = body.candidates?.[0];
  if (!candidate || body.candidates?.length !== 1)
    throw new ProviderError(
      "invalid_output",
      "Gemini did not return exactly one structured candidate.",
    );
  if (["MAX_TOKENS", "CONTINUATION"].includes(candidate.finishReason))
    throw new ProviderError(
      "truncated",
      "Gemini exhausted the output budget. No partial result was accepted. Shorten the idea or review model limits.",
    );
  if (
    [
      "SAFETY",
      "RECITATION",
      "BLOCKLIST",
      "PROHIBITED_CONTENT",
      "SPII",
      "IMAGE_SAFETY",
    ].includes(candidate.finishReason)
  )
    throw new ProviderError(
      "refused",
      "Gemini refused or filtered the response. Revise the idea or use manual input.",
    );
  if (candidate.finishReason !== "STOP")
    throw new ProviderError(
      "invalid_output",
      "Gemini did not complete the structured response.",
    );
  const content = candidate.content?.parts
    .filter((p) => !p.thought)
    .map((p) => p.text ?? "")
    .join("");
  if (!content)
    throw new ProviderError(
      "invalid_output",
      "Gemini returned no structured text.",
    );
  try {
    return {
      raw: JSON.parse(content) as unknown,
      reportedModel: body.modelVersion,
    };
  } catch {
    throw new ProviderError(
      "invalid_output",
      "Gemini returned invalid JSON. No result was accepted.",
    );
  }
}
export const geminiAdapter: Adapter = async (config, request) =>
  parseGeminiResponse(
    await fetchProviderJSON(
      `${config.endpoint}/models/${encodeURIComponent(config.model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "x-goog-api-key": config.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: request.instruction }] },
          contents: [
            {
              role: "user",
              parts: [{ text: JSON.stringify(request.context) }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseJsonSchema: request.schema,
            maxOutputTokens: 8192,
            candidateCount: 1,
            // Reviewed native generateContent support; do not guess for other models.
            ...(config.model === "gemini-3.8-flash"
              ? { thinkingConfig: { thinkingLevel: "LOW" } }
              : {}),
          },
        }),
      },
      false,
    ),
  );
