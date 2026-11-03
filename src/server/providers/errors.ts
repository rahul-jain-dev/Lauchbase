import type { ProviderTiming } from "../../lib/provider-timing";
export class ProviderError extends Error {
  timing?: ProviderTiming;
  constructor(
    public code: string,
    message: string,
    public retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}
export function safeProviderError(error: unknown) {
  if (error instanceof ProviderError)
    return {
      code: error.code,
      message: error.message,
      ...(error.timing ? { timing: error.timing } : {}),
      ...(error.retryAfterSeconds === undefined
        ? {}
        : { retryAfterSeconds: error.retryAfterSeconds }),
    };
  return {
    code: "invalid_output",
    message:
      "The selected provider returned an invalid result. No interpretation or recommendation was accepted. Retry or use manual input.",
  };
}
