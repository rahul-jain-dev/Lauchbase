import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { rankFoundations, analyzeIdea } from "../src/server/ai";
import { providerStatus } from "../src/server/providers/config";
import { ideaFields } from "../src/lib/idea-analysis";
import type { Requirements } from "../src/lib/contracts";
import { unknownWireFixture, wireFixture } from "./fixtures/analysis";
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
  vi.stubEnv("AI_PROVIDER", "meta");
  vi.stubEnv("META_API_KEY", "fixture-key-never-real");
  vi.stubEnv("META_MODEL", "muse-spark-1.3");
  vi.stubGlobal("fetch", fetchFixture);
  fetchFixture.mockReset();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe("Meta adapter (mock HTTP fixtures, no real requests)", () => {
  it("requests structured idea understanding and preserves ambiguous fixture unknowns", async () => {
    fetchFixture.mockResolvedValue(
      Response.json({
        choices: [
          {
            finish_reason: "stop",
            message: {
              content: JSON.stringify(unknownWireFixture()),
            },
          },
        ],
      }),
    );
    const result = await analyzeIdea({
      ...fixture,
      idea: "A client portal for ticket booking",
    });
    expect(result.analysis.proposals.every((p) => p.kind === "unknown")).toBe(
      true,
    );
    const body = JSON.parse(fetchFixture.mock.calls[0][1].body);
    expect(body.response_format.json_schema.name).toBe("IdeaUnderstanding");
    expect(body.messages[0].content).toContain("Never infer shared workspaces");
    expect(body.messages[1].content).not.toContain("fixture-key-never-real");
  });
  it("rejects fabricated evidence returned by an extraction provider fixture", async () => {
    const proposals = ideaFields.map((field) => ({
      field,
      value: "unknown",
      kind: "unknown",
      essential: false,
      excerpt: null as string | null,
    }));
    proposals[0] = {
      field: "accountModel",
      value: "team",
      kind: "explicitly_stated",
      essential: false,
      excerpt: "invented shared workspace evidence",
    };
    fetchFixture.mockResolvedValue(
      Response.json({
        choices: [
          {
            finish_reason: "stop",
            message: { content: JSON.stringify(wireFixture(proposals)) },
          },
        ],
      }),
    );
    await expect(analyzeIdea(fixture)).rejects.toThrow("verbatim excerpts");
  });
  it("blocks network requests when configuration or eligible input is missing", async () => {
    vi.stubEnv("META_API_KEY", "replace_with_your_meta_api_key");
    expect(providerStatus().ready).toBe(false);
    await expect(rankFoundations(fixture)).rejects.toThrow("META_API_KEY");
    vi.stubEnv("META_API_KEY", "fixture-key-never-real");
    await expect(
      rankFoundations({ ...fixture, language: "python" }),
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
    const result = await rankFoundations(fixture);
    expect(result.rankings[0].foundationId).toBe("individual");
    const [url, options] = fetchFixture.mock.calls[0];
    expect(url).toBe("https://api.meta.ai/v1/chat/completions");
    expect(options.headers.Authorization).toBe("Bearer fixture-key-never-real");
    const body = JSON.parse(options.body);
    expect(body.model).toBe("muse-spark-1.3");
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
    await expect(rankFoundations(fixture)).rejects.toThrow(
      "eligible selections",
    );
  });
  it("rejects a truncated model response", async () => {
    fetchFixture.mockResolvedValue(
      Response.json({
        choices: [{ finish_reason: "length", message: { content: "{}" } }],
      }),
    );
    await expect(rankFoundations(fixture)).rejects.toThrow("output budget");
  });
  it("does not forward provider error bodies", async () => {
    fetchFixture.mockResolvedValue(
      new Response("secret provider request details", { status: 401 }),
    );
    await expect(rankFoundations(fixture)).rejects.toThrow("HTTP 401");
  });
});
