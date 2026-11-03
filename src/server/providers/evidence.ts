import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import { ConnectionIssue, OperationCheck } from "../../lib/connections";
import type { ProviderConfig } from "./config";
import type { z } from "zod";

export async function recordOperationCheck(
  config: ProviderConfig,
  operation: "analysis" | "ranking",
  contractVersion: string,
  check: z.infer<typeof OperationCheck>,
) {
  // Fixed fields only. No input, generated output, authorization or session identifiers.
  const issue = check.issue ? ConnectionIssue.parse(check.issue) : null;
  const report = {
    liveInference: true,
    source: "settings_session",
    operation: `settings_${operation}`,
    contractVersion,
    provider: config.provider,
    profileId: config.profileId,
    model: config.model,
    returnedModel: check.meta?.model ?? issue?.timing?.reportedModel ?? null,
    calledAt:
      check.meta?.calledAt ??
      issue?.timing?.startedAt ??
      new Date().toISOString(),
    success: check.state === "passed",
    issue,
    timing: check.meta?.timing ?? issue?.timing,
  };
  try {
    await mkdir("artifacts/provider-diagnostics", { recursive: true });
    await writeFile(
      `artifacts/provider-diagnostics/settings-${operation}-${Date.now()}.json`,
      JSON.stringify(report, null, 2),
      { flag: "wx" },
    );
  } catch {
    /* An unavailable evidence directory cannot turn inference failure into success. */
  }
}
