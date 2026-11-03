import { describe, expect, it } from "vitest";
import { Requirements, Verification, ModelRanking } from "../src/lib/contracts";
import { catalog, modules } from "../src/lib/catalog";
import { filterCatalog, validateModelRanking } from "../src/lib/recommendation";

// Explicit fixtures: these are synthetic inputs/outputs, never live Meta evidence.
export const supportedFixture: Requirements = {
  idea: "A client record tracker for freelance designers",
  experience: "comfortable",
  language: "typescript",
  framework: "nextjs",
  stackIsHard: true,
  monthlyBudget: 30,
  accountModel: "individual",
  billing: "no",
  uploads: "no",
  background: "no",
  hosting: "vercel",
  hostingIsHard: true,
  existingServices: "",
  country: "India",
  supabaseEligibility: "eligible",
  hardRequirements: [],
  assumptions: [],
};
const modelFixture = {
  rankings: [
    { foundationId: "individual", reasonCodes: ["account_fit", "stack_fit"] },
  ],
};
describe("hard-constraint filtering", () => {
  it("asks the builder to resolve a hard uploads requirement conflicting with the capability answer", () => {
    const input: Requirements = {
      ...supportedFixture,
      accountModel: "team",
      hardRequirements: ["uploads"],
      uploads: "no",
    };
    expect(filterCatalog(input).state).toBe("needs_clarification");
    expect(() =>
      validateModelRanking(
        { rankings: [{ foundationId: "team", reasonCodes: ["account_fit"] }] },
        input,
      ),
    ).toThrow();
  });
  it.each([
    { language: "python" },
    { framework: "django" },
    { billing: "required" },
    { background: "required" },
    { supabaseEligibility: "ineligible" },
    { hosting: "other" },
    { hardRequirements: ["HIPAA certification"] },
  ])("rejects unsupported hard requirements: %j", (change) => {
    const result = filterCatalog({
      ...supportedFixture,
      ...change,
    } as Requirements);
    expect(result.state).toBe("unsupported");
    expect(result.eligible).toHaveLength(0);
    expect(result.eliminated).toHaveLength(2);
  });
  it("rejects uploads plus individual-only accounts without changing either constraint", () => {
    const result = filterCatalog({ ...supportedFixture, uploads: "required" });
    expect(result.state).toBe("unsupported");
    expect(
      result.eliminated
        .find((x) => x.foundationId === "individual")
        ?.reasons.join(),
    ).toContain("uploads");
    expect(
      result.eliminated.find((x) => x.foundationId === "team")?.reasons.join(),
    ).toContain("individual");
  });
  it("does not infer compatibility from unknown information", () => {
    const result = filterCatalog({
      ...supportedFixture,
      accountModel: "unknown",
      uploads: "unknown",
      language: "unknown",
      monthlyBudget: null,
      country: "",
      supabaseEligibility: "unknown",
    });
    expect(result.state).toBe("needs_clarification");
    expect(result.questions.map((q) => q.id)).toEqual([
      "stack",
      "accounts",
      "capabilities",
    ]);
    expect(result.rankings).toHaveLength(0);
    expect(() =>
      validateModelRanking(modelFixture, {
        ...supportedFixture,
        language: "unknown",
      }),
    ).toThrow();
  });
  it("uses only confirmed assumptions and gives explicit answers priority", () => {
    const base: Requirements = {
      ...supportedFixture,
      accountModel: "unknown",
      assumptions: [{ field: "accountModel", value: "team", confirmed: false }],
    };
    expect(filterCatalog(base).state).toBe("needs_clarification");
    expect(
      filterCatalog({
        ...base,
        assumptions: [{ ...base.assumptions[0], confirmed: true }],
      }).eligible.map((x) => x.id),
    ).toEqual(["team"]);
    expect(
      filterCatalog({
        ...base,
        accountModel: "individual",
        assumptions: [{ ...base.assumptions[0], confirmed: true }],
      }).eligible.map((x) => x.id),
    ).toEqual(["individual"]);
  });
  it("permits an explicitly flexible stack while disclosing the mismatch", () => {
    const result = filterCatalog({
      ...supportedFixture,
      language: "python",
      stackIsHard: false,
    });
    expect(result.eligible.map((x) => x.id)).toEqual(["individual"]);
    expect(result.unresolved.join()).toContain("outside the catalog");
  });
  it("supports the team plus uploads definition, with verification still planned", () => {
    const result = filterCatalog({
      ...supportedFixture,
      accountModel: "team",
      uploads: "required",
    });
    expect(result.eligible.map((x) => x.id)).toEqual(["team"]);
    expect(result.eligible[0].verification.state).toBe("planned");
    expect(result.unresolved.join()).toContain("Budget fit is unverified");
  });
});
describe("model output boundary (fixtures only)", () => {
  it("accepts a supported ranking and derives explanations from catalog facts", () => {
    expect(
      validateModelRanking(modelFixture, supportedFixture)[0].foundationId,
    ).toBe("individual");
    expect(filterCatalog(supportedFixture).state).toBe(
      "provider_configuration_required",
    );
  });
  it.each([
    {
      rankings: [{ foundationId: "invented-neon", reasonCodes: ["stack_fit"] }],
    },
    { rankings: [{ foundationId: "team", reasonCodes: ["account_fit"] }] },
    {
      rankings: [
        { foundationId: "individual", reasonCodes: ["private_uploads"] },
      ],
    },
    {
      rankings: [
        { foundationId: "individual", reasonCodes: ["stripe_supported"] },
      ],
    },
    {
      rankings: [
        {
          foundationId: "individual",
          reasonCodes: ["account_fit"],
          integrations: ["Stripe"],
        },
      ],
    },
    { rankings: [] },
    { rankings: [modelFixture.rankings[0], modelFixture.rankings[0]] },
  ])(
    "rejects invented, ineligible, duplicate, or ungrounded selections: %j",
    (fixture) => {
      expect(() => validateModelRanking(fixture, supportedFixture)).toThrow();
    },
  );
  it("requires all eligible alternatives to be ranked", () => {
    expect(() =>
      validateModelRanking(modelFixture, {
        ...supportedFixture,
        accountModel: "either",
      }),
    ).toThrow();
  });
  it("cannot override hard requirements even with valid model JSON", () => {
    expect(ModelRanking.safeParse(modelFixture).success).toBe(true);
    expect(() =>
      validateModelRanking(modelFixture, {
        ...supportedFixture,
        language: "python",
      }),
    ).toThrow();
  });
});
describe("catalog and evidence contracts", () => {
  it("keeps both definitions planned, versioned, and linked to known modules", () => {
    for (const f of catalog) {
      expect(f.verification.state).toBe("planned");
      expect(f.maturity).toBe("catalog_definition");
      expect(f.sources.length).toBeGreaterThan(0);
      expect(f.moduleIds.every((id) => modules.some((m) => m.id === id))).toBe(
        true,
      );
    }
  });
  it("requires actual evidence and timestamps for executed outcomes", () => {
    expect(Verification.safeParse({ state: "passed" }).success).toBe(false);
    expect(Verification.safeParse({ state: "planned" }).success).toBe(true);
    expect(
      Verification.safeParse({
        state: "pending_configuration",
        reason: "Missing credentials",
      }).success,
    ).toBe(true);
  });
  it("rejects negative budgets and invalid assumptions", () => {
    expect(
      Requirements.safeParse({ ...supportedFixture, monthlyBudget: -1 })
        .success,
    ).toBe(false);
    expect(
      Requirements.safeParse({
        ...supportedFixture,
        assumptions: [{ field: "hosting", value: "team", confirmed: true }],
      }).success,
    ).toBe(false);
  });
});
