import type { ProviderConfig } from "./config";
export type StructuredRequest = {
  name: string;
  schema: Record<string, unknown>;
  instruction: string;
  context: unknown;
};
export type AdapterResult = { raw: unknown; reportedModel?: string };
export type Adapter = (
  config: ProviderConfig,
  request: StructuredRequest,
) => Promise<AdapterResult>;
