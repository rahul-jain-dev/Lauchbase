import "server-only";
import type { ProfileId, ListedModel } from "../../lib/connections";
import type { ProviderConfig } from "../providers/config";
import { validateEndpoint } from "../providers/config";
import { ProviderError } from "../providers/errors";

export function profileConfig(
  profileId: ProfileId,
  apiKey: string,
  model = "",
): ProviderConfig {
  const endpoints = {
    meta: "https://api.meta.ai/v1",
    gemini: "https://generativelanguage.googleapis.com/v1beta",
    openai: "https://api.openai.com/v1",
    openrouter: "https://openrouter.ai/api/v1",
  };
  const endpoint =
    profileId === "approved-gateway"
      ? validateEndpoint(process.env.OPENAI_COMPATIBLE_BASE_URL ?? "")
      : endpoints[profileId];
  if (
    profileId === "approved-gateway" &&
    process.env.OPENAI_COMPATIBLE_STRUCTURED_OUTPUT !== "json_schema"
  )
    throw new ProviderError(
      "invalid_endpoint",
      "The administrator has not approved a strict JSON Schema gateway. Choose a named provider or ask the administrator to approve one.",
    );
  return {
    provider:
      profileId === "meta" || profileId === "gemini"
        ? profileId
        : "openai-compatible",
    apiKey,
    endpoint,
    model,
    profileId,
  };
}
export function modelRestriction(
  profileId: ProfileId,
  id: string,
  metadata?: { textOutput?: boolean | null; supportedActions?: string[] },
): string | null {
  if (metadata?.textOutput === false)
    return "Provider metadata reports no text output. LaunchBase needs structured text.";
  if (
    profileId === "gemini" &&
    metadata?.supportedActions?.length &&
    !metadata.supportedActions.includes("generateContent")
  )
    return "This model does not list generateContent support.";
  if (profileId === "meta" && /wonder/i.test(id))
    return "Muse Wonder requires an additional API adapter; use a Spark text model for this workflow.";
  if (
    /(?:^|[/-])(?:dall-e|gpt-image|tts|whisper|text-embedding|embedding|imagen|veo|lyria)|(?:^|[-/])(?:realtime|live|transcribe|tts)(?:[-/]|$)/i.test(
      id,
    )
  )
    return "This image, embedding, speech or realtime model family is outside the structured-text adapter.";
  if (
    profileId === "openrouter" &&
    /^(?:openrouter\/(?:auto|free)|~|.*:nitro$)/.test(id)
  )
    return "Automatic routing profiles are not supported. Select an explicit text model.";
  return null;
}
export function assertModel(
  profileId: ProfileId,
  id: string,
  models: ListedModel[],
  listing: string,
) {
  const entry = models.find((m) => m.id === id);
  if (listing === "listed" && !entry)
    throw new ProviderError(
      "unsupported_model",
      "Select a model from the fetched provider list, or refresh that list.",
    );
  const reason = modelRestriction(profileId, id, entry);
  if (reason || entry?.selectable === false)
    throw new ProviderError(
      "unsupported_model",
      reason ??
        entry!.reason ??
        "This model is not suitable for this workflow.",
    );
}
