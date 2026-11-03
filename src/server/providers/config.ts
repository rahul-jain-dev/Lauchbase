import "server-only";
import { isIP } from "node:net";
import {
  Provider,
  providerLabels,
  type ProviderStatus,
} from "../../lib/inference";
import { ProviderError, safeProviderError } from "./errors";

export type ProviderConfig = {
  provider: Provider;
  model: string;
  apiKey: string;
  endpoint: string;
  profileId?: string;
};
export const supportedModels = {
  meta: ["muse-spark-1.3"],
  gemini: ["gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-2.5-flash"],
};
export function hasCredential(value: string | undefined) {
  return Boolean(
    value?.trim() && !/replace_|your[_-]|<|placeholder/i.test(value),
  );
}
export function validateEndpoint(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ProviderError(
      "configuration_required",
      "Set OPENAI_COMPATIBLE_BASE_URL to an absolute HTTPS API base URL, for example https://gateway.example.com/v1.",
    );
  }
  const host = url.hostname.toLowerCase();
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (url.port && url.port !== "443") ||
    isIP(host.replace(/^\[|\]$/g, "")) ||
    !/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(host) ||
    /(^|\.)(localhost|local|internal|test|invalid)$/.test(host) ||
    host === "metadata.google.internal"
  ) {
    throw new ProviderError(
      "invalid_endpoint",
      "The configured endpoint must use HTTPS on port 443 with a public DNS hostname and no credentials, query or fragment. Local hosts and IP literals are unsupported.",
    );
  }
  if (
    !/^\/[a-zA-Z0-9_./-]*$/.test(url.pathname) ||
    /\/(chat\/completions|responses)\/?$/.test(url.pathname)
  )
    throw new ProviderError(
      "invalid_endpoint",
      "Set the API base URL (such as /v1), not a complete completion or responses path.",
    );
  return url.href.replace(/\/$/, "");
}
export function loadProviderConfig(
  env: NodeJS.ProcessEnv = process.env,
): ProviderConfig {
  const selected = Provider.safeParse(env.AI_PROVIDER);
  if (!selected.success)
    throw new ProviderError(
      "configuration_required",
      "Set AI_PROVIDER explicitly to meta, gemini, or openai-compatible in .env.local. No fallback provider is used.",
    );
  const provider = selected.data;
  const prefix =
    provider === "openai-compatible"
      ? "OPENAI_COMPATIBLE"
      : provider.toUpperCase();
  const model = env[`${prefix}_MODEL`]?.trim();
  if (!model || !/^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,149}$/.test(model))
    throw new ProviderError(
      "configuration_required",
      `Set ${prefix}_MODEL to a valid model identifier for ${providerLabels[provider]}.`,
    );
  if (
    provider !== "openai-compatible" &&
    !supportedModels[provider].includes(model)
  )
    throw new ProviderError(
      "unsupported_model",
      `${providerLabels[provider]} model is unsupported by this adapter. Choose ${supportedModels[provider].join(", ")}; other models require a reviewed adapter extension.`,
    );
  const endpoint =
    provider === "meta"
      ? "https://api.meta.ai/v1"
      : provider === "gemini"
        ? "https://generativelanguage.googleapis.com/v1beta"
        : validateEndpoint(env.OPENAI_COMPATIBLE_BASE_URL ?? "");
  if (
    provider === "openai-compatible" &&
    env.OPENAI_COMPATIBLE_STRUCTURED_OUTPUT !== "json_schema"
  )
    throw new ProviderError(
      "unsupported_model",
      "Confirm OPENAI_COMPATIBLE_STRUCTURED_OUTPUT=json_schema only for an endpoint/model supporting strict JSON Schema Chat Completions. JSON-only mode and native Responses/Messages APIs are not supported.",
    );
  const apiKey = env[`${prefix}_API_KEY`]?.trim();
  if (!hasCredential(apiKey))
    throw new ProviderError(
      "configuration_required",
      `Set ${prefix}_API_KEY in the ignored .env.local file for ${providerLabels[provider]}, then restart the server. Other providers will not be used.`,
    );
  return { provider, model, apiKey: apiKey!, endpoint };
}
export function providerStatus(
  env: NodeJS.ProcessEnv = process.env,
): ProviderStatus {
  try {
    const config = loadProviderConfig(env);
    return {
      provider: config.provider,
      model: config.model,
      ready: true,
      issue: null,
    };
  } catch (error) {
    const provider = Provider.safeParse(env.AI_PROVIDER);
    const name = provider.success ? provider.data : null;
    const model = name
      ? env[
          `${name === "openai-compatible" ? "OPENAI_COMPATIBLE" : name.toUpperCase()}_MODEL`
        ]
      : undefined;
    return {
      provider: name,
      model:
        model && /^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,149}$/.test(model)
          ? model
          : null,
      ready: false,
      issue: safeProviderError(error),
    };
  }
}
