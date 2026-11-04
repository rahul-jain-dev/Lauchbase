import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const meta = vi.hoisted(() => ({
  providerStatus: vi.fn(),
  analyzeIdea: vi.fn(),
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
import { POST } from "../src/app/api/analyze/route";
import { emptyRequirements, ideaFields } from "../src/lib/idea-analysis";
const input = {
  ...emptyRequirements,
  idea: "A client portal for ticket booking",
};
const request = (body: unknown) =>
  new Request("http://localhost:3000/api/analyze", {
    method: "POST",
    body: JSON.stringify(body),
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
describe("analysis endpoint (fixture boundary only)", () => {
  it("reports missing configuration without inventing an extraction or calling Meta", async () => {
    const body = await (await POST(request(input))).json();
    expect(body).toMatchObject({
      state: "provider_configuration_required",
      analysis: null,
      meta: null,
    });
    expect(meta.analyzeIdea).not.toHaveBeenCalled();
  });
  it("rejects invalid input and foreign origins", async () => {
    expect((await POST(request({ idea: "x" }))).status).toBe(400);
    const foreign = request(input);
    foreign.headers.set("origin", "https://foreign.example");
    expect((await POST(foreign)).status).toBe(403);
  });
  it("validates returned fixture structure and hides provider errors", async () => {
    meta.providerStatus.mockReturnValue({
      provider: "meta",
      model: "muse-spark-1.3",
      ready: true,
      issue: null,
    });
    meta.analyzeIdea.mockRejectedValue(new Error("secret details"));
    const body = await (await POST(request(input))).json();
    expect(body.state).toBe("provider_error");
    expect(JSON.stringify(body)).not.toContain("secret details");
    meta.analyzeIdea.mockResolvedValue({
      analysis: {
        proposals: ideaFields.map((field) => ({
          field,
          value: "unknown",
          kind: "unknown",
          essential: false,
          excerpt: null,
        })),
      },
      meta: { model: "fixture-not-live", calledAt: "2026-10-31T10:00:00Z" },
    });
    expect((await (await POST(request(input))).json()).state).toBe("analyzed");
  });
});
