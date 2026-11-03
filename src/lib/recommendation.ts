import { catalog } from "./catalog";
import { scopeDecisions, dependencyLabels } from "./scope";
import {
  ModelRanking,
  RecommendationResult,
  Requirements,
  type Foundation,
  type ReasonCode,
} from "./contracts";

export function effectiveRequirements(input: Requirements): Requirements {
  const r = structuredClone(input);
  for (const a of r.assumptions) {
    if (a.confirmed && r[a.field] === "unknown") {
      if (
        a.field === "accountModel" &&
        (a.value === "individual" || a.value === "team")
      )
        r.accountModel = a.value;
      if (
        a.field === "hosting" &&
        (a.value === "vercel" || a.value === "self-host")
      )
        r.hosting = a.value;
    }
  }
  for (const item of r.scope ?? [])
    if (
      item.confirmed &&
      item.importance === "essential" &&
      item.category === "technical_constraint"
    ) {
      if (
        item.constraint === "self_host_only" &&
        ["unknown", "no-preference", "self-host"].includes(r.hosting)
      ) {
        r.hosting = "self-host";
        r.hostingIsHard = true;
      }
      if (
        item.constraint === "typescript_only" &&
        ["unknown", "no-preference", "typescript"].includes(r.language)
      ) {
        r.language = "typescript";
        r.stackIsHard = true;
      }
      if (
        item.constraint === "python_only" &&
        ["unknown", "no-preference", "python"].includes(r.language)
      ) {
        r.language = "python";
        r.stackIsHard = true;
      }
      if (
        item.constraint === "nextjs_only" &&
        ["unknown", "no-preference", "nextjs"].includes(r.framework)
      ) {
        r.framework = "nextjs";
        r.stackIsHard = true;
      }
    }
  return r;
}

export function filterCatalog(input: Requirements): RecommendationResult {
  const r = effectiveRequirements(Requirements.parse(input));
  const uploadsNeedClarification =
    r.hardRequirements.some((h) => h.toLowerCase() === "uploads") &&
    r.uploads !== "required";
  const questions: RecommendationResult["questions"] = [];
  const scope = scopeDecisions(r.scope ?? []);
  scope.questions.forEach((question, i) =>
    questions.push({ id: `scope-${i}`, fields: ["scope"], question }),
  );
  for (const item of r.scope ?? [])
    if (item.confirmed && item.importance === "essential") {
      const requiredChoices: Record<
        string,
        [keyof Requirements, string] | undefined
      > = {
        self_host_only: ["hosting", "self-host"],
        typescript_only: ["language", "typescript"],
        python_only: ["language", "python"],
        nextjs_only: ["framework", "nextjs"],
      };
      const requiredChoice = requiredChoices[item.constraint ?? "none"];
      if (
        item.category === "technical_constraint" &&
        requiredChoice &&
        !["unknown", "no-preference", requiredChoice[1]].includes(
          String(r[requiredChoice[0] as keyof Requirements]),
        )
      )
        questions.push({
          id: `technical-conflict-${item.id}`,
          fields: ["scope", requiredChoice[0]],
          question: `Resolve the conflicting explicit technical choices for: ${item.text}`,
        });
      if (item.dependencies.includes("private_files") && r.uploads === "no")
        questions.push({
          id: `scope-files-${item.id}`,
          fields: ["scope", "uploads"],
          question: `“${item.text}” needs private files but uploads are excluded. Resolve this conflict explicitly.`,
        });
      if (
        item.dependencies.includes("workspaces") &&
        r.accountModel === "individual"
      )
        questions.push({
          id: `scope-team-${item.id}`,
          fields: ["scope", "accountModel"],
          question: `“${item.text}” needs shared workspaces but independent accounts were selected. Resolve this conflict explicitly.`,
        });
    }
  const ask = (id: string, fields: string[], question: string) =>
    questions.push({ id, fields, question });
  if (
    r.stackIsHard &&
    (r.language === "unknown" || r.framework === "unknown") &&
    (input.stackIsHard ||
      !(r.scope ?? []).some(
        (s) =>
          s.confirmed &&
          s.importance === "essential" &&
          ["typescript_only", "python_only", "nextjs_only"].includes(
            s.constraint ?? "none",
          ),
      ))
  )
    ask(
      "stack",
      ["language", "framework"],
      "You marked your technology choices as essential. Which language and framework must the product use?",
    );
  if (r.accountModel === "unknown")
    ask(
      "accounts",
      ["accountModel"],
      "Will customers work independently, or collaborate in shared workspaces?",
    );
  if (
    [r.billing, r.uploads, r.background].includes("unknown") ||
    uploadsNeedClarification
  )
    ask(
      "capabilities",
      ["billing", "uploads", "background"].filter(
        (field) =>
          r[field as "billing" | "uploads" | "background"] === "unknown" ||
          (field === "uploads" && uploadsNeedClarification),
      ),
      uploadsNeedClarification
        ? "You listed uploads as a hard requirement. Select Required for file uploads, or remove that hard requirement, to resolve the conflicting answers."
        : "Are billing, uploads and background jobs required, optional, or unnecessary?",
    );
  if (r.hostingIsHard && r.hosting === "unknown")
    ask(
      "operations",
      ["hosting"],
      "You marked hosting as essential. Which hosting target must the product use?",
    );

  const unresolved = [
    ...scope.gaps,
    "Catalog definitions only: generated applications and integrations have not been implemented or verified.",
    "Budget fit is unverified: usage, provider plans and current pricing must be evaluated before choosing a foundation.",
  ];
  if (r.monthlyBudget === null)
    unresolved.push(
      "Your budget is not decided yet; no cost fit is established.",
    );
  else if (r.monthlyBudget === 0)
    unresolved.push(
      "Your budget ceiling is explicitly $0/month. Free-tier eligibility and usage limits must be verified; zero-cost operation is not established.",
    );
  else
    unresolved.push(
      `Your infrastructure ceiling is $${r.monthlyBudget}/month; provider and usage costs still need evaluation.`,
    );
  if (r.supabaseEligibility === "unknown")
    unresolved.push(
      "Both definitions consider Supabase for sign-in and saved records. Account, region and provider eligibility must be checked during setup; compatibility is unknown.",
    );
  if (r.language === "unknown" || r.framework === "unknown")
    unresolved.push(
      "Technology preferences are unspecified; the catalog describes TypeScript and Next.js, with no assumption that you have accepted them.",
    );
  if (r.hosting === "unknown")
    unresolved.push(
      "Hosting is undecided and will need confirmation during setup.",
    );
  if (r.existingServices)
    unresolved.push(
      "Existing services are context only. No migration or extra integration is promised: " +
        r.existingServices,
    );
  if (
    r.language !== "unknown" &&
    !["typescript", "no-preference"].includes(r.language) &&
    !r.stackIsHard
  )
    unresolved.push(
      "Your preferred language is outside the catalog; eligible definitions use TypeScript.",
    );
  if (
    r.framework !== "unknown" &&
    !["nextjs", "no-preference"].includes(r.framework) &&
    !r.stackIsHard
  )
    unresolved.push(
      "Your preferred framework is outside the catalog; eligible definitions use Next.js.",
    );
  if (r.hosting === "other" && !r.hostingIsHard)
    unresolved.push(
      "Your hosting preference has no validated adapter; only Vercel or a Node self-hosting target is described.",
    );
  const omissions: string[] = [];
  for (const field of ["billing", "uploads", "background"] as const) {
    if (r[field] === "optional" || r[field] === "no")
      omissions.push(
        `${field}: ${r[field] === "no" ? "not selected" : "optional; not guaranteed or selected automatically"}.`,
      );
  }
  const eliminated: RecommendationResult["eliminated"] = [];
  const eligible = catalog.filter((f) => {
    const reasons: string[] = [];
    reasons.push(...scope.blockers);
    const dependencyCaps: Record<string, string> = {
      sign_in: "auth",
      saved_records: "crud",
      workspaces: "teams",
      invitations: "invitations",
      private_files: "uploads",
    };
    for (const item of r.scope ?? [])
      if (item.confirmed && item.importance === "essential")
        for (const dependency of item.dependencies) {
          const cap = dependencyCaps[dependency];
          if (cap && !f.capabilities.includes(cap))
            reasons.push(
              `“${item.text}” requires ${dependencyLabels[dependency]}, absent from this definition.`,
            );
        }
    if (
      r.stackIsHard &&
      !["unknown", "typescript", "no-preference"].includes(r.language)
    )
      reasons.push(
        `Hard language requirement '${r.language}' is unsupported. Only TypeScript is defined.`,
      );
    if (
      r.stackIsHard &&
      !["unknown", "nextjs", "no-preference"].includes(r.framework)
    )
      reasons.push(
        `Hard framework requirement '${r.framework}' is unsupported. Only Next.js is defined.`,
      );
    if (
      r.accountModel !== "unknown" &&
      r.accountModel !== "either" &&
      r.accountModel !== f.accountModel
    )
      reasons.push(
        `Requires ${r.accountModel} accounts; this definition uses ${f.accountModel} accounts.`,
      );
    if (r.billing === "required")
      reasons.push(
        "Required billing is outside the current catalog. The later Stripe adapter is not supported yet.",
      );
    if (r.background === "required")
      reasons.push(
        "Required background processing is outside the current catalog.",
      );
    if (r.uploads === "required" && !f.capabilities.includes("uploads"))
      reasons.push(
        "Required uploads are absent. Uploads are defined only for the team preset; changing the account model needs your decision.",
      );
    if (r.supabaseEligibility === "ineligible")
      reasons.push(
        "Supabase is required by both definitions and is unavailable under your declared eligibility.",
      );
    if (r.hostingIsHard && r.hosting === "other")
      reasons.push("The required hosting provider is outside current support.");
    for (const hard of r.hardRequirements) {
      const capability = (
        {
          typescript: "auth",
          "next.js": "auth",
          supabase: "auth",
          uploads: "uploads",
          teams: "teams",
          crud: "crud",
          auth: "auth",
        } as Record<string, string>
      )[hard.toLowerCase()];
      if (!capability || !f.capabilities.includes(capability))
        reasons.push(
          `Hard requirement '${hard}' is not supported by this definition. Revise it explicitly to proceed.`,
        );
    }
    if (reasons.length) eliminated.push({ foundationId: f.id, reasons });
    return !reasons.length;
  });
  return RecommendationResult.parse({
    state: !eligible.length
      ? "unsupported"
      : questions.length
        ? "needs_clarification"
        : "provider_configuration_required",
    eligible,
    eliminated,
    unresolved,
    omissions,
    questions,
    rankings: [],
    message: !eligible.length
      ? "No definition meets your declared hard requirements."
      : questions.length
        ? "Answer the follow-up questions before AI ranking. Remaining definitions are provisional, not confirmed compatible."
        : "Deterministic filtering complete. Provider configuration required for AI ranking.",
    meta: null,
  });
}

export const reasonText: Record<ReasonCode, string> = {
  account_fit: "The definition matches your selected account structure.",
  stack_fit:
    "The TypeScript / Next.js definition matches your declared stack preference or flexibility.",
  private_uploads:
    "Private uploads are in the team definition; implementation and isolation checks are pending.",
  managed_services:
    "The definition uses Supabase for database and identity; you declared provider eligibility.",
  hosting_fit:
    "Your hosting choice matches the described Vercel or self-hosted Node target; deployment is unverified.",
};
export function allowedReasons(
  f: Foundation,
  input: Requirements,
): ReasonCode[] {
  const r = effectiveRequirements(input);
  return [
    ...(["either", f.accountModel].includes(r.accountModel)
      ? ["account_fit" as const]
      : []),
    ...(["typescript", "no-preference"].includes(r.language) &&
    ["nextjs", "no-preference"].includes(r.framework)
      ? ["stack_fit" as const]
      : []),
    ...(f.capabilities.includes("uploads") &&
    ["required", "optional"].includes(r.uploads)
      ? ["private_uploads" as const]
      : []),
    ...(r.supabaseEligibility === "eligible"
      ? ["managed_services" as const]
      : []),
    ...(["vercel", "self-host", "no-preference"].includes(r.hosting)
      ? ["hosting_fit" as const]
      : []),
  ];
}
export function validateModelRanking(raw: unknown, input: Requirements) {
  const filtered = filterCatalog(input);
  if (filtered.questions.length || !filtered.eligible.length)
    throw new Error("Ranking blocked by constraints or missing information");
  const ranking = ModelRanking.parse(raw);
  const ids = ranking.rankings.map((x) => x.foundationId);
  if (
    new Set(ids).size !== ids.length ||
    ids.length !== filtered.eligible.length
  )
    throw new Error("Model must rank each eligible definition exactly once");
  return ranking.rankings.map((item) => {
    const f = filtered.eligible.find((f) => f.id === item.foundationId);
    if (
      !f ||
      item.reasonCodes.some((code) => !allowedReasons(f, input).includes(code))
    )
      throw new Error(
        "Model selected an ineligible definition or unsupported explanation",
      );
    return {
      foundationId: f.id,
      explanations: [...new Set(item.reasonCodes)].map(
        (code) => reasonText[code],
      ),
    };
  });
}
