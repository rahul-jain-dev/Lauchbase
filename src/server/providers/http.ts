import "server-only";
import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";
import { ProviderError } from "./errors";
import { bounded, currentTiming, timeoutPolicy, traceProvider } from "./timing";

const reserved = new BlockList();
for (const [address, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 3],
] as const)
  reserved.addSubnet(address, prefix, "ipv4");
export function isPublicAddress(address: string): boolean {
  if (isIP(address) === 4) return !reserved.check(address, "ipv4");
  // Public IPv6 global unicast only; IPv4-mapped, loopback, local, multicast rejected.
  return (
    isIP(address) === 6 &&
    /^[23]/i.test(address) &&
    !/^2001:0?db8:/i.test(address)
  );
}
async function httpError(response: Response, signal: AbortSignal) {
  if (response.status === 401)
    return new ProviderError(
      "authentication_failed",
      "Provider authentication failed (HTTP 401). Replace the key for the selected provider; no retry or fallback was used.",
    );
  if (response.status === 402)
    return new ProviderError(
      "billing_quota",
      "The selected provider reports exhausted billing or credits (HTTP 402). No retry or fallback was used.",
    );
  const failure = (await bounded(response.json(), signal).catch((error) => {
    if (signal.aborted && ![400, 403, 404, 422].includes(response.status))
      throw error;
    return null;
  })) as {
    error?: { code?: string | number; status?: string; message?: string };
  } | null;
  const text =
    String(failure?.error?.code ?? failure?.error?.status ?? "") +
    " " +
    String(failure?.error?.message ?? "");
  if (
    /API_KEY_INVALID|INVALID_API_KEY|invalid_api_key|invalid authentication|api key not valid|invalid api key/i.test(
      text,
    )
  )
    return new ProviderError(
      "authentication_failed",
      `Provider authentication failed (HTTP ${response.status}). Replace the key for the selected provider; no fallback was used.`,
    );
  if (
    /insufficient_quota|billing|credit.*(?:exhaust|balance)|exceeded your current quota/i.test(
      text,
    )
  )
    return new ProviderError(
      "billing_quota",
      "The selected provider reports exhausted billing, credits or account quota. Check that account; no automatic retry or fallback was used.",
    );
  const retry = response.headers.get("retry-after");
  const seconds = retry
    ? /^\d+(?:\.\d+)?$/.test(retry)
      ? Number(retry)
      : Math.max(0, Math.ceil((Date.parse(retry) - Date.now()) / 1000))
    : undefined;
  const after =
    seconds !== undefined && Number.isFinite(seconds) ? seconds : undefined;
  if (response.status === 429)
    return new ProviderError(
      "rate_limited",
      "The selected provider rate-limited this request. Retry after its waiting period; no fallback was used.",
      after,
    );
  if ([400, 404, 422].includes(response.status))
    return new ProviderError(
      "incompatible_model",
      `The selected endpoint/model rejected the structured request (HTTP ${response.status}). Check model access and parameters. No automatic retry was used.`,
    );
  if (response.status === 403)
    return new ProviderError(
      "access_denied",
      "The selected provider denied access (HTTP 403). Check model permissions; no automatic retry or fallback was used.",
    );
  return new ProviderError(
    "provider_unavailable",
    `The selected provider failed (HTTP ${response.status}).`,
    after,
  );
}
export async function fetchProviderJSON(
  url: string,
  init: RequestInit,
  checkDNS: boolean,
): Promise<unknown> {
  const trace = currentTiming();
  if (!trace)
    return (
      await traceProvider(
        {
          provider: "unspecified",
          model: "unspecified",
          operation: "transport",
        },
        "generation",
        () => fetchProviderJSON(url, init, checkDNS),
      )
    ).value;
  const policy = timeoutPolicy(trace.kind);
  for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
    const remaining = trace.deadlineAt - Date.now();
    if (remaining <= 0)
      throw new ProviderError(
        "timeout",
        `The ${trace.kind} overall deadline was exhausted. No partial output was accepted.`,
      );
    const record: (typeof trace.timing.attempts)[number] = {
      attempt,
      phase: checkDNS ? "dns" : "request",
      dnsMs: 0,
      headersMs: 0,
      bodyMs: 0,
      elapsedMs: 0,
      httpStatus: null,
      classification: "pending",
    };
    trace.timing.attempts.push(record);
    const start = Date.now();
    let phaseStart = start;
    const signal = AbortSignal.timeout(
      Math.max(1, Math.min(policy.attempt, remaining)),
    );
    try {
      if (checkDNS) {
        const addresses = await bounded(
          lookup(new URL(url).hostname, { all: true }),
          signal,
        );
        record.dnsMs = Date.now() - phaseStart;
        if (
          !addresses.length ||
          addresses.some((x) => !isPublicAddress(x.address))
        )
          throw new ProviderError(
            "invalid_endpoint",
            "The endpoint must resolve only to public IP addresses. Local/private destinations are unsupported.",
          );
      }
      record.phase = "request";
      phaseStart = Date.now();
      const response = await bounded(
        fetch(url, { ...init, cache: "no-store", redirect: "error", signal }),
        signal,
      );
      record.headersMs = Date.now() - phaseStart;
      record.httpStatus = response.status;
      record.phase = "body";
      phaseStart = Date.now();
      if (!response.ok) throw await httpError(response, signal);
      const value = await bounded(response.json(), signal);
      record.bodyMs = Date.now() - phaseStart;
      record.phase = "complete";
      record.classification = "success";
      record.elapsedMs = Date.now() - start;
      return value;
    } catch (error) {
      if (record.phase === "dns") record.dnsMs = Date.now() - phaseStart;
      if (record.phase === "request")
        record.headersMs = Date.now() - phaseStart;
      if (record.phase === "body") record.bodyMs = Date.now() - phaseStart;
      record.elapsedMs = Date.now() - start;
      const name =
        error && typeof error === "object" && "name" in error
          ? String(error.name)
          : "";
      const cause =
        error && typeof error === "object" && "cause" in error
          ? (error.cause as { code?: string })
          : undefined;
      const networkCode =
        cause?.code ??
        (error && typeof error === "object" && "code" in error
          ? String(error.code)
          : "");
      const timeout =
        signal.aborted || ["AbortError", "TimeoutError"].includes(name);
      const issue =
        error instanceof ProviderError
          ? error
          : timeout
            ? new ProviderError(
                "timeout",
                `The selected provider ${trace.kind} request timed out within its bounded deadline. Retry or inspect request timings; this is not invalid model output.`,
              )
            : error instanceof SyntaxError
              ? new ProviderError(
                  "invalid_output",
                  "The provider returned malformed JSON. No result was accepted.",
                )
              : new ProviderError(
                  "connection_failed",
                  "Could not connect to the selected provider. Check DNS, TLS and network access; redirects are not allowed.",
                );
      record.classification = issue.code;
      const transient =
        issue.code === "timeout" ||
        issue.code === "rate_limited" ||
        (issue.code === "provider_unavailable" &&
          [408, 500, 502, 503, 504].includes(record.httpStatus ?? 0)) ||
        (issue.code === "connection_failed" &&
          [
            "ECONNRESET",
            "ETIMEDOUT",
            "EAI_AGAIN",
            "UND_ERR_CONNECT_TIMEOUT",
            "UND_ERR_SOCKET",
          ].includes(networkCode));
      const delay =
        issue.retryAfterSeconds === undefined
          ? 250 * attempt
          : Math.ceil(issue.retryAfterSeconds * 1000);
      if (
        !transient ||
        attempt >= policy.maxAttempts ||
        delay + 100 >= trace.deadlineAt - Date.now()
      )
        throw issue;
      record.retryDelayMs = delay;
      if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new ProviderError("timeout", "The provider deadline was exhausted.");
}
