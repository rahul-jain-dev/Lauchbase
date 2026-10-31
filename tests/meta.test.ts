import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { metaConfigured, rankWithMeta } from "../src/server/meta";
import type { Requirements } from "../src/lib/contracts";
const fixture: Requirements = {
  idea: "A personal client tracker fixture",
  experience: "experienced",
  language: "typescript",
  framework: "nextjs",
  stackIsHard: true,
  monthlyBudget: 20,
  accountModel: "individual",
  billing: "no",
  uploads: "no",
  background: "no",
  hosting: "vercel",
  hostingIsHard: false,
  existingServices: "",
  country: "India",
  supabaseEligibility: "eligible",
  hardRequirements: [],
  assumptions: [],
};
const fetchFixture = vi.fn();
beforeEach(() => {
  vi.stubEnv("META_API_KEY", "fixture-key-never-real");
  vi.stubEnv("META_MODEL", "fixture-model");
  vi.stubGlobal("fetch", fetchFixture);
  fetchFixture.mockReset();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe("Meta adapter (mock HTTP fixtures, no real requests)", () => {
  it("blocks network requests when configuration or eligible input is missing", async () => {
    vi.stubEnv("META_API_KEY", "replace_with_your_meta_api_key");
    expect(metaConfigured()).toBe(false);
    await expect(rankWithMeta(fixture)).rejects.toThrow(
      "configuration required",
    );
    vi.stubEnv("META_API_KEY", "fixture-key-never-real");
    await expect(
      rankWithMeta({ ...fixture, language: "python" }),
    ).rejects.toThrow("blocked");
    expect(fetchFixture).not.toHaveBeenCalled();
  });
  it("uses configured model, server authorization and structured output", async () => {
    fetchFixture.mockResolvedValue(
      Response.json({
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
    const result = await rankWithMeta(fixture);
    expect(result.rankings[0].foundationId).toBe("individual");
    const [url, options] = fetchFixture.mock.calls[0];
    expect(url).toBe("https://api.meta.ai/v1/chat/completions");
    expect(options.headers.Authorization).toBe("Bearer fixture-key-never-real");
    const body = JSON.parse(options.body);
    expect(body.model).toBe("fixture-model");
    expect(body.response_format.type).toBe("json_schema");
    expect(options.body).not.toContain("fixture-key-never-real");
  });
  it("rejects an invented integration returned by the HTTP provider fixture", async () => {
    fetchFixture.mockResolvedValue(
      Response.json({
        choices: [
          {
            finish_reason: "stop",
            message: {
              content: JSON.stringify({
                rankings: [
                  { foundationId: "neon", reasonCodes: ["stack_fit"] },
                ],
              }),
            },
          },
        ],
      }),
    );
    await expect(rankWithMeta(fixture)).rejects.toThrow("ineligible");
  });
  it("rejects a truncated model response", async () => {
    fetchFixture.mockResolvedValue(
      Response.json({
        choices: [{ finish_reason: "length", message: { content: "{}" } }],
      }),
    );
    await expect(rankWithMeta(fixture)).rejects.toThrow("incomplete");
  });
  it("does not forward provider error bodies", async () => {
    fetchFixture.mockResolvedValue(
      new Response("secret provider request details", { status: 401 }),
    );
    await expect(rankWithMeta(fixture)).rejects.toThrow("HTTP 401");
  });
});
