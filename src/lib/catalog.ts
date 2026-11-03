import { Foundation, ModuleEntry } from "./contracts";

export const catalogVersion = "0.2.0-definition";
const sources = [
  "https://nextjs.org/docs/app/getting-started/installation",
  "https://supabase.com/docs/guides/auth",
  "https://supabase.com/docs/guides/database/postgres/row-level-security",
];
export const modules = ModuleEntry.array().parse([
  {
    id: "core",
    version: "0.1.0-definition",
    purpose: "Planned web application, identity and records",
    capabilities: ["auth", "crud"],
    prerequisites: ["Supabase account", "Node.js", "pnpm"],
    incompatibleWith: ["Python-only", "Django-only", "Supabase unavailable"],
    technologies: [
      {
        name: "Next.js",
        supportedRange: "16.4.x (target; generated integration unverified)",
      },
      { name: "React", supportedRange: "19.3.x (target)" },
      { name: "TypeScript", supportedRange: "5.9.x (target)" },
      {
        name: "Supabase PostgreSQL/Auth",
        supportedRange: "Managed API; SDK not pinned yet",
      },
    ],
    limitations: [
      "No generated application exists yet",
      "No cost or capacity guarantee",
    ],
    sources,
    reviewedAt: "2026-10-31",
    verification: { state: "planned" },
  },
  {
    id: "workspaces",
    version: "0.1.0-definition",
    purpose: "Planned client workspace isolation and private files",
    capabilities: ["teams", "roles", "invitations", "uploads"],
    prerequisites: [
      "Core module",
      "Supabase private Storage",
      "Tenant isolation verification",
    ],
    incompatibleWith: ["Individual account model"],
    technologies: [
      {
        name: "Supabase Storage",
        supportedRange: "Managed API; SDK not pinned yet",
      },
    ],
    limitations: [
      "Authorization and file flows are planned, not verified",
      "No background processing",
    ],
    sources: [...sources, "https://supabase.com/docs/guides/storage"],
    reviewedAt: "2026-10-31",
    verification: { state: "planned" },
  },
]);
export const catalog = Foundation.array().parse([
  {
    id: "individual",
    version: catalogVersion,
    name: "Individual-user SaaS",
    description:
      "A focused foundation for products with independently owned accounts and records.",
    accountModel: "individual",
    moduleIds: ["core"],
    capabilities: ["auth", "crud"],
    prerequisites: [
      "Supabase eligibility and account",
      "Hosting account or self-hosted Node runtime",
    ],
    technologies: [
      "Next.js",
      "React",
      "TypeScript",
      "Supabase PostgreSQL",
      "Supabase Auth",
    ],
    limitations: [
      "No team workspaces",
      "Uploads, billing and background jobs are outside this definition",
      "Generation and integration checks are pending",
    ],
    sources,
    reviewedAt: "2026-10-31",
    maturity: "catalog_definition",
    verification: { state: "planned" },
  },
  {
    id: "team",
    version: catalogVersion,
    name: "Team / client-portal SaaS",
    description:
      "A workspace-oriented foundation for shared client projects, roles and private files.",
    accountModel: "team",
    moduleIds: ["core", "workspaces"],
    capabilities: ["auth", "crud", "teams", "roles", "invitations", "uploads"],
    prerequisites: [
      "Supabase eligibility and account",
      "Private Storage configuration when uploads are selected",
      "Two test workspaces for isolation checks",
    ],
    technologies: [
      "Next.js",
      "React",
      "TypeScript",
      "Supabase PostgreSQL",
      "Supabase Auth",
      "Supabase Storage (when selected)",
    ],
    limitations: [
      "Individual-only ownership is a different preset",
      "Billing and background jobs are outside this definition",
      "Tenant isolation and uploads are not yet implemented or verified",
      "Workspace membership does not provide project-level client permissions; project access rules require an extension and isolation tests",
    ],
    sources: [...sources, "https://supabase.com/docs/guides/storage"],
    reviewedAt: "2026-10-31",
    maturity: "catalog_definition",
    verification: { state: "planned" },
  },
]);
