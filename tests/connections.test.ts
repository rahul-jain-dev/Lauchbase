import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const evidenceFile = vi.hoisted(() => ({ mkdir: vi.fn(), writeFile: vi.fn() }));
vi.mock("node:fs/promises", () => evidenceFile);
const dns = vi.hoisted(() => ({ lookup: vi.fn() }));
vi.mock("node:dns/promises", () => dns);
import { GET, POST } from "../src/app/api/connections/route";
import { POST as analyze } from "../src/app/api/analyze/route";
import { POST as recommend } from "../src/app/api/recommend/route";
import { POST as diagnostics } from "../src/app/api/provider-diagnostics/route";
import {
  cleanupSessions,
  SESSION_TTL,
  COOKIE_NAME,
  getSession,
} from "../src/server/connections/store";
import { resolveConnection } from "../src/server/connections/service";
import { normalizeModel } from "../src/server/connections/discovery";
import { recognizeKey } from "../src/lib/connections";
import { emptyRequirements } from "../src/lib/idea-analysis";
import { unknownWireFixture, individualWireFixture } from "./fixtures/analysis";
import { CONNECTION_TEST_VERSION } from "../src/lib/ai-contract-version";

// All provider responses below are synthetic transport fixtures. No live provider calls.
const network = vi.fn();
const key = "AIza-settings-fixture-key-never-real";
const model = "gemini-3.8-flash";
function req(
  body?: unknown,
  cookie = "",
  path = "connections",
  origin = "http://localhost:3000",
) {
  return new Request(`http://localhost:3000/api/${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
const models = () =>
  Response.json({
    models: [
      {
        name: `models/${model}`,
        displayName: "Gemini fixture",
        supportedGenerationMethods: ["generateContent"],
      },
      {
        name: "models/gemini-3.5-flash-lite",
        displayName: "Another text fixture",
        supportedGenerationMethods: ["generateContent"],
      },
      {
        name: "models/imagen-fixture",
        displayName: "Image fixture",
        supportedGenerationMethods: ["predict"],
      },
    ],
  });
const gemini = (raw: unknown) =>
  Response.json({
    modelVersion: model,
    candidates: [
      {
        finishReason: "STOP",
        content: { parts: [{ text: JSON.stringify(raw) }] },
      },
    ],
  });
const ranking = () =>
  gemini({
    rankings: [{ foundationId: "individual", reasonCodes: ["account_fit"] }],
  });
async function connect(profileId = "gemini", apiKey = key, cookie = "") {
  const response = await POST(
    req({ action: "connect", profileId, apiKey }, cookie),
  );
  const token = response.headers.get("set-cookie")?.split(";")[0] ?? cookie;
  return { response, cookie: token, view: await response.json() };
}
async function selected() {
  network.mockResolvedValueOnce(models());
  const c = await connect();
  await POST(req({ action: "select", model }, c.cookie));
  return c;
}
beforeEach(() => {
  evidenceFile.writeFile.mockReset();
  network.mockReset();
  vi.stubGlobal("fetch", network);
  dns.lookup.mockResolvedValue([{ address: "8.8.8.8", family: 4 }]);
});
it("sets a Secure session cookie for the configured HTTPS public origin behind HTTP", async () => {
  vi.stubEnv("APP_ORIGIN", "https://demo.example.com");
  network.mockResolvedValueOnce(models());
  const response = await POST(
    new Request("http://0.0.0.0:10000/api/connections", {
      method: "POST",
      headers: {
        Origin: "https://demo.example.com",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "connect",
        profileId: "gemini",
        apiKey: key,
      }),
    }),
  );
  expect(response.status).toBe(200);
  expect(response.headers.get("set-cookie")).toContain("Secure");
  expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  expect(response.headers.get("set-cookie")).toContain("SameSite=strict");
  expect(JSON.stringify(await response.json())).not.toContain(key);
});

describe("session-authenticated timing comparison fixtures", () => {
  it("traces both minimal and full analysis through the active selection without recording secrets or ideas", async () => {
    const c = await selected();
    network.mockResolvedValueOnce(gemini(individualWireFixture()));
    await POST(req({ action: "test", operation: "analysis" }, c.cookie));
    network.mockResolvedValueOnce(ranking());
    await POST(req({ action: "test", operation: "ranking" }, c.cookie));
    await POST(req({ action: "activate" }, c.cookie));
    const requirements = {
      ...emptyRequirements,
      idea: "A client portal for ticket booking",
    };
    for (const operation of ["minimal", "analysis"]) {
      network.mockResolvedValueOnce(
        gemini(operation === "minimal" ? { ok: true } : unknownWireFixture()),
      );
      const response = await diagnostics(
        req({ operation, requirements }, c.cookie, "provider-diagnostics"),
      );
      const report = await response.json();
      expect(report.success).toBe(true);
      expect(report.source).toBe("settings_session");
      expect(report.model).toBe(model);
      expect(report.profileId).toBe("gemini");
      expect(report.timing.attempts[0].httpStatus).toBe(200);
      expect(network.mock.calls.at(-1)![1].headers["x-goog-api-key"]).toBe(key);
      expect(
        JSON.parse(network.mock.calls.at(-1)![1].body).generationConfig
          .thinkingConfig.thinkingLevel,
      ).toBe("LOW");
      const recorded = evidenceFile.writeFile.mock.calls.at(-1)![1];
      expect(recorded).not.toContain(key);
      expect(recorded).not.toContain(requirements.idea);
      expect(recorded).not.toContain(c.cookie);
    }
    // Writes are mocked: these fixture reports never enter the live evidence directory.
    expect(evidenceFile.writeFile).toHaveBeenCalledTimes(4);
  });
  it("rejects cross-origin diagnostics and sessions with no activated connection", async () => {
    const input = {
      operation: "minimal",
      requirements: { ...emptyRequirements, idea: "A personal contact book" },
    };
    expect(
      (
        await diagnostics(
          req(input, "", "provider-diagnostics", "https://other.example"),
        )
      ).status,
    ).toBe(403);
    expect(
      (await diagnostics(req(input, "", "provider-diagnostics"))).status,
    ).toBe(409);
    expect(network).not.toHaveBeenCalled();
    expect(evidenceFile.writeFile).not.toHaveBeenCalled();
  });
});
afterEach(() => {
  cleanupSessions(Date.now() + SESSION_TTL + 1);
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("session connections lifecycle", () => {
  it("retains a failed analysis check alongside a passed ranking and refuses activation", async () => {
    const c = await selected();
    network.mockResolvedValueOnce(
      gemini({
        ...individualWireFixture(),
        accountModel: {
          value: "individual",
          kind: "explicitly_stated",
          essential: false,
          excerpt: "invented source evidence",
        },
      }),
    );
    const failed = await (
      await POST(req({ action: "test", operation: "analysis" }, c.cookie))
    ).json();
    expect(failed.authentication).toBe("verified");
    expect(failed.listing).toBe("listed");
    expect(failed.checks.analysis.state).toBe("failed");
    expect(failed.checks.analysis.issue.timing).toMatchObject({
      validationStage: "semantic",
      validationIssues: [
        { path: "proposals.0.excerpt", code: "invalid_excerpt" },
      ],
    });
    network.mockResolvedValueOnce(ranking());
    const ranked = await (
      await POST(req({ action: "test", operation: "ranking" }, c.cookie))
    ).json();
    expect(ranked.checks.ranking.state).toBe("passed");
    expect(ranked.checks.analysis.state).toBe("failed");
    expect(ranked.test).toBeNull();
    expect(ranked.active).toBe(false);
    expect((await POST(req({ action: "activate" }, c.cookie))).status).toBe(
      400,
    );
    expect(resolveConnection(req(undefined, c.cookie)).config).toBeUndefined();
  });
  it("invalidates both checks after contract changes and rejects old operation-less test requests", async () => {
    const c = await selected();
    network.mockResolvedValueOnce(gemini(individualWireFixture()));
    await POST(req({ action: "test", operation: "analysis" }, c.cookie));
    network.mockResolvedValueOnce(ranking());
    await POST(req({ action: "test", operation: "ranking" }, c.cookie));
    await POST(req({ action: "activate" }, c.cookie));
    const session = getSession(req(undefined, c.cookie))!;
    session.connection!.checks!.contractVersion = "old-ranking-only-contract";
    const invalidated = await (await GET(req(undefined, c.cookie))).json();
    expect(invalidated.active).toBe(false);
    expect(invalidated.test).toBeNull();
    expect(invalidated.checks.contractVersion).toBe(CONNECTION_TEST_VERSION);
    expect(invalidated.checks.analysis.state).toBe("planned");
    expect(invalidated.checks.ranking.state).toBe("planned");
    expect((await POST(req({ action: "activate" }, c.cookie))).status).toBe(
      400,
    );
    expect((await POST(req({ action: "test" }, c.cookie))).status).toBe(400);
  });
  it("does not count structurally valid all-unknown analysis as a passing representative extraction", async () => {
    const c = await selected();
    network.mockResolvedValueOnce(gemini(unknownWireFixture()));
    const checked = await (
      await POST(req({ action: "test", operation: "analysis" }, c.cookie))
    ).json();
    expect(checked.checks.analysis.state).toBe("failed");
    expect(
      checked.checks.analysis.issue.timing.validationIssues,
    ).toContainEqual({
      path: "accountModel",
      code: "representative_value_mismatch",
    });
    expect(checked.checks.ranking.state).toBe("planned");
    expect(checked.test).toBeNull();
  });
  it("stores no secret in responses, issues an opaque HttpOnly cookie, and requires test then explicit activation", async () => {
    const c = await selected();
    expect(c.response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(c.response.headers.get("set-cookie")).toContain("SameSite=strict");
    expect(c.cookie).toMatch(new RegExp(`^${COOKIE_NAME}=[a-zA-Z0-9_-]{43}$`));
    expect(JSON.stringify(c.view)).not.toContain(key);
    expect(c.view.authentication).toBe("verified");
    expect(c.view.test).toBeNull();
    expect(resolveConnection(req(undefined, c.cookie)).status.ready).toBe(
      false,
    );
    expect((await POST(req({ action: "activate" }, c.cookie))).status).toBe(
      400,
    );
    network.mockResolvedValueOnce(gemini(individualWireFixture()));
    await POST(req({ action: "test", operation: "analysis" }, c.cookie));
    network.mockResolvedValueOnce(ranking());
    const tested = await (
      await POST(req({ action: "test", operation: "ranking" }, c.cookie))
    ).json();
    expect(tested.test.provider).toBe("gemini");
    expect(tested.active).toBe(false);
    const active = await (
      await POST(req({ action: "activate" }, c.cookie))
    ).json();
    expect(active.active).toBe(true);
    expect(resolveConnection(req(undefined, c.cookie)).config?.apiKey).toBe(
      key,
    );
    expect(JSON.stringify(active)).not.toContain(key);
    expect(network.mock.calls.at(-1)![1].body).not.toContain(key);
  });
  it("isolates sessions and does not fall back to environment credentials after disconnect or missing/expired cookies", async () => {
    vi.stubEnv("AI_PROVIDER", "meta");
    vi.stubEnv("META_API_KEY", "fixture-configured-environment-key");
    vi.stubEnv("META_MODEL", "muse-spark-1.3");
    const c = await selected();
    network.mockResolvedValueOnce(gemini(individualWireFixture()));
    await POST(req({ action: "test", operation: "analysis" }, c.cookie));
    network.mockResolvedValueOnce(ranking());
    await POST(req({ action: "test", operation: "ranking" }, c.cookie));
    await POST(req({ action: "activate" }, c.cookie));
    network.mockResolvedValueOnce(models());
    const other = await connect("gemini", "AIza-other-fixture-key-never-real");
    expect(other.cookie).not.toBe(c.cookie);
    expect(
      (await (await GET(req(undefined, other.cookie))).json()).active,
    ).toBe(false);
    expect(resolveConnection(req()).status.ready).toBe(false);
    expect(
      (await (await POST(req({ action: "disconnect" }, c.cookie))).json())
        .keyConfigured,
    ).toBe(false);
    expect(resolveConnection(req(undefined, c.cookie)).config).toBeUndefined();
    expect(
      (await (await GET(req(undefined, other.cookie))).json()).keyConfigured,
    ).toBe(true);
    cleanupSessions(Date.now() + SESSION_TTL + 1);
    expect(
      (await (await GET(req(undefined, other.cookie))).json()).keyConfigured,
    ).toBe(false);
    expect(
      resolveConnection(req(undefined, other.cookie)).config,
    ).toBeUndefined();
  });
  it("invalidates compatibility and activation when the model or key changes", async () => {
    const c = await selected();
    network.mockResolvedValueOnce(gemini(individualWireFixture()));
    await POST(req({ action: "test", operation: "analysis" }, c.cookie));
    network.mockResolvedValueOnce(ranking());
    await POST(req({ action: "test", operation: "ranking" }, c.cookie));
    await POST(req({ action: "activate" }, c.cookie));
    const changed = await (
      await POST(
        req({ action: "select", model: "gemini-3.5-flash-lite" }, c.cookie),
      )
    ).json();
    expect(changed.test).toBeNull();
    expect(changed.active).toBe(false);
    network.mockResolvedValueOnce(models());
    const replaced = await connect(
      "gemini",
      "AIza-replacement-fixture-key",
      c.cookie,
    );
    expect(replaced.cookie).not.toBe(c.cookie);
    expect(replaced.view.test).toBeNull();
    expect(resolveConnection(req(undefined, c.cookie)).config).toBeUndefined();
  });
  it("uses the activated session key for both idea analysis and recommendations, without changing attribution", async () => {
    const c = await selected();
    network.mockResolvedValueOnce(gemini(individualWireFixture()));
    await POST(req({ action: "test", operation: "analysis" }, c.cookie));
    network.mockResolvedValueOnce(ranking());
    await POST(req({ action: "test", operation: "ranking" }, c.cookie));
    await POST(req({ action: "activate" }, c.cookie));
    const input = {
      ...emptyRequirements,
      idea: "A client portal for ticket booking",
    };
    network.mockResolvedValueOnce(gemini(unknownWireFixture()));
    const understood = await (
      await analyze(req(input, c.cookie, "analyze"))
    ).json();
    expect(understood.state).toBe("analyzed");
    expect(understood.meta.profileId).toBe("gemini");
    network.mockResolvedValueOnce(ranking());
    const ranked = await (
      await recommend(
        req(
          {
            ...input,
            accountModel: "individual",
            billing: "no",
            uploads: "no",
            background: "no",
          },
          c.cookie,
          "recommend",
        ),
      )
    ).json();
    expect(ranked.state).toBe("recommended");
    expect(ranked.meta.provider).toBe("gemini");
    expect(network.mock.calls.at(-1)![1].headers["x-goog-api-key"]).toBe(key);
    expect(JSON.stringify(ranked)).not.toContain(key);
    await POST(req({ action: "disconnect" }, c.cookie));
    expect(understood.meta.provider).toBe("gemini");
  });
  it("rejects a test finishing after disconnect and cannot revive an expired connection", async () => {
    const c = await selected();
    let finish!: (value: Response) => void;
    network.mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        }),
    );
    const pending = POST(
      req({ action: "test", operation: "ranking" }, c.cookie),
    );
    await vi.waitFor(() => expect(finish).toBeDefined());
    await POST(req({ action: "disconnect" }, c.cookie));
    finish(ranking());
    expect((await pending).status).toBe(400);
    expect(getSession(req(undefined, c.cookie))?.active).toBe(false);
  });
});
describe("model discovery, recognition and restrictions", () => {
  it("treats key recognition only as a hint, including ambiguous generic keys", () => {
    expect(recognizeKey(key)).toBe("gemini");
    expect(recognizeKey("sk-or-v1-fixture")).toBe("openrouter");
    expect(recognizeKey("sk-proj-fixture")).toBe("openai");
    expect(recognizeKey("sk-ambiguous")).toBeNull();
    expect(recognizeKey("opaque-meta-key")).toBeNull();
    expect(network).not.toHaveBeenCalled();
  });
  it("follows Gemini pagination, preserves absent metadata as unknown and disables known unsuitable models", async () => {
    network
      .mockResolvedValueOnce(
        Response.json({
          models: [
            {
              name: `models/${model}`,
              supportedGenerationMethods: ["generateContent"],
            },
          ],
          nextPageToken: "page-two",
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          models: [
            {
              name: "models/imagen-fixture",
              supportedGenerationMethods: ["predict"],
            },
          ],
        }),
      );
    const c = await connect();
    expect(c.view.models).toHaveLength(2);
    expect(network.mock.calls[1][0]).toContain("pageToken=page-two");
    expect(c.view.models[0].textOutput).toBeNull();
    expect(c.view.models[0].structuredOutput).toBeNull();
    expect(c.view.models[1].selectable).toBe(false);
    expect(
      (await POST(req({ action: "select", model: "imagen-fixture" }, c.cookie)))
        .status,
    ).toBe(400);
  });
  it("verifies OpenRouter's private key endpoint before public catalog access; a failed key cannot pass via a public list", async () => {
    network.mockResolvedValueOnce(
      new Response("unauthorized", { status: 401 }),
    );
    const c = await connect("openrouter", "sk-or-v1-fixture-never-real");
    expect(network.mock.calls).toHaveLength(1);
    expect(network.mock.calls[0][0]).toBe("https://openrouter.ai/api/v1/key");
    expect(c.view.authentication).toBe("failed");
    expect(c.view.test).toBeNull();
    network
      .mockResolvedValueOnce(Response.json({ data: {} }))
      .mockResolvedValueOnce(
        Response.json({
          data: [
            {
              id: "openai/text-fixture",
              name: "Text fixture",
              architecture: { output_modalities: ["text"] },
              supported_parameters: ["response_format"],
            },
            {
              id: "image-fixture",
              architecture: { output_modalities: ["image"] },
            },
          ],
        }),
      );
    const verified = await connect("openrouter", "sk-or-v1-second-fixture");
    expect(verified.view.authentication).toBe("verified");
    expect(verified.view.test).toBeNull();
    expect(verified.view.models[0].textOutput).toBe(true);
    expect(verified.view.models[1].selectable).toBe(false);
  });
  it("fetches OpenAI and Meta models with bearer authentication and uses named profiles", async () => {
    network.mockResolvedValueOnce(
      Response.json({ data: [{ id: "gpt-text-fixture" }] }),
    );
    const c = await connect("openai", "sk-proj-fixture-never-real");
    expect(network.mock.calls[0][0]).toBe("https://api.openai.com/v1/models");
    expect(c.view.models[0].structuredOutput).toBeNull();
    await POST(req({ action: "select", model: "gpt-text-fixture" }, c.cookie));
    network.mockResolvedValueOnce(
      Response.json({
        model: "gpt-text-fixture",
        choices: [
          {
            finish_reason: "stop",
            message: {
              content: JSON.stringify({
                rankings: [
                  { foundationId: "individual", reasonCodes: ["account_fit"] },
                ],
              }),
            },
          },
        ],
      }),
    );
    const tested = await (
      await POST(req({ action: "test", operation: "ranking" }, c.cookie))
    ).json();
    expect(tested.checks.ranking.meta.profileId).toBe("openai");
    expect(tested.test).toBeNull();
    expect((await POST(req({ action: "activate" }, c.cookie))).status).toBe(
      400,
    );
    expect(
      JSON.parse(network.mock.calls.at(-1)![1].body).max_completion_tokens,
    ).toBe(4096);
    network.mockResolvedValueOnce(
      Response.json({
        data: [{ id: "muse-spark-1.3" }, { id: "muse-wonder-1.0" }],
      }),
    );
    const meta = await connect("meta", "opaque-meta-fixture");
    expect(network.mock.calls.at(-1)![0]).toBe("https://api.meta.ai/v1/models");
    expect(meta.view.models[1].selectable).toBe(false);
  });
  it("offers manual IDs only when listing is unavailable; approved gateways never accept client destinations", async () => {
    vi.stubEnv("OPENAI_COMPATIBLE_BASE_URL", "https://gateway.example.com/v1");
    vi.stubEnv("OPENAI_COMPATIBLE_STRUCTURED_OUTPUT", "json_schema");
    const c = await connect("approved-gateway", "gateway-fixture-key");
    expect(network).not.toHaveBeenCalled();
    expect(c.view.listing).toBe("manual");
    expect(c.view.authentication).toBe("unknown");
    expect(
      (
        await POST(
          req({ action: "select", model: "custom-text-model" }, c.cookie),
        )
      ).status,
    ).toBe(200);
    expect((await POST(req({ action: "activate" }, c.cookie))).status).toBe(
      400,
    );
    expect(
      (
        await POST(
          req({
            action: "connect",
            profileId: "approved-gateway",
            apiKey: "fixture-key",
            endpoint: "https://attacker.example.com",
          }),
        )
      ).status,
    ).toBe(400);
    expect(() =>
      normalizeModel({ id: "safe-model", name: key }, "gemini", key),
    ).toThrow();
  });
});
describe("settings guards and compatibility failures", () => {
  it("invalidates approval when an administrator changes the gateway destination", async () => {
    vi.stubEnv("OPENAI_COMPATIBLE_BASE_URL", "https://gateway.example.com/v1");
    vi.stubEnv("OPENAI_COMPATIBLE_STRUCTURED_OUTPUT", "json_schema");
    const c = await connect("approved-gateway", "gateway-profile-fixture-key");
    await POST(req({ action: "select", model: "text-fixture" }, c.cookie));
    const session = getSession(req(undefined, c.cookie))!;
    session.connection!.test = {
      provider: "openai-compatible",
      model: "text-fixture",
      requestedModel: "text-fixture",
      calledAt: new Date().toISOString(),
    };
    session.active = true;
    vi.stubEnv(
      "OPENAI_COMPATIBLE_BASE_URL",
      "https://different.example.com/v1",
    );
    expect(resolveConnection(req(undefined, c.cookie)).status.ready).toBe(
      false,
    );
    expect(
      (await (await GET(req(undefined, c.cookie))).json()).test,
    ).toBeNull();
    expect(
      (await POST(req({ action: "test", operation: "ranking" }, c.cookie)))
        .status,
    ).toBe(400);
    expect(network).not.toHaveBeenCalled();
  });
  it("rejects missing/foreign origins, invalid JSON and form posts without sending the key", async () => {
    const body = { action: "connect", profileId: "gemini", apiKey: key };
    expect(
      (await POST(req(body, "", "connections", "https://foreign.example")))
        .status,
    ).toBe(403);
    const missing = req(body);
    missing.headers.delete("Origin");
    expect((await POST(missing)).status).toBe(403);
    const form = req(body);
    form.headers.set("Content-Type", "application/x-www-form-urlencoded");
    expect((await POST(form)).status).toBe(415);
    expect(network).not.toHaveBeenCalled();
  });
  it.each([
    [401, null, "authentication_failed"],
    [
      400,
      {
        error: {
          code: 400,
          message: "API key not valid. Please pass a valid API key.",
        },
      },
      "authentication_failed",
    ],
    [402, null, "billing_quota"],
    [
      429,
      { error: { code: "insufficient_quota", message: "private details" } },
      "billing_quota",
    ],
    [429, null, "rate_limited"],
    [503, null, "provider_unavailable"],
    [400, null, "incompatible_model"],
  ])(
    "retains separate error categories for compatibility HTTP %s",
    async (status, body, expected) => {
      const c = await selected();
      network.mockImplementation(() =>
        Promise.resolve(
          new Response(body ? JSON.stringify(body) : "private details", {
            status: status as number,
          }),
        ),
      );
      const failed = await (
        await POST(req({ action: "test", operation: "ranking" }, c.cookie))
      ).json();
      expect(failed.issue.code).toBe(expected);
      expect(failed.test).toBeNull();
      expect(failed.active).toBe(false);
      expect(JSON.stringify(failed)).not.toContain("private details");
      expect(JSON.stringify(failed)).not.toContain(key);
    },
  );
  it("rejects invalid structured output, truncation and timeouts without making a connection ready", async () => {
    const c = await selected();
    for (const response of [
      gemini({ invented: true }),
      Response.json({ candidates: [{ finishReason: "MAX_TOKENS" }] }),
    ]) {
      network.mockResolvedValueOnce(response);
      const failed = await (
        await POST(req({ action: "test", operation: "ranking" }, c.cookie))
      ).json();
      expect(failed.test).toBeNull();
      expect(failed.active).toBe(false);
    }
    network.mockRejectedValue(
      new DOMException("private detail", "TimeoutError"),
    );
    const timed = await (
      await POST(req({ action: "test", operation: "ranking" }, c.cookie))
    ).json();
    expect(timed.issue.code).toBe("timeout");
  });
});
