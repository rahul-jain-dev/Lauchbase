import { describe, it, expect } from "vitest";
import { z } from "zod";
import { WireIdeaAnalysis, analysisFromWire } from "../src/lib/analysis-wire";
import {
  ideaFields,
  emptyRequirements,
  confirmProposal,
} from "../src/lib/idea-analysis";
import { wireSchema } from "../src/server/providers/schema";
import { filterCatalog } from "../src/lib/recommendation";
import { assessAnalysisCase, analysisCases } from "../src/lib/analysis-cases";
import { individualWireFixture, unknownWireFixture } from "./fixtures/analysis";

// Synthetic wire-format fixtures; these do not establish live model quality.
const idea = "A client portal for ticket booking";
function unknowns() {
  return {
    ...Object.fromEntries(
      ideaFields.map((field) => [
        field,
        { value: "unknown", kind: "unknown", essential: false, excerpt: null },
      ]),
    ),
    additionalRequirements: [],
  };
}
describe("fixed-field analysis wire contract (fixtures)", () => {
  it("requires all seven named fields and restricts each value to its own vocabulary", () => {
    const schema = wireSchema(
      z.toJSONSchema(WireIdeaAnalysis, { target: "draft-7" }),
    );
    expect(schema.required).toEqual([...ideaFields, "additionalRequirements"]);
    const properties = schema.properties as Record<
      string,
      {
        anyOf: {
          properties: {
            value: { enum: string[] };
            essential: { enum?: boolean[] };
          };
        }[];
      }
    >;
    expect(properties.accountModel.anyOf[1].properties.value.enum).toContain(
      "individual",
    );
    expect(properties.language.anyOf[1].properties.value.enum).not.toContain(
      "individual",
    );
    expect(properties.accountModel.anyOf[0].properties.essential.enum).toEqual([
      false,
    ]);
    expect(
      WireIdeaAnalysis.safeParse({
        ...unknowns(),
        billing: {
          value: "yes",
          kind: "suggested",
          essential: false,
          excerpt: idea,
        },
      }).success,
    ).toBe(false);
    const missing = unknowns();
    delete (missing as Record<string, unknown>).uploads;
    expect(WireIdeaAnalysis.safeParse(missing).success).toBe(false);
    expect(
      WireIdeaAnalysis.safeParse({ ...unknowns(), invented: {} }).success,
    ).toBe(false);
  });
  it("rejects short known excerpts and reports exact schema paths without weakening minimum evidence", () => {
    const parsed = WireIdeaAnalysis.safeParse({
      ...unknownWireFixture(),
      additionalRequirements: [
        {
          value: "Must use provider",
          kind: "explicitly_stated",
          essential: true,
          excerpt: "Stripe",
        },
      ],
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success)
      expect(parsed.error.issues).toContainEqual(
        expect.objectContaining({
          path: ["additionalRequirements", 0, "excerpt"],
          code: "too_small",
        }),
      );
    const schema = wireSchema(
      z.toJSONSchema(WireIdeaAnalysis, { target: "draft-7" }),
    );
    expect(JSON.stringify(schema)).toContain('"category"');
  });
  it("assesses skills, unsupported needs and catalog fit independently", () => {
    const result = analysisFromWire(
      individualWireFixture(),
      analysisCases.individual.idea,
    );
    expect(assessAnalysisCase("individual", result).extractionPassed).toBe(
      true,
    );
    const wrongSkill = structuredClone(result);
    wrongSkill.proposals.find((p) => p.field === "language")!.value = "python";
    expect(assessAnalysisCase("individual", wrongSkill).issues).toContainEqual({
      path: "language",
      code: "skill_is_not_stack_requirement",
    });
    const ambiguous = analysisFromWire(
      unknownWireFixture(),
      analysisCases.ambiguous.idea,
    );
    expect(assessAnalysisCase("ambiguous", ambiguous)).toMatchObject({
      extractionPassed: true,
      catalogState: "needs_clarification",
    });
    const agency = {
      proposals: [
        ...result.proposals.map((p) => ({
          ...p,
          value:
            p.field === "accountModel"
              ? "team"
              : p.field === "uploads"
                ? "required"
                : p.value,
        })),
        {
          field: "hardRequirement" as const,
          value: "Private client files",
          kind: "explicitly_stated" as const,
          essential: true,
          excerpt: analysisCases.agency.idea,
        },
      ],
    };
    expect(assessAnalysisCase("agency", agency)).toMatchObject({
      extractionPassed: false,
      decisionsNeeded: ["review_additional_requirements"],
      catalogState: "unsupported",
    });
  });
  it("converts unknowns to the existing domain without fabricating evidence", () => {
    const analysis = analysisFromWire(unknowns(), idea);
    expect(analysis.proposals.map((p) => p.field)).toEqual(ideaFields);
    expect(
      analysis.proposals.every(
        (p) => p.kind === "unknown" && p.excerpt === null,
      ),
    ).toBe(true);
    expect(() =>
      analysisFromWire(
        {
          ...unknowns(),
          billing: {
            value: "unknown",
            kind: "unknown",
            essential: true,
            excerpt: null,
          },
        },
        idea,
      ),
    ).toThrow();
  });
  it("rejects invented excerpts with exact safe path/rule and retains explicit answers", () => {
    const wire = {
      ...unknowns(),
      accountModel: {
        value: "team",
        kind: "suggested",
        essential: false,
        excerpt: "Invented workspace sentence",
      },
    };
    try {
      analysisFromWire(wire, idea);
      throw new Error("Expected rejection");
    } catch (error) {
      expect(error).toMatchObject({
        path: "proposals.0.excerpt",
        rule: "invalid_excerpt",
      });
    }
    const proposal = analysisFromWire(
      { ...wire, accountModel: { ...wire.accountModel, excerpt: idea } },
      idea,
    ).proposals[0];
    const answered = {
      ...emptyRequirements,
      idea,
      accountModel: "individual" as const,
    };
    expect(
      confirmProposal(answered, proposal, new Set(["accountModel"]))
        .accountModel,
    ).toBe("individual");
  });
  it("preserves unsupported essential integration extraction even when the catalog rejects it", () => {
    const integrationIdea =
      "This contact manager must integrate with Salesforce.";
    const wire = {
      ...unknowns(),
      additionalRequirements: [
        {
          value: "Must integrate with Salesforce",
          category: "external_integration",
          dependencies: ["external_service"],
          kind: "explicitly_stated",
          essential: true,
          excerpt: integrationIdea,
        },
      ],
    };
    const extracted = analysisFromWire(wire, integrationIdea);
    expect(extracted.proposals.at(-1)?.value).toBe(
      "Must integrate with Salesforce",
    );
    const confirmed = confirmProposal(
      { ...emptyRequirements, idea: integrationIdea },
      extracted.proposals.at(-1)!,
      new Set(),
    );
    expect(filterCatalog(confirmed).state).toBe("unsupported");
    const optional = analysisFromWire(
      {
        ...wire,
        additionalRequirements: [
          { ...wire.additionalRequirements[0], essential: false },
        ],
      },
      integrationIdea,
    );
    expect(optional.proposals.at(-1)?.essential).toBe(false);
  });
});
