import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const meta = vi.hoisted(() => ({
  providerStatus: vi.fn(),
  rankFoundations: vi.fn(),
}));
vi.mock("../src/server/ai", () => meta);
vi.mock("../src/server/connections/service", () => ({
  resolveConnection: () => ({
    status: meta.providerStatus(),
    config: meta.providerStatus().ready
      ? {
          provider: "meta",
          model: "muse-spark-1.3",
          apiKey: "fixture-session-key",
          endpoint: "https://api.meta.ai/v1",
        }
      : undefined,
  }),
}));
import { POST } from "../src/app/api/recommend/route";
import type { Requirements } from "../src/lib/contracts";

// Synthetic request and model fixtures; no network or live provider claims.
const fixture: Requirements = {
  idea: "A simple personal client record tracker",
  experience: "beginner",
  language: "typescript",
  framework: "nextjs",
  stackIsHard: true,
  monthlyBudget: 25,
  accountModel: "individual",
  billing: "no",
  uploads: "no",
  background: "no",
  hosting: "vercel",
  hostingIsHard: false,
  country: "India",
  supabaseEligibility: "eligible",
  existingServices: "",
  hardRequirements: [],
  assumptions: [],
};
const request = (value: unknown) =>
  new Request("http://localhost:3000/api/recommend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(value),
  });
beforeEach(() => {
  vi.resetAllMocks();
  meta.providerStatus.mockReturnValue({
    provider: "meta",
    model: "muse-spark-1.3",
    ready: false,
    issue: { code: "configuration_required", message: "Set META_API_KEY" },
  });
});
describe("recommendation endpoint (mocked Meta boundary)", () => {
  it("runs filtering with an explicit missing-configuration state", async () => {
    const response = await POST(request(fixture));
    expect((await response.json()).state).toBe(
      "provider_configuration_required",
    );
    expect(meta.rankFoundations).not.toHaveBeenCalled();
  });
  it("never calls Meta for rejected constraints or unknown requirements", async () => {
    meta.providerStatus.mockReturnValue({
      provider: "meta",
      model: "muse-spark-1.3",
      ready: true,
      issue: null,
    });
    expect(
      (await (await POST(request({ ...fixture, language: "python" }))).json())
        .state,
    ).toBe("unsupported");
    expect(
      (await (await POST(request({ ...fixture, uploads: "unknown" }))).json())
        .state,
    ).toBe("needs_clarification");
    expect(meta.rankFoundations).not.toHaveBeenCalled();
  });
  it("rejects malformed inputs and foreign-origin requests", async () => {
    expect(
      (
        await POST(
          request({
            ...fixture,
            endpoint: "https://attacker.example.com",
            provider: "gemini",
          }),
        )
      ).status,
    ).toBe(400);
    expect((await POST(request({ idea: "x" }))).status).toBe(400);
    const foreign = request(fixture);
    foreign.headers.set("origin", "https://foreign.example");
    expect((await POST(foreign)).status).toBe(403);
    expect(
      (
        await POST(
          new Request("http://localhost/api/recommend", {
            method: "POST",
            body: "{",
          }),
        )
      ).status,
    ).toBe(400);
  });
  it("returns a safe failure when the provider fails; never leaks its message", async () => {
    meta.providerStatus.mockReturnValue({
      provider: "meta",
      model: "muse-spark-1.3",
      ready: true,
      issue: null,
    });
    meta.rankFoundations.mockRejectedValue(new Error("secret-provider-detail"));
    const body = await (await POST(request(fixture))).json();
    expect(body.state).toBe("provider_error");
    expect(body.rankings).toEqual([]);
    expect(JSON.stringify(body)).not.toContain("secret-provider-detail");
  });
  it("returns a validated result from the adapter (fixture only)", async () => {
    meta.providerStatus.mockReturnValue({
      provider: "meta",
      model: "muse-spark-1.3",
      ready: true,
      issue: null,
    });
    meta.rankFoundations.mockResolvedValue({
      rankings: [
        { foundationId: "individual", explanations: ["Fixture explanation"] },
      ],
      meta: {
        model: "fixture-not-a-live-model",
        calledAt: "2026-10-31T10:00:00Z",
      },
    });
    const body = await (await POST(request(fixture))).json();
    expect(body.state).toBe("recommended");
    expect(body.rankings).toHaveLength(1);
  });
});
