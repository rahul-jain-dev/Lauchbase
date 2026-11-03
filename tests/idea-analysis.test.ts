import { describe, expect, it } from "vitest";
import {
  confirmProposal,
  emptyRequirements,
  ideaFields,
  validateIdeaAnalysis,
  type Proposal,
} from "../src/lib/idea-analysis";
import { filterCatalog } from "../src/lib/recommendation";

// Synthetic extraction fixtures: these tests do not call Meta or establish live model quality.
const ambiguous = "A client portal for ticket booking";
const unknownFixture = () => ({
  proposals: ideaFields.map((field) => ({
    field,
    value: "unknown",
    kind: "unknown",
    essential: false,
    excerpt: null,
  })),
});
const base = { ...emptyRequirements, idea: ambiguous };
const settled = {
  ...base,
  accountModel: "individual" as const,
  billing: "no" as const,
  uploads: "no" as const,
  background: "no" as const,
};
describe("idea extraction and confirmation boundaries (fixtures)", () => {
  it("keeps ambiguous portal and booking descriptions unknown, without keyword-based requirements", () => {
    const analysis = validateIdeaAnalysis(unknownFixture(), ambiguous);
    expect(analysis.proposals.every((p) => p.kind === "unknown")).toBe(true);
    expect(filterCatalog(base).state).toBe("needs_clarification");
    expect(filterCatalog(base).questions.flatMap((q) => q.fields)).toEqual([
      "accountModel",
      "billing",
      "uploads",
      "background",
    ]);
    expect(() =>
      confirmProposal(base, analysis.proposals[0], new Set()),
    ).toThrow();
  });
  it("does not apply a suggestion until confirmation and keeps explicit answers in priority", () => {
    const proposal: Proposal = {
      field: "accountModel",
      value: "team",
      kind: "suggested",
      essential: false,
      excerpt: ambiguous,
    };
    expect(base.accountModel).toBe("unknown");
    expect(confirmProposal(base, proposal, new Set()).accountModel).toBe(
      "team",
    );
    expect(
      confirmProposal(settled, proposal, new Set(["accountModel"]))
        .accountModel,
    ).toBe("individual");
  });
  it("retains unsupported essential payments extracted from a full supporting statement", () => {
    const idea = "Customers must pay for each ticket when booking.";
    const fixture = unknownFixture();
    fixture.proposals[1] = {
      field: "billing",
      value: "required",
      kind: "explicitly_stated",
      essential: true,
      excerpt: idea,
    } as never;
    const proposal = validateIdeaAnalysis(fixture, idea).proposals[1];
    const confirmed = confirmProposal(
      { ...settled, idea },
      proposal,
      new Set(),
    );
    expect(confirmed.billing).toBe("required");
    expect(filterCatalog(confirmed).state).toBe("unsupported");
    expect(proposal.excerpt).toBe(idea);
  });
  it("preserves multiple unsupported integration requirements rather than dropping them", () => {
    const idea = "Must use Salesforce and must integrate an existing provider.";
    const fixture = unknownFixture();
    fixture.proposals.push({
      field: "hardRequirement",
      value: "Must use Salesforce",
      kind: "explicitly_stated",
      essential: true,
      excerpt: idea,
    } as never);
    const p = validateIdeaAnalysis(fixture, idea).proposals.at(-1)!;
    const confirmed = confirmProposal(
      { ...settled, idea },
      p,
      new Set(["hardRequirement"]),
    );
    expect(confirmed.hardRequirements).toContain("Must use Salesforce");
    expect(filterCatalog(confirmed).state).toBe("unsupported");
  });
  it("makes a Python-only constraint hard only after confirmation and respects explicit strength choices", () => {
    const p: Proposal = {
      field: "language",
      value: "python",
      kind: "explicitly_stated",
      essential: true,
      excerpt: "Must use Python only",
    };
    expect(base.stackIsHard).toBe(false);
    const confirmed = confirmProposal(settled, p, new Set());
    expect(confirmed.stackIsHard).toBe(true);
    expect(filterCatalog(confirmed).state).toBe("unsupported");
    expect(
      confirmProposal(settled, p, new Set(["stackIsHard"])).stackIsHard,
    ).toBe(false);
  });
  it.each(["invented evidence", "booking"])(
    "rejects unrelated or isolated keyword evidence: %s",
    (excerpt) => {
      const fixture = unknownFixture();
      fixture.proposals[0] = {
        field: "accountModel",
        value: "team",
        kind: "explicitly_stated",
        essential: false,
        excerpt,
      } as never;
      expect(() => validateIdeaAnalysis(fixture, ambiguous)).toThrow();
    },
  );
  it("rejects invented enum values, duplicate fields and unknowns with invented facts", () => {
    const fixture = unknownFixture();
    fixture.proposals[0] = {
      field: "accountModel",
      value: "invented-tenant-engine",
      kind: "suggested",
      essential: false,
      excerpt: ambiguous,
    } as never;
    expect(() => validateIdeaAnalysis(fixture, ambiguous)).toThrow();
    expect(() =>
      validateIdeaAnalysis(
        {
          proposals: [
            ...unknownFixture().proposals,
            unknownFixture().proposals[0],
          ],
        },
        ambiguous,
      ),
    ).toThrow();
    expect(() =>
      validateIdeaAnalysis(
        {
          proposals: unknownFixture().proposals.map((p) => ({
            ...p,
            essential: true,
          })),
        },
        ambiguous,
      ),
    ).toThrow();
  });
  it("keeps unknown and zero budgets different without requiring technical prerequisite answers", () => {
    const unknown = filterCatalog(settled);
    const zero = filterCatalog({ ...settled, monthlyBudget: 0 });
    expect(unknown.questions).toEqual([]);
    expect(zero.questions).toEqual([]);
    expect(unknown.unresolved.join()).toContain("not decided");
    expect(zero.unresolved.join()).toContain("explicitly $0");
    expect(unknown.unresolved.join()).toContain("compatibility is unknown");
    expect(unknown.rankings).toEqual([]);
  });
});
