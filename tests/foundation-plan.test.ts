import { describe, it, expect } from "vitest";
import { emptyRequirements, confirmProposal } from "../src/lib/idea-analysis";
import { filterCatalog } from "../src/lib/recommendation";
import {
  createFoundationPlan,
  SetupChoices,
  FoundationPlan,
} from "../src/lib/foundation-plan";
import type { ScopeRequirement } from "../src/lib/scope";
const base = {
  ...emptyRequirements,
  idea: "An individual contact manager",
  accountModel: "individual" as const,
  billing: "no" as const,
  uploads: "no" as const,
  background: "no" as const,
};
const workflow = (
  id: string,
  text: string,
  dependencies: ScopeRequirement["dependencies"],
): ScopeRequirement => ({
  id,
  text,
  dependencies,
  category: "product_workflow",
  importance: "essential",
  source: "user",
  excerpt: null,
  confirmed: true,
});
describe("requirement to foundation planning (deterministic fixtures)", () => {
  it("honors mapped self-hosting and TypeScript constraints, rejects Python, and clarifies unknown technical needs", () => {
    for (const constraint of ["self_host_only", "typescript_only"] as const) {
      const input = {
        ...base,
        scope: [
          {
            ...workflow("tech", "An explicitly confirmed technical choice", [
              "unknown",
            ]),
            category: "technical_constraint" as const,
            constraint,
          },
        ],
      };
      const result = filterCatalog(input);
      const plan = createFoundationPlan(input, result, SetupChoices.parse({}));
      expect(plan).not.toBeNull();
      if (constraint === "self_host_only")
        expect(plan?.configuration.hosting).toBe("self-host");
    }
    const tech = {
      ...workflow("tech", "A required technical choice", ["unknown"]),
      category: "technical_constraint" as const,
    };
    expect(
      filterCatalog({ ...base, scope: [tech] }).questions.length,
    ).toBeGreaterThan(0);
    expect(
      filterCatalog({
        ...base,
        scope: [{ ...tech, constraint: "python_only" }],
      }).state,
    ).toBe("unsupported");
  });
  it("fits agency infrastructure while preserving essential reviews/approvals and permission gaps", () => {
    const input = {
      ...base,
      accountModel: "team" as const,
      uploads: "required" as const,
      scope: [
        workflow("reviews", "Review deliverables", [
          "workspaces",
          "saved_records",
          "private_files",
        ]),
        workflow("approvals", "Approve project milestones", [
          "saved_records",
          "project_permissions",
        ]),
      ],
    };
    const result = filterCatalog(input);
    expect(result.eligible.map((f) => f.id)).toEqual(["team"]);
    const plan = createFoundationPlan(input, result, SetupChoices.parse({}))!;
    expect(FoundationPlan.safeParse(plan).success).toBe(true);
    expect(plan.customWork).toHaveLength(2);
    expect(plan.customWork.every((s) => s.includes("Essential"))).toBe(true);
    expect(plan.blockers.join(" ")).toContain(
      "Workspace membership alone is insufficient",
    );
    expect(plan.nodes.some((n) => n.id === "storage")).toBe(true);
    expect(
      plan.technologies.find((t) => t.name === "Supabase Storage")?.need,
    ).toContain("confirmed");
    expect(plan.verificationPlan.every((s) => !s.startsWith("Passed"))).toBe(
      true,
    );
  });
  it("creates an individual plan with no worker/files or universal agent dependency", () => {
    const plan = createFoundationPlan(
      base,
      filterCatalog(base),
      SetupChoices.parse({}),
    )!;
    expect(plan.foundationId).toBe("individual");
    expect(plan.nodes.map((n) => n.id)).not.toContain("storage");
    expect(plan.nodes.map((n) => n.id)).not.toContain("assistant");
    expect(plan.nodes.map((n) => n.id)).not.toContain("editor");
    expect(plan.nodes.find((n) => n.id === "database")?.purpose).toContain(
      "does not require a worker",
    );
    expect(
      plan.technologies.some((t) => /gemini|openrouter|chatgpt/i.test(t.name)),
    ).toBe(false);
  });
  it("keeps ambiguous booking at clarification, with no final plan", () => {
    const input = {
      ...emptyRequirements,
      idea: "A client portal for ticket booking",
    };
    const result = filterCatalog(input);
    expect(result.state).toBe("needs_clarification");
    expect(
      createFoundationPlan(input, result, SetupChoices.parse({})),
    ).toBeNull();
  });
  it("blocks essential Salesforce and scheduled dependencies even when categorized as workflows", () => {
    for (const dependency of ["external_service", "background"] as const) {
      const input = {
        ...base,
        scope: [
          workflow(
            "essential",
            dependency === "background"
              ? "Send scheduled reminders"
              : "Synchronize Salesforce",
            [dependency],
          ),
        ],
      };
      const result = filterCatalog(input);
      expect(result.state).toBe("unsupported");
      expect(
        createFoundationPlan(input, result, SetupChoices.parse({})),
      ).toBeNull();
      expect(input.scope[0].importance).toBe("essential");
    }
    expect(
      filterCatalog({
        ...base,
        scope: [
          {
            ...workflow("sf", "Salesforce synchronization", ["saved_records"]),
            category: "external_integration" as const,
          },
        ],
      }).state,
    ).toBe("unsupported");
  });
  it("unknown dependencies, unconfirmed needs and conflicts require clarification", () => {
    for (const item of [
      workflow("u", "Milestone approvals", ["unknown"]),
      {
        ...workflow("u", "Milestone approvals", ["saved_records"]),
        confirmed: false,
      },
      workflow("u", "Review private files", ["private_files"]),
    ])
      expect(
        filterCatalog({ ...base, scope: [item] }).questions.length,
      ).toBeGreaterThan(0);
  });
  it("keeps account ownership separate from verification and optional tools separate from product services", () => {
    const setup = SetupChoices.parse({
      os: "windows",
      editor: "Cursor",
      assistant: "ChatGPT",
      repository: "GitHub",
      ownership: { "service-account": "have_account" },
    });
    const plan = createFoundationPlan(base, filterCatalog(base), setup)!;
    const account = plan.nodes.find((n) => n.id === "service-account")!;
    expect(account.ownership).toBe("have_account");
    expect(account.verification.state).toBe("planned");
    expect(account.cost).toBe("Not checked");
    expect(plan.nodes.find((n) => n.title === "ChatGPT")?.view).toBe(
      "development",
    );
    expect(plan.nodes.find((n) => n.title === "ChatGPT")?.choice).toBe(
      "confirmed",
    );
    expect(
      plan.nodes
        .filter((n) => n.view === "application")
        .some((n) => n.title === "ChatGPT"),
    ).toBe(false);
    for (const e of plan.edges)
      expect(
        plan.nodes.some((n) => n.id === e.from) &&
          plan.nodes.some((n) => n.id === e.to),
      ).toBe(true);
  });
  it("confirms categorized proposals without turning essential custom workflows into unsupported strings", () => {
    const input = confirmProposal(
      { ...base, idea: "A contact manager. Review deliverables" },
      {
        field: "hardRequirement",
        value: "Review deliverables",
        kind: "explicitly_stated",
        essential: true,
        category: "product_workflow",
        dependencies: ["saved_records"],
        excerpt: "Review deliverables",
      },
      new Set(),
    );
    expect(input.hardRequirements).toHaveLength(0);
    expect(input.scope?.[0].importance).toBe("essential");
    expect(filterCatalog(input).eligible.map((f) => f.id)).toContain(
      "individual",
    );
    expect(
      confirmProposal(
        input,
        {
          field: "hardRequirement",
          value: "Review deliverables",
          kind: "explicitly_stated",
          essential: true,
          category: "product_workflow",
          dependencies: ["saved_records"],
          excerpt: "Review deliverables",
        },
        new Set(),
      ).scope,
    ).toHaveLength(1);
  });
});
