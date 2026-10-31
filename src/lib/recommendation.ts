import { catalog } from "./catalog";
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
  return r;
}

export function filterCatalog(input: Requirements): RecommendationResult {
  const r = effectiveRequirements(Requirements.parse(input));
  const uploadsNeedClarification =
    r.hardRequirements.some((h) => h.toLowerCase() === "uploads") &&
    r.uploads !== "required";
  const questions: RecommendationResult["questions"] = [];
  const ask = (id: string, fields: string[], question: string) =>
    questions.push({ id, fields, question });
  if (
    r.experience === "unknown" ||
    r.language === "unknown" ||
    r.framework === "unknown"
  )
    ask(
      "stack",
      ["experience", "language", "framework"],
      "What is your experience and preferred language/framework? Choose no preference if flexible.",
    );
  if (r.accountModel === "unknown")
    ask(
      "accounts",
      ["accountModel"],
      "Will records belong to individual users or shared team workspaces? Either is also an explicit choice.",
    );
  if (
    [r.billing, r.uploads, r.background].includes("unknown") ||
    uploadsNeedClarification
  )
    ask(
      "capabilities",
      ["billing", "uploads", "background"],
      uploadsNeedClarification
        ? "You listed uploads as a hard requirement. Select Required for file uploads, or remove that hard requirement, to resolve the conflicting answers."
        : "Are billing, uploads and background jobs required, optional, or unnecessary?",
    );
  if (r.monthlyBudget === null || r.hosting === "unknown")
    ask(
      "operations",
      ["monthlyBudget", "hosting"],
      "What is your monthly infrastructure ceiling in USD, and where would you like to host?",
    );
  if (!r.country || r.supabaseEligibility === "unknown")
    ask(
      "eligibility",
      ["country", "supabaseEligibility"],
      "Which country will you operate from, and can you use Supabase under your account and regional requirements?",
    );

  const unresolved = [
    "Catalog definitions only: generated applications and integrations have not been implemented or verified.",
    "Budget fit is unverified: usage, provider plans and current pricing must be evaluated before choosing a foundation.",
  ];
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
        : "meta_configuration_required",
    eligible,
    eliminated,
    unresolved,
    omissions,
    questions,
    rankings: [],
    message: !eligible.length
      ? "No definition meets your declared hard requirements."
      : questions.length
        ? "Answer the follow-up questions before Meta ranking. Remaining definitions are provisional, not confirmed compatible."
        : "Deterministic filtering complete. Meta configuration required for AI ranking.",
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
