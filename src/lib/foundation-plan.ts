import { z } from "zod";
import { Requirements, RecommendationResult, Verification } from "./contracts";
import { catalog, catalogVersion, modules } from "./catalog";
import { scopeDecisions } from "./scope";
import { effectiveRequirements } from "./recommendation";

export const SetupChoices = z.object({
  os: z.enum(["unknown", "windows", "macos", "linux"]).default("unknown"),
  editor: z
    .enum(["undecided", "VS Code", "Cursor", "Codex", "other"])
    .default("undecided"),
  assistant: z.enum(["none", "ChatGPT", "Meta AI", "other"]).default("none"),
  repository: z.enum(["undecided", "none", "GitHub"]).default("undecided"),
  ownership: z
    .record(z.string(), z.enum(["unknown", "have_account", "need_account"]))
    .default({}),
});
export type SetupChoices = z.infer<typeof SetupChoices>;
const PlanNode = z.object({
  id: z.string(),
  view: z.enum(["application", "development"]),
  title: z.string(),
  purpose: z.string(),
  reason: z.string(),
  requirementIds: z.array(z.string()),
  choice: z.enum(["proposed", "confirmed"]),
  ownership: z.enum(["unknown", "have_account", "need_account"]),
  setup: z.array(z.string()),
  verification: Verification,
  cost: z.literal("Not checked"),
  nextAction: z.string(),
});
export const FoundationPlan = z.object({
  version: z.literal("foundation-plan-v1"),
  catalogVersion: z.string(),
  foundationId: z.enum(["individual", "team"]),
  foundationName: z.string(),
  status: z.literal("proposed"),
  configuration: Requirements,
  setupChoices: SetupChoices,
  explanation: z.string(),
  capabilities: z.array(z.string()),
  capabilityIds: z.array(
    z.enum(["auth", "crud", "teams", "roles", "invitations", "uploads"]),
  ),
  buildReadiness: z.enum(["pending_generation", "blocked"]),
  customWork: z.array(z.string()),
  excluded: z.array(z.string()),
  decisions: z.array(z.string()),
  blockers: z.array(z.string()),
  technologies: z.array(
    z.object({
      name: z.string(),
      role: z.string(),
      need: z.string(),
      sources: z.array(z.string()),
    }),
  ),
  nodes: z.array(PlanNode),
  edges: z.array(
    z.object({ from: z.string(), to: z.string(), meaning: z.string() }),
  ),
  modules: z.array(
    z.object({
      id: z.string(),
      version: z.string(),
      state: z.literal("planned"),
    }),
  ),
  plannedFiles: z.array(z.string()),
  verificationPlan: z.array(z.string()),
});
export type FoundationPlan = z.infer<typeof FoundationPlan>;
const labels: Record<string, string> = {
  auth: "Sign-in",
  crud: "Saved records",
  teams: "Shared workspaces",
  roles: "Workspace member roles",
  invitations: "Invitations",
  uploads: "Private file uploads",
};
const safeText = (value: string) =>
  value.replace(
    /\b(?:sk-[A-Za-z0-9_-]{8,}|AIza[A-Za-z0-9_-]{12,}|Bearer\s+\S+)/g,
    "[credential omitted]",
  );
export function createFoundationPlan(
  input: Requirements,
  result: RecommendationResult,
  setup: SetupChoices,
): FoundationPlan | null {
  const r = effectiveRequirements(Requirements.parse(input));
  if (
    result.questions.length ||
    result.state === "unsupported" ||
    !result.eligible.length ||
    (r.scope ?? []).some((s) => !s.confirmed)
  )
    return null;
  const id =
    result.rankings[0]?.foundationId ??
    (result.eligible.length === 1 ? result.eligible[0].id : null);
  const f = catalog.find(
    (f) =>
      f.id === id && result.eligible.some((eligible) => eligible.id === f.id),
  );
  if (!f) return null;
  const scope = scopeDecisions(r.scope ?? []);
  if (scope.blockers.length || scope.questions.length) return null;
  const uploads =
    r.uploads === "required" ||
    r.scope?.some(
      (s) =>
        s.confirmed &&
        s.importance === "essential" &&
        s.dependencies.includes("private_files"),
    );
  const selectedCaps = f.capabilities.filter((c) => c !== "uploads" || uploads);
  const permissionGap =
    f.id === "team"
      ? "Project-level client permissions are not provided by workspace membership. Define which projects each client can access, implement that extension, and test isolation before use."
      : "Each customer's records require ownership isolation tests before use.";
  const customWork = (r.scope ?? [])
    .filter((s) => s.confirmed && s.category === "product_workflow")
    .map(
      (s) =>
        `${s.importance === "essential" ? "Essential" : "Optional"}: ${safeText(s.text)} — custom screens, state transitions and tests remain to be developed.`,
    );
  const technologies = [
    {
      name: "Next.js",
      role: "Application pages and server request handlers",
      need: "The confirmed product needs a web interface around its accounts and records.",
      sources: f.sources,
    },
    {
      name: "React",
      role: "Interactive forms and product screens",
      need: "Users need to view and edit product records; custom workflow screens still need development.",
      sources: f.sources,
    },
    {
      name: "TypeScript",
      role: "Shared data contracts and application code",
      need: "The proposed catalog configuration uses one typed web stack; this is a proposal, not an inferred skill requirement.",
      sources: f.sources,
    },
    {
      name: "Supabase Auth",
      role: "Customer sign-in and session identity",
      need:
        r.accountModel === "team"
          ? "Identify members before applying workspace membership rules."
          : "Identify the owner of each customer's records.",
      sources: f.sources,
    },
    {
      name: "Supabase PostgreSQL",
      role: "Persist records and workspace membership",
      need: "Saved records persist in the database without a background worker. Scheduled or long-running processing is a separate requirement.",
      sources: f.sources,
    },
    ...(uploads
      ? [
          {
            name: "Supabase Storage",
            role: "Private uploaded files with access policies",
            need: "Private file uploads were confirmed. Policies and isolation tests are still planned; project permissions may need extension.",
            sources: f.sources,
          },
        ]
      : []),
  ];
  const nodes: FoundationPlan["nodes"] = [],
    edges: FoundationPlan["edges"] = [];
  function node(
    id: string,
    view: "application" | "development",
    title: string,
    purpose: string,
    reason: string,
    requirements: string[],
    nextAction: string,
    choice: "proposed" | "confirmed" = "proposed",
  ) {
    nodes.push({
      id,
      view,
      title,
      purpose,
      reason,
      requirementIds: requirements,
      choice,
      ownership: setup.ownership[id] ?? "unknown",
      setup: [nextAction],
      verification: { state: "planned" },
      cost: "Not checked",
      nextAction,
    });
  }
  const edge = (from: string, to: string, meaning: string) =>
    edges.push({ from, to, meaning });
  node(
    "interface",
    "application",
    "Web interface",
    "Next.js / React forms, dashboard and product screens.",
    "Present the confirmed account and record experience.",
    ["accountModel", "saved_records"],
    "Generate the base interface, then implement custom workflow screens.",
  );
  node(
    "identity",
    "application",
    "Customer sign-in",
    "Supabase Auth identifies the customer.",
    "Confirmed account model needs an identity boundary.",
    ["accountModel"],
    "Create a Supabase project and configure authentication.",
  );
  node(
    "database",
    "application",
    "Saved records",
    "Supabase PostgreSQL stores records persistently; keeping data does not require a worker.",
    "Records and ownership/workspace membership need persistence.",
    ["accountModel", "saved_records"],
    "Create schema and row-level policies; run ownership/isolation tests.",
  );
  edge(
    "interface",
    "identity",
    "Sign-in establishes a session; no account is connected yet.",
  );
  edge(
    "interface",
    "database",
    "Read and write records under access policies.",
  );
  edge(
    "identity",
    "database",
    f.id === "team"
      ? "Workspace membership constrains access; project-level permissions require extension."
      : "Owner identity constrains record access.",
  );
  if (uploads) {
    node(
      "storage",
      "application",
      "Private file storage",
      "Supabase Storage holds private uploaded files.",
      "Private uploads are part of the confirmed scope.",
      ["uploads"],
      "Configure private buckets and access policies; test cross-workspace and client boundaries.",
    );
    edge(
      "interface",
      "storage",
      "Upload and fetch files with authorized access.",
    );
    edge(
      "database",
      "storage",
      "Record file metadata and the access boundary.",
    );
  }
  for (const s of r.scope ?? [])
    if (s.confirmed && s.category === "product_workflow") {
      node(
        `workflow-${s.id}`,
        "application",
        "Custom product workflow",
        safeText(s.text),
        "A confirmed product workflow remains custom development; storage alone does not implement it.",
        [s.id],
        "Implement screens, workflow states, access rules and behavior tests.",
      );
      edge(
        "interface",
        `workflow-${s.id}`,
        "Future custom screens implement this workflow.",
      );
      edge(
        `workflow-${s.id}`,
        "database",
        "Future code stores workflow state; schema/behavior are not implemented.",
      );
    }
  node(
    "folder",
    "development",
    "Your computer / project folder",
    `Future local project on ${setup.os === "unknown" ? "an operating system still to choose" : setup.os}.`,
    "A real project needs somewhere to be assembled and run.",
    ["setup"],
    "Confirm operating system, Node.js and pnpm; generation follows next milestone.",
  );
  edge(
    "folder",
    "interface",
    "The future local project contains and runs the web interface after real installation and configuration; no code has been generated.",
  );
  if (setup.editor !== "undecided") {
    node(
      "editor",
      "development",
      setup.editor,
      "Your chosen editor or coding agent changes the project code.",
      "You explicitly chose this tool; it is optional, not a product dependency.",
      ["development_tools"],
      "Open the future generated folder in this tool; account/configuration unverified.",
      "confirmed",
    );
    edge(
      "editor",
      "folder",
      "Edit source files or review a coding agent's proposed changes.",
    );
  }
  if (setup.assistant !== "none") {
    node(
      "assistant",
      "development",
      setup.assistant,
      "Your optional planning assistant helps review requirements and handoff instructions.",
      "This is your explicit development choice, separate from LaunchBase's inference connection.",
      ["development_tools"],
      "Provide the reviewed build plan manually; no automatic connection exists.",
      "confirmed",
    );
    edge(
      "assistant",
      setup.editor !== "undecided" ? "editor" : "folder",
      "Manually hand off planning instructions; does not install or execute code.",
    );
  }
  if (setup.repository === "GitHub") {
    node(
      "repository",
      "development",
      "GitHub repository",
      "Version and review the future project source.",
      "You chose GitHub for version control; no repository was created.",
      ["development_tools"],
      "Create or select a repository and review what will be committed.",
      "confirmed",
    );
    edge(
      "folder",
      "repository",
      "Future Git commits preserve source history; no push has occurred.",
    );
  }
  node(
    "service-account",
    "development",
    "Supabase service account",
    "Configure the proposed Auth, database and optional Storage services.",
    "The selected catalog depends on Supabase; an existing account does not establish access/configuration.",
    ["accountModel", ...(uploads ? ["uploads"] : [])],
    "Confirm eligibility/region, create a project and later configure server/client environment placeholders.",
  );
  edge(
    "service-account",
    "identity",
    "Account setup configures the application's identity service.",
  );
  edge("service-account", "database", "Account setup configures its database.");
  if (uploads)
    edge(
      "service-account",
      "storage",
      "Account setup configures private storage.",
    );
  if (["vercel", "self-host"].includes(r.hosting)) {
    node(
      "hosting",
      "development",
      r.hosting === "vercel" ? "Vercel hosting" : "Self-hosted Node runtime",
      "Run the future web application after generation and verification.",
      "Hosting preference was explicitly provided; deployment has not occurred.",
      ["hosting"],
      "Review provider/runtime prerequisites and costs; configure deployment after local checks.",
      "confirmed",
    );
    edge(
      setup.repository === "GitHub" ? "repository" : "folder",
      "hosting",
      "Future deployment uses reviewed source; no deployment connection exists.",
    );
    edge(
      "hosting",
      "interface",
      "A future deployment would serve the web interface.",
    );
  }
  const selectedModules = modules.filter((m) => f.moduleIds.includes(m.id));
  return FoundationPlan.parse({
    version: "foundation-plan-v1",
    catalogVersion,
    foundationId: f.id,
    foundationName: f.name,
    status: "proposed",
    configuration: r,
    setupChoices: setup,
    explanation:
      f.id === "team"
        ? "A shared-workspace foundation fits the confirmed collaborative account structure and record needs; product workflows remain custom development."
        : "An individual-user foundation fits customers working independently with their own records; product workflows remain custom development.",
    capabilities: selectedCaps.map((c) => labels[c] ?? c),
    capabilityIds: selectedCaps,
    buildReadiness: scope.gaps.length ? "blocked" : "pending_generation",
    customWork,
    excluded: [
      r.billing === "no" ? "Customer payments — excluded by you" : "",
      r.background === "no"
        ? "Scheduled/background processing — excluded by you"
        : "",
      r.uploads === "no" ? "File uploads — excluded by you" : "",
    ].filter(Boolean),
    blockers: scope.gaps,
    decisions: [
      ...(r.scope ?? [])
        .filter(
          (s) =>
            s.category === "external_integration" &&
            s.importance !== "essential",
        )
        .map(
          (s) =>
            `Optional integration “${safeText(s.text)}” has no selected adapter and is not implemented; decide whether to omit it or add supported integration work.`,
        ),
      ...(r.scope ?? [])
        .filter((s) => s.category === "foundation_capability")
        .map(
          (s) =>
            `Review the precise acceptance criteria for “${safeText(s.text)}”; only the named catalog capabilities are proposed, not arbitrary security or product behavior.`,
        ),
      permissionGap,
      ...result.unresolved.filter((x) => !x.startsWith("Catalog definitions")),
      ...(setup.os === "unknown"
        ? ["Choose an operating system before tailored setup instructions."]
        : []),
      ...(setup.editor === "undecided"
        ? [
            "Choose an editor/coding agent when ready; this is optional for exploring a foundation.",
          ]
        : []),
    ],
    technologies,
    nodes,
    edges,
    modules: selectedModules.map((m) => ({
      id: m.id,
      version: m.version,
      state: "planned",
    })),
    plannedFiles: [
      "package.json",
      "pnpm-lock.yaml",
      "src/app/(protected)/layout.tsx",
      "src/app/(protected)/records/page.tsx",
      "src/lib/auth/session.ts",
      "supabase/migrations/initial.sql",
      ".env.example",
      "README.md",
      "BUILD_HANDOFF.md",
      ...(f.id === "team"
        ? [
            "src/lib/workspaces/membership.ts",
            "tests/workspace-isolation.spec.ts",
          ]
        : ["tests/record-ownership.spec.ts"]),
      ...(uploads
        ? [
            "src/lib/uploads/private-files.ts",
            "tests/private-file-access.spec.ts",
          ]
        : []),
    ],
    verificationPlan: [
      "Planned: install pinned dependencies, typecheck, lint and production build",
      "Planned: test sign-in and ownership/workspace isolation with distinct accounts",
      ...(uploads
        ? [
            "Planned: test private file policies across workspace/client boundaries",
          ]
        : []),
      "Pending configuration: verify real service accounts and hosting",
      "Planned: implement and test custom workflow transitions and any project-level permission extension",
      "No project checks have been executed; no ZIP or generated files exist yet",
    ],
  });
}
