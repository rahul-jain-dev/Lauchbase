import { afterEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { applicationOrigin, isSameOrigin } from "../src/server/request-origin";
import { POST as analyze } from "../src/app/api/analyze/route";
import { POST as recommend } from "../src/app/api/recommend/route";
import { emptyRequirements } from "../src/lib/idea-analysis";
afterEach(() => vi.unstubAllEnvs());
it.each([analyze, recommend])(
  "keeps inference routes usable through the configured public origin and rejects foreign origins",
  async (handler) => {
    vi.stubEnv("APP_ORIGIN", "https://demo.example.com");
    for (const origin of [
      "https://demo.example.com",
      "https://foreign.example.com",
    ]) {
      const response = await handler(
        new Request("http://0.0.0.0:10000/api/inference", {
          method: "POST",
          headers: { Origin: origin, "Content-Type": "application/json" },
          body: JSON.stringify({
            ...emptyRequirements,
            idea: "A personal contact manager with saved records",
          }),
        }),
      );
      expect(response.status).toBe(
        origin === "https://demo.example.com" ? 200 : 403,
      );
    }
  },
);
function req(origin: string, extra: Record<string, string> = {}) {
  return new Request("http://0.0.0.0:10000/api/connections", {
    headers: { origin, ...extra },
  });
}
it("accepts the configured HTTPS origin behind an internal HTTP listener", () => {
  vi.stubEnv("APP_ORIGIN", "https://demo.example.com");
  const request = req("https://demo.example.com");
  expect(isSameOrigin(request)).toBe(true);
  expect(applicationOrigin(request)).toBe("https://demo.example.com");
});
it("uses Render's server-provided public URL and prioritizes explicit configuration", () => {
  vi.stubEnv("APP_ORIGIN", "");
  vi.stubEnv("RENDER_EXTERNAL_URL", "https://render-demo.example.com");
  expect(isSameOrigin(req("https://render-demo.example.com"))).toBe(true);
  vi.stubEnv("APP_ORIGIN", "https://custom.example.com");
  expect(isSameOrigin(req("https://render-demo.example.com"))).toBe(false);
  expect(isSameOrigin(req("https://custom.example.com"))).toBe(true);
});
it("rejects foreign/null origins, forged forwarding headers and cross-site metadata", () => {
  vi.stubEnv("APP_ORIGIN", "https://demo.example.com");
  for (const origin of ["https://foreign.example.com", "null"])
    expect(
      isSameOrigin(
        req(origin, {
          host: "foreign.example.com",
          "x-forwarded-host": "foreign.example.com",
          "x-forwarded-proto": "https",
        }),
      ),
    ).toBe(false);
  expect(
    isSameOrigin(
      req("https://demo.example.com", { "sec-fetch-site": "cross-site" }),
    ),
  ).toBe(false);
});
it("allows loopback Host for local production without trusting arbitrary public Host", () => {
  vi.stubEnv("APP_ORIGIN", "");
  vi.stubEnv("RENDER_EXTERNAL_URL", "");
  expect(
    isSameOrigin(req("http://127.0.0.1:3200", { host: "127.0.0.1:3200" })),
  ).toBe(true);
  expect(
    isSameOrigin(
      req("https://foreign.example.com", {
        host: "foreign.example.com",
        "x-forwarded-proto": "https",
      }),
    ),
  ).toBe(false);
  expect(
    isSameOrigin(new Request("http://localhost:3000/api/connections")),
  ).toBe(false);
});
it.each([
  "https://user:pass@example.com",
  "https://example.com/path",
  "https://example.com/?x=1",
  "http://example.com",
  "invalid",
])("fails closed for invalid server origin %s", (value) => {
  vi.stubEnv("APP_ORIGIN", value);
  expect(applicationOrigin(req("https://example.com"))).toBeNull();
  expect(isSameOrigin(req("https://example.com"))).toBe(false);
});
