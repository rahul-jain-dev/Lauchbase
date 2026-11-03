import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const dns = vi.hoisted(() => ({ lookup: vi.fn() }));
vi.mock("node:dns/promises", () => dns);
import { z } from "zod";
import {
  loadProviderConfig,
  providerStatus,
  validateEndpoint,
} from "../src/server/providers/config";
import { isPublicAddress } from "../src/server/providers/http";
import { safeProviderError } from "../src/server/providers/errors";
import { requestStructured } from "../src/server/providers";
import { analyzeIdea, rankFoundations } from "../src/server/ai";
import { emptyRequirements, ideaFields } from "../src/lib/idea-analysis";
import { InferenceEvidence } from "../src/lib/inference";
import { wireFixture } from "./fixtures/analysis";

// Transport fixtures only: no network calls, actual account access, or live validation.
const fetchFixture = vi.fn();
const schema = z.object({ ok: z.boolean() }).strict();
const chat = (raw: unknown, model = "reported-model") =>
  Response.json({
    model,
    choices: [
      { finish_reason: "stop", message: { content: JSON.stringify(raw) } },
    ],
  });
const gemini = (raw: unknown) =>
  Response.json({
    modelVersion: "gemini-3.8-flash-001",
    candidates: [
      {
        finishReason: "STOP",
        content: { parts: [{ text: JSON.stringify(raw) }] },
      },
    ],
  });
const env = (provider = "meta"): NodeJS.ProcessEnv => ({
  NODE_ENV: "test",
  AI_PROVIDER: provider,
  META_MODEL: "muse-spark-1.3",
  META_API_KEY: "fixture-meta-secret",
  GEMINI_MODEL: "gemini-3.8-flash",
  GEMINI_API_KEY: "fixture-gemini-secret",
  OPENAI_COMPATIBLE_MODEL: "custom-fixture",
  OPENAI_COMPATIBLE_API_KEY: "fixture-gateway-secret",
  OPENAI_COMPATIBLE_BASE_URL: "https://gateway.example.com/v1",
  OPENAI_COMPATIBLE_STRUCTURED_OUTPUT: "json_schema",
});
beforeEach(() => {
  vi.stubGlobal("fetch", fetchFixture);
  fetchFixture.mockReset();
  dns.lookup.mockReset();
  dns.lookup.mockResolvedValue([{ address: "8.8.8.8", family: 4 }]);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe("explicit provider configuration", () => {
  it("requires explicit selection and never borrows another provider's key", () => {
    expect(providerStatus({ ...env(), AI_PROVIDER: undefined }).ready).toBe(
      false,
    );
    expect(
      providerStatus({ ...env("gemini"), GEMINI_API_KEY: undefined }).issue
        ?.message,
    ).toContain("GEMINI_API_KEY");
    expect(fetchFixture).not.toHaveBeenCalled();
  });
  it("rejects unsupported native models and missing gateway schema declaration", () => {
    expect(
      providerStatus({ ...env(), META_MODEL: "muse-wonder-1.0" }).issue?.code,
    ).toBe("unsupported_model");
    expect(
      providerStatus({ ...env("gemini"), GEMINI_MODEL: "gemini-live-audio" })
        .issue?.code,
    ).toBe("unsupported_model");
    expect(
      providerStatus({
        ...env("openai-compatible"),
        OPENAI_COMPATIBLE_STRUCTURED_OUTPUT: "json_object",
      }).issue?.code,
    ).toBe("unsupported_model");
  });
  it.each([
    "http://gateway.example.com/v1",
    "https://user:secret@gateway.example.com/v1",
    "https://gateway.example.com/v1?key=secret",
    "https://gateway.example.com/v1#fragment",
    "https://localhost/v1",
    "https://127.0.0.1/v1",
    "https://[::1]/v1",
    "https://169.254.169.254/v1",
    "https://gateway.internal/v1",
    "https://gateway.example.com:8443/v1",
    "https://gateway.example.com/v1/chat/completions",
  ])("rejects unsafe or invalid endpoint: %s", (value) => {
    expect(() => validateEndpoint(value)).toThrow();
  });
  it("returns a secret-free status and validates DNS before sending gateway credentials", async () => {
    const config = loadProviderConfig(env("openai-compatible"));
    dns.lookup.mockResolvedValue([{ address: "10.1.2.3", family: 4 }]);
    await expect(
      requestStructured(schema, "Fixture", "test", {}, config),
    ).rejects.toThrow("public IP");
    expect(fetchFixture).not.toHaveBeenCalled();
    expect(JSON.stringify(providerStatus(env()))).not.toContain(
      "fixture-meta-secret",
    );
    for (const ip of [
      "127.0.0.1",
      "192.168.1.1",
      "169.254.169.254",
      "::1",
      "fc00::1",
      "::ffff:127.0.0.1",
    ])
      expect(isPublicAddress(ip)).toBe(false);
  });
});
describe("adapters share contracts with distinct request/response formats", () => {
  it("rejects connection credentials copied into prompts or echoed by provider output", async () => {
    const config = loadProviderConfig(env());
    await expect(
      requestStructured(
        schema,
        "Fixture",
        "shared",
        { idea: config.apiKey },
        config,
      ),
    ).rejects.toThrow("No model request was sent");
    expect(fetchFixture).not.toHaveBeenCalled();
    fetchFixture.mockResolvedValue(chat({ text: config.apiKey }));
    await expect(
      requestStructured(
        z.object({ text: z.string() }).strict(),
        "Fixture",
        "shared",
        {},
        config,
      ),
    ).rejects.toThrow("credential material");
  });
  it.each(["meta", "gemini", "openai-compatible"])(
    "validates and attributes %s without exposing configuration in prompts",
    async (provider) => {
      const config = loadProviderConfig(env(provider));
      fetchFixture.mockResolvedValue(
        provider === "gemini" ? gemini({ ok: true }) : chat({ ok: true }),
      );
      const result = await requestStructured(
        schema,
        "Fixture",
        "Shared instruction",
        { idea: "fixture" },
        config,
      );
      expect(result.raw).toEqual({ ok: true });
      expect(result.meta.provider).toBe(provider);
      expect(result.meta.requestedModel).toBe(config.model);
      expect(result.meta.model).toBe(
        provider === "gemini" ? "gemini-3.8-flash-001" : "reported-model",
      );
      const [url, options] = fetchFixture.mock.calls[0];
      expect(options.redirect).toBe("error");
      expect(options.body).not.toContain(config.apiKey);
      expect(options.body).not.toContain("gateway.example.com");
      const body = JSON.parse(options.body);
      if (provider === "gemini") {
        expect(url).toContain(":generateContent");
        expect(options.headers["x-goog-api-key"]).toBe(config.apiKey);
        expect(body.generationConfig.responseMimeType).toBe("application/json");
        expect(
          body.generationConfig.responseJsonSchema.properties.ok.type,
        ).toBe("boolean");
        expect(body.reasoning_effort).toBeUndefined();
      } else {
        expect(body.response_format.json_schema.strict).toBe(true);
        expect(body.reasoning_effort).toBe(
          provider === "meta" ? "minimal" : undefined,
        );
        expect(body.messages[0].role).toBe(
          provider === "meta" ? "developer" : "system",
        );
      }
    },
  );
  it.each(["meta", "gemini", "openai-compatible"])(
    "rejects invalid app output for %s",
    async (provider) => {
      fetchFixture.mockResolvedValue(
        provider === "gemini"
          ? gemini({ invented: true })
          : chat({ invented: true }),
      );
      await expect(
        requestStructured(
          schema,
          "Fixture",
          "shared",
          {},
          loadProviderConfig(env(provider)),
        ),
      ).rejects.toThrow("application schema");
    },
  );
  it("keeps old attribution after configuration changes and never labels gateway Meta as direct Meta", async () => {
    fetchFixture.mockResolvedValue(chat({ ok: true }, "muse-spark-1.3"));
    const first = await requestStructured(
      schema,
      "Fixture",
      "shared",
      {},
      loadProviderConfig(env("openai-compatible")),
    );
    fetchFixture.mockResolvedValue(gemini({ ok: true }));
    const second = await requestStructured(
      schema,
      "Fixture",
      "shared",
      {},
      loadProviderConfig(env("gemini")),
    );
    expect(first.meta.provider).toBe("openai-compatible");
    expect(second.meta.provider).toBe("gemini");
    expect(
      InferenceEvidence.parse({
        model: "old-spark",
        calledAt: "2026-10-31T10:00:00Z",
      }).provider,
    ).toBe("meta");
  });
});
describe("provider failures do not trigger fallback", () => {
  it.each([400, 401, 403, 404, 422, 429, 503])(
    "handles HTTP %i safely",
    async (status) => {
      fetchFixture.mockResolvedValue(
        new Response("secret upstream body", {
          status,
          headers: { "retry-after": "120" },
        }),
      );
      try {
        await requestStructured(
          schema,
          "Fixture",
          "shared",
          {},
          loadProviderConfig(env()),
        );
        throw new Error("Expected failure");
      } catch (error) {
        const issue = safeProviderError(error);
        expect(issue.message).not.toContain("secret upstream body");
        if (status === 429) {
          expect(issue.code).toBe("rate_limited");
          expect(issue.retryAfterSeconds).toBe(120);
        }
      }
      expect(fetchFixture).toHaveBeenCalledTimes(1);
    },
  );
  it.each([
    {
      choices: [
        {
          finish_reason: "stop",
          message: { refusal: "refused", content: null },
        },
      ],
    },
    { choices: [{ finish_reason: "length", message: { content: "{}" } }] },
    {
      choices: [
        { finish_reason: "stop", message: { content: "```json {} ```" } },
      ],
    },
  ])("rejects chat refusal, truncation or invalid JSON", async (body) => {
    fetchFixture.mockResolvedValue(Response.json(body));
    await expect(
      requestStructured(
        schema,
        "Fixture",
        "shared",
        {},
        loadProviderConfig(env()),
      ),
    ).rejects.toThrow();
  });
  it.each([
    { promptFeedback: { blockReason: "SAFETY" } },
    { candidates: [{ finishReason: "MAX_TOKENS" }] },
    { candidates: [{ finishReason: "SAFETY" }] },
    {
      candidates: [
        {
          finishReason: "STOP",
          content: { parts: [{ text: "{}", thought: true }] },
        },
      ],
    },
  ])("rejects Gemini refusal, truncation or missing output", async (body) => {
    fetchFixture.mockResolvedValue(Response.json(body));
    await expect(
      requestStructured(
        schema,
        "Fixture",
        "shared",
        {},
        loadProviderConfig(env("gemini")),
      ),
    ).rejects.toThrow();
  });
  it("handles timeouts and connection failures without raw error details", async () => {
    fetchFixture.mockRejectedValue(
      new DOMException("secret timeout detail", "TimeoutError"),
    );
    await expect(
      requestStructured(
        schema,
        "Fixture",
        "shared",
        {},
        loadProviderConfig(env()),
      ),
    ).rejects.toThrow("timed out");
    expect(safeProviderError(new Error("secret")).message).not.toContain(
      "secret",
    );
  });
});
describe("shared product semantics across all adapters", () => {
  it.each(["meta", "gemini", "openai-compatible"])(
    "retains excerpts, rejects unsupported and invented selections for %s",
    async (provider) => {
      const settings = env(provider);
      for (const [key, value] of Object.entries(settings))
        vi.stubEnv(key, value!);
      const idea = "A client portal for ticket booking";
      const proposals = ideaFields.map((field) => ({
        field,
        value: "unknown",
        kind: "unknown",
        essential: false,
        excerpt: null,
      }));
      fetchFixture.mockResolvedValueOnce(
        provider === "gemini"
          ? gemini(wireFixture(proposals))
          : chat(wireFixture(proposals)),
      );
      expect(
        (await analyzeIdea({ ...emptyRequirements, idea })).analysis.proposals,
      ).toEqual(proposals);
      const input = {
        ...emptyRequirements,
        idea,
        accountModel: "individual" as const,
        billing: "no" as const,
        uploads: "no" as const,
        background: "no" as const,
      };
      fetchFixture.mockResolvedValueOnce(
        provider === "gemini"
          ? gemini({
              rankings: [
                { foundationId: "invented", reasonCodes: ["account_fit"] },
              ],
            })
          : chat({
              rankings: [
                { foundationId: "invented", reasonCodes: ["account_fit"] },
              ],
            }),
      );
      await expect(rankFoundations(input)).rejects.toThrow(
        "eligible selections",
      );
      const validRanking = {
        rankings: [
          { foundationId: "individual", reasonCodes: ["account_fit"] },
        ],
      };
      fetchFixture.mockResolvedValueOnce(
        provider === "gemini" ? gemini(validRanking) : chat(validRanking),
      );
      const accepted = await rankFoundations(input);
      expect(accepted.rankings[0].foundationId).toBe("individual");
      expect(accepted.meta.provider).toBe(provider);
      const before = fetchFixture.mock.calls.length;
      await expect(
        rankFoundations({ ...input, billing: "required" }),
      ).rejects.toThrow("blocked");
      expect(fetchFixture.mock.calls.length).toBe(before);
    },
  );
});
