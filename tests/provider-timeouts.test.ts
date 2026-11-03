import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const dns = vi.hoisted(() => ({ lookup: vi.fn() }));
vi.mock("node:dns/promises", () => dns);
import { z } from "zod";
import { requestStructured } from "../src/server/providers";
import { ProviderError } from "../src/server/providers/errors";
import { traceProvider, timeoutPolicy } from "../src/server/providers/timing";
import { discoverModels } from "../src/server/connections/discovery";
import { AI_CLIENT_TIMEOUT_MS } from "../src/lib/provider-timing";

// Synthetic fixtures, not live latency or provider evidence.
const network = vi.fn();
const config = {
  provider: "gemini" as const,
  model: "gemini-3.8-flash",
  apiKey: "fixture-timeout-key",
  endpoint: "https://generativelanguage.googleapis.com/v1beta",
  profileId: "gemini",
};
const success = () =>
  Response.json({
    modelVersion: "gemini-3.8-flash-001",
    candidates: [
      { finishReason: "STOP", content: { parts: [{ text: '{"ok":true}' }] } },
    ],
  });
const run = () =>
  requestStructured(
    z.object({ ok: z.boolean() }),
    "FixtureCheck",
    "Return ok",
    {},
    config,
  );
beforeEach(() => {
  network.mockReset();
  vi.stubGlobal("fetch", network);
  dns.lookup.mockResolvedValue([{ address: "8.8.8.8", family: 4 }]);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe("bounded timeout and retry policy fixtures", () => {
  it("records schema failure paths without echoing values or unknown property names", async () => {
    network.mockResolvedValue(
      Response.json({
        candidates: [
          {
            finishReason: "STOP",
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    ok: "private-value",
                    "private-property": true,
                  }),
                },
              ],
            },
          },
        ],
      }),
    );
    const error = await run().catch((error) => error);
    expect(error.code).toBe("invalid_output");
    expect(error.timing.validationIssues).toEqual([
      expect.objectContaining({ path: "ok", code: "invalid_type" }),
    ]);
    expect(JSON.stringify(error.timing)).not.toContain("private-value");
    expect(JSON.stringify(error.timing)).not.toContain("private-property");
  });
  it("uses the documented disable control only for the reviewed OpenRouter Nemotron IDs", async () => {
    for (const model of [
      "nvidia/nemotron-3.5-super-vl",
      "nvidia/nemotron-3.5-super-vl:free",
    ]) {
      network.mockResolvedValueOnce(
        Response.json({
          choices: [
            { finish_reason: "stop", message: { content: '{"ok":true}' } },
          ],
          usage: {
            completion_tokens: 18,
            completion_tokens_details: { reasoning_tokens: 0 },
          },
        }),
      );
      const result = await requestStructured(
        z.object({ ok: z.boolean() }),
        "Fixture",
        "Return ok",
        {},
        {
          ...config,
          provider: "openai-compatible",
          profileId: "openrouter",
          model,
          endpoint: "https://openrouter.ai/api/v1",
        },
      );
      const body = JSON.parse(network.mock.calls.at(-1)![1].body);
      expect(body.reasoning).toEqual({ enabled: false });
      expect(body.max_tokens).toBe(4096);
      expect(body.provider).toEqual({
        allow_fallbacks: false,
        require_parameters: true,
      });
      expect(body.chat_template_kwargs).toBeUndefined();
      expect(result.meta.timing?.generation).toEqual({
        finishReason: "stop",
        outputTokens: 18,
        reasoningTokens: 0,
      });
    }
  });
  it("does not guess reasoning support for other gateways, models or native Gemini versions", async () => {
    for (const [profileId, model] of [
      ["approved-gateway", "nvidia/nemotron-3.5-super-vl:free"],
      ["openrouter", "another/model"],
    ]) {
      network.mockResolvedValueOnce(
        Response.json({
          choices: [
            { finish_reason: "stop", message: { content: '{"ok":true}' } },
          ],
        }),
      );
      await requestStructured(
        z.object({ ok: z.boolean() }),
        "Fixture",
        "Return ok",
        {},
        { ...config, provider: "openai-compatible", profileId, model },
      );
      expect(
        JSON.parse(network.mock.calls.at(-1)![1].body).reasoning,
      ).toBeUndefined();
    }
    network.mockResolvedValueOnce(success());
    await requestStructured(
      z.object({ ok: z.boolean() }),
      "Fixture",
      "Return ok",
      {},
      { ...config, model: "gemini-2.5-flash" },
    );
    expect(
      JSON.parse(network.mock.calls.at(-1)![1].body).generationConfig
        .thinkingConfig,
    ).toBeUndefined();
  });
  it("does not wait for or retry a hanging invalid-credentials error body", async () => {
    network.mockResolvedValue({
      ok: false,
      status: 401,
      json: () => new Promise(() => {}),
    });
    await expect(run()).rejects.toMatchObject({
      code: "authentication_failed",
    });
    expect(network).toHaveBeenCalledTimes(1);
  });
  it("stops after two transient failures and retries a known connection reset safely", async () => {
    network.mockImplementation(() =>
      Promise.resolve(
        new Response("fixture", {
          status: 503,
          headers: { "retry-after": "0" },
        }),
      ),
    );
    await expect(run()).rejects.toMatchObject({
      code: "provider_unavailable",
      timing: { attempts: expect.any(Array) },
    });
    expect(network).toHaveBeenCalledTimes(2);
    network.mockReset();
    network
      .mockRejectedValueOnce(
        Object.assign(new Error("private network details"), {
          cause: { code: "ECONNRESET" },
        }),
      )
      .mockResolvedValueOnce(success());
    const result = await run();
    expect(result.meta.timing?.attempts[0].classification).toBe(
      "connection_failed",
    );
    expect(result.meta.timing?.attempts[1].httpStatus).toBe(200);
    expect(JSON.stringify(result.meta)).not.toContain(
      "private network details",
    );
  });
  it("separates discovery and generation with a longer client and bounded overall deadline", () => {
    expect(timeoutPolicy("generation")).toEqual({
      attempt: 90000,
      overall: 120000,
      maxAttempts: 2,
    });
    expect(timeoutPolicy("discovery")).toEqual({
      attempt: 10000,
      overall: 30000,
      maxAttempts: 2,
    });
    expect(AI_CLIENT_TIMEOUT_MS).toBeGreaterThan(150000);
    vi.stubEnv("AI_GENERATION_DEADLINE_MS", "150001");
    expect(() => timeoutPolicy("generation")).toThrow("150000");
  });
  it.each([401, 402, 400, 403, 404, 422])(
    "does not retry non-transient HTTP %i",
    async (status) => {
      network.mockResolvedValue(new Response("fixture error body", { status }));
      await expect(run()).rejects.toBeInstanceOf(ProviderError);
      expect(network).toHaveBeenCalledTimes(1);
    },
  );
  it("does not retry exhausted billing reported as 429", async () => {
    network.mockResolvedValue(
      Response.json({ error: { code: "insufficient_quota" } }, { status: 429 }),
    );
    await expect(run()).rejects.toMatchObject({ code: "billing_quota" });
    expect(network).toHaveBeenCalledTimes(1);
  });
  it.each([429, 503])(
    "respects Retry-After and records a bounded successful retry for %i",
    async (status) => {
      network
        .mockResolvedValueOnce(
          new Response("fixture", {
            status,
            headers: { "retry-after": "0.01" },
          }),
        )
        .mockResolvedValueOnce(success());
      const result = await run();
      expect(result.meta.timing?.attempts.map((x) => x.httpStatus)).toEqual([
        status,
        200,
      ]);
      expect(result.meta.timing?.attempts[0].retryDelayMs).toBe(10);
      expect(result.meta.timing?.elapsedMs).toBeGreaterThanOrEqual(10);
      expect(result.meta.timing?.classification).toBe("success");
      expect(JSON.stringify(result.meta)).not.toContain(config.apiKey);
      expect(result.meta.timing?.model).toBe(config.model);
      const body = JSON.parse(network.mock.calls[0][1].body);
      expect(body.generationConfig.thinkingConfig).toEqual({
        thinkingLevel: "LOW",
      });
    },
  );
  it("does not shorten a Retry-After that exceeds the remaining deadline", async () => {
    vi.stubEnv("AI_GENERATION_DEADLINE_MS", "500");
    network.mockResolvedValue(
      new Response("fixture", {
        status: 429,
        headers: { "retry-after": "120" },
      }),
    );
    await expect(run()).rejects.toMatchObject({
      code: "rate_limited",
      retryAfterSeconds: 120,
    });
    expect(network).toHaveBeenCalledTimes(1);
  });
  it("honors HTTP-date Retry-After", async () => {
    network.mockResolvedValue(
      new Response("fixture", {
        status: 503,
        headers: { "retry-after": new Date(Date.now() + 300000).toUTCString() },
      }),
    );
    await expect(run()).rejects.toMatchObject({ code: "provider_unavailable" });
    expect(network).toHaveBeenCalledTimes(1);
  });
  it("bounds hanging generation, classifies timeout independently from invalid output", async () => {
    vi.stubEnv("AI_GENERATION_TIMEOUT_MS", "100");
    vi.stubEnv("AI_GENERATION_DEADLINE_MS", "500");
    network.mockImplementation(() => new Promise(() => {}));
    const start = Date.now();
    await expect(run()).rejects.toMatchObject({
      code: "timeout",
      timing: {
        classification: "timeout",
        attempts: expect.arrayContaining([
          expect.objectContaining({ phase: "request", httpStatus: null }),
        ]),
      },
    });
    expect(Date.now() - start).toBeLessThan(900);
    expect(network.mock.calls.length).toBeLessThanOrEqual(2);
  });
  it("bounds body reading and records HTTP 200 even when the body stalls", async () => {
    vi.stubEnv("AI_GENERATION_DEADLINE_MS", "100");
    network.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => new Promise(() => {}),
    });
    await expect(run()).rejects.toMatchObject({
      code: "timeout",
      timing: {
        attempts: [expect.objectContaining({ phase: "body", httpStatus: 200 })],
      },
    });
  });
  it("shares the discovery deadline across pagination instead of using the generation timeout", async () => {
    vi.stubEnv("AI_DISCOVERY_DEADLINE_MS", "100");
    network
      .mockResolvedValueOnce(
        Response.json({ models: [], nextPageToken: "next" }),
      )
      .mockImplementation(() => new Promise(() => {}));
    await expect(discoverModels("gemini", config)).rejects.toMatchObject({
      code: "timeout",
      timing: { deadlineMs: 100, operation: "ModelDiscovery" },
    });
    expect(network).toHaveBeenCalledTimes(2);
  });
  it("bounds gateway DNS checks and does not guess lower reasoning for unknown models", async () => {
    vi.stubEnv("AI_GENERATION_DEADLINE_MS", "100");
    dns.lookup.mockImplementationOnce(() => new Promise(() => {}));
    await expect(
      requestStructured(
        z.object({ ok: z.boolean() }),
        "Fixture",
        "Return ok",
        {},
        {
          ...config,
          provider: "openai-compatible",
          endpoint: "https://gateway.example.com/v1",
        },
      ),
    ).rejects.toMatchObject({
      code: "timeout",
      timing: { attempts: [expect.objectContaining({ phase: "dns" })] },
    });
    expect(network).not.toHaveBeenCalled();
  });
  it("does not retry malformed model output and keeps its transport evidence", async () => {
    network.mockResolvedValue(
      Response.json({
        candidates: [
          { finishReason: "STOP", content: { parts: [{ text: "bad json" }] } },
        ],
      }),
    );
    await expect(run()).rejects.toMatchObject({
      code: "invalid_output",
      timing: {
        classification: "invalid_output",
        attempts: [expect.objectContaining({ httpStatus: 200 })],
      },
    });
    expect(network).toHaveBeenCalledTimes(1);
  });
  it("isolates concurrent request timing contexts", async () => {
    const [a, b] = await Promise.all([
      traceProvider(
        { provider: "gemini", model: "a", operation: "a" },
        "generation",
        async () => true,
      ),
      traceProvider(
        { provider: "meta", model: "b", operation: "b" },
        "generation",
        async () => true,
      ),
    ]);
    expect(a.timing.model).toBe("a");
    expect(b.timing.model).toBe("b");
  });
});
