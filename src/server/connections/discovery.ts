import "server-only";
import { z } from "zod";
import type { ListedModel, ProfileId } from "../../lib/connections";
import { fetchProviderJSON } from "../providers/http";
import type { ProviderConfig } from "../providers/config";
import { ProviderError } from "../providers/errors";
import { modelRestriction } from "./profiles";
import { traceProvider } from "../providers/timing";

const RawModel = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  displayName: z.string().optional(),
  supportedGenerationMethods: z.array(z.string()).optional(),
  inputTokenLimit: z.number().optional(),
  outputTokenLimit: z.number().optional(),
  supported_parameters: z.array(z.string()).optional(),
  architecture: z
    .object({ output_modalities: z.array(z.string()).optional() })
    .optional(),
});
export function normalizeModel(
  raw: unknown,
  profileId: ProfileId,
  key: string,
): ListedModel {
  const m = RawModel.parse(raw);
  const rawId = m.id ?? m.name ?? "";
  const id = profileId === "gemini" ? rawId.replace(/^models\//, "") : rawId;
  if (!/^[a-zA-Z0-9~][a-zA-Z0-9._:/~-]{0,149}$/.test(id) || id.includes(key))
    throw new ProviderError(
      "invalid_output",
      "The provider returned an invalid model identifier.",
    );
  const name = (m.displayName ?? m.name ?? id).slice(0, 160);
  if (name.includes(key))
    throw new ProviderError(
      "invalid_output",
      "The provider returned unsafe model metadata.",
    );
  const textOutput = m.architecture?.output_modalities
    ? m.architecture.output_modalities.includes("text")
    : null;
  const supportedActions = m.supportedGenerationMethods ?? [];
  if (supportedActions.some((action) => action.includes(key)))
    throw new ProviderError(
      "invalid_output",
      "The provider returned unsafe capability metadata.",
    );
  const reason = modelRestriction(profileId, id, {
    textOutput,
    supportedActions,
  });
  return {
    id,
    name,
    textOutput,
    structuredOutput: m.supported_parameters
      ? m.supported_parameters.includes("structured_outputs")
        ? true
        : null
      : null,
    supportedActions,
    inputTokenLimit: m.inputTokenLimit ?? null,
    outputTokenLimit: m.outputTokenLimit ?? null,
    selectable: !reason,
    reason,
  };
}
export async function discoverModels(
  profileId: ProfileId,
  config: ProviderConfig,
) {
  return (
    await traceProvider(
      {
        provider: config.provider,
        model: config.model,
        profileId,
        operation: "ModelDiscovery",
      },
      "discovery",
      () => discoverWithinDeadline(profileId, config),
    )
  ).value;
}
async function discoverWithinDeadline(
  profileId: ProfileId,
  config: ProviderConfig,
) {
  if (profileId === "approved-gateway")
    return {
      models: [] as ListedModel[],
      authentication: "unknown" as const,
      listing: "manual" as const,
    };
  const headers: Record<string, string> =
    profileId === "gemini"
      ? { "x-goog-api-key": config.apiKey }
      : { Authorization: `Bearer ${config.apiKey}` };
  // OpenRouter /models is a public catalog. Only /key verifies authentication.
  if (profileId === "openrouter")
    await fetchProviderJSON(`${config.endpoint}/key`, { headers }, true);
  const models: ListedModel[] = [];
  let token: string | undefined;
  const seen = new Set<string>();
  for (let page = 0; page < 20; page++) {
    const url = new URL(`${config.endpoint}/models`);
    if (profileId === "gemini") {
      url.searchParams.set("pageSize", "1000");
      if (token) url.searchParams.set("pageToken", token);
    } else if (token) url.searchParams.set("after", token);
    const body = z
      .object({
        models: z.array(z.unknown()).optional(),
        data: z.array(z.unknown()).optional(),
        nextPageToken: z.string().optional(),
        has_more: z.boolean().optional(),
        last_id: z.string().optional(),
      })
      .parse(
        await fetchProviderJSON(
          url.href,
          { headers },
          config.provider === "openai-compatible",
        ),
      );
    const rows = profileId === "gemini" ? body.models : body.data;
    if (!rows)
      throw new ProviderError(
        "invalid_output",
        "Provider returned an invalid model list; no capabilities were inferred.",
      );
    for (const raw of rows)
      models.push(normalizeModel(raw, profileId, config.apiKey));
    if (models.length > 10000)
      throw new ProviderError(
        "invalid_output",
        "The model catalog exceeded the local prototype size limit. No partial list was accepted.",
      );
    if (body.has_more && !body.last_id && profileId !== "gemini")
      throw new ProviderError(
        "invalid_output",
        "Provider model pagination omitted its continuation cursor.",
      );
    token =
      profileId === "gemini"
        ? body.nextPageToken
        : body.has_more
          ? body.last_id
          : undefined;
    if (!token)
      return {
        models: [...new Map(models.map((m) => [m.id, m])).values()],
        authentication: "verified" as const,
        listing: "listed" as const,
      };
    if (seen.has(token))
      throw new ProviderError(
        "invalid_output",
        "Provider repeated a model-list pagination cursor. Refresh later.",
      );
    seen.add(token);
  }
  throw new ProviderError(
    "provider_unavailable",
    "The model list exceeded the 20-page safety bound. Refresh later; the partial list was not accepted.",
  );
}
