import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";
import {
  MAX_GENERATION_DEADLINE_MS,
  type ProviderTiming,
} from "../../lib/provider-timing";
import { ProviderError } from "./errors";

export type RequestKind = "generation" | "discovery";
function milliseconds(name: string, fallback: number, max: number) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 100 || value > max)
    throw new ProviderError(
      "configuration_required",
      `${name} must be an integer between 100 and ${max} milliseconds.`,
    );
  return value;
}
export function timeoutPolicy(kind: RequestKind) {
  const overall =
    kind === "generation"
      ? milliseconds(
          "AI_GENERATION_DEADLINE_MS",
          120000,
          MAX_GENERATION_DEADLINE_MS,
        )
      : milliseconds("AI_DISCOVERY_DEADLINE_MS", 30000, 60000);
  return {
    overall,
    attempt: Math.min(
      overall,
      kind === "generation"
        ? milliseconds(
            "AI_GENERATION_TIMEOUT_MS",
            90000,
            MAX_GENERATION_DEADLINE_MS,
          )
        : milliseconds("AI_DISCOVERY_TIMEOUT_MS", 10000, 60000),
    ),
    maxAttempts: 2,
  };
}
type Context = {
  timing: ProviderTiming;
  deadlineAt: number;
  kind: RequestKind;
};
const context = new AsyncLocalStorage<Context>();
export const currentTiming = () => context.getStore();
export async function traceProvider<T>(
  info: {
    provider: string;
    model: string;
    profileId?: string;
    operation: string;
  },
  kind: RequestKind,
  fn: () => Promise<T>,
) {
  const policy = timeoutPolicy(kind);
  const start = Date.now();
  const timing: ProviderTiming = {
    ...info,
    startedAt: new Date().toISOString(),
    elapsedMs: 0,
    validationMs: 0,
    deadlineMs: policy.overall,
    attempts: [],
    classification: "success",
  };
  try {
    const value = await context.run(
      { timing, deadlineAt: start + policy.overall, kind },
      fn,
    );
    timing.elapsedMs = Date.now() - start;
    return { value, timing };
  } catch (error) {
    timing.elapsedMs = Date.now() - start;
    const safe =
      error instanceof ProviderError
        ? error
        : new ProviderError(
            "invalid_output",
            "The provider result failed application validation. No result was accepted.",
          );
    timing.classification = safe.code;
    safe.timing = timing;
    throw safe;
  }
}
export function bounded<T>(
  promise: Promise<T>,
  signal: AbortSignal,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const abort = () =>
      reject(new DOMException("Provider deadline exceeded", "TimeoutError"));
    promise.then(
      (value) => {
        signal.removeEventListener("abort", abort);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener("abort", abort);
        reject(error);
      },
    );
    if (signal.aborted) {
      abort();
      return;
    }
    signal.addEventListener("abort", abort, { once: true });
  });
}
