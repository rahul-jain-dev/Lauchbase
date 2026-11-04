import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import { z } from "zod";
import { Requirements } from "../../../lib/contracts";
import { analyzeIdea } from "../../../server/ai";
import { resolveConnection } from "../../../server/connections/service";
import { requestStructured } from "../../../server/providers";
import { safeProviderError } from "../../../server/providers/errors";
import {
  analysisCaseIds,
  analysisCases,
  assessAnalysisCase,
} from "../../../lib/analysis-cases";
import { emptyRequirements } from "../../../lib/idea-analysis";
import { ANALYSIS_CONTRACT_VERSION } from "../../../lib/ai-contract-version";
import { checkProfileSnapshot } from "../../../server/connections/service";
import { requireSession } from "../../../server/connections/store";
import { assertModel } from "../../../server/connections/profiles";
import { isSameOrigin } from "../../../server/request-origin";

export const runtime = "nodejs";
export const maxDuration = 180;
const Input = z.union([
  z
    .object({
      operation: z.enum(["minimal", "analysis"]),
      requirements: Requirements,
    })
    .strict(),
  z
    .object({
      operation: z.literal("analysis_case"),
      caseId: z.enum(analysisCaseIds),
    })
    .strict(),
]);
const headers = { "Cache-Control": "no-store" };
export async function POST(request: Request) {
  if (!isSameOrigin(request))
    return NextResponse.json(
      { error: "A same-origin request is required." },
      { status: 403, headers },
    );
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return NextResponse.json(
      { error: "JSON required." },
      { status: 415, headers },
    );
  const text = await request.text();
  if (text.length > 22000)
    return NextResponse.json(
      { error: "Request too large." },
      { status: 413, headers },
    );
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400, headers },
    );
  }
  const parsed = Input.safeParse(raw);
  if (!parsed.success)
    return NextResponse.json(
      { error: "Check your idea and answers." },
      { status: 400, headers },
    );
  let { config } = resolveConnection(request);
  if (parsed.data.operation === "analysis_case") {
    try {
      const session = requireSession(request);
      checkProfileSnapshot(session);
      const c = session.connection!;
      if (c.issue?.code === "profile_changed")
        throw new Error("profile changed");
      assertModel(c.profileId, c.config.model, c.models, c.listing);
      if (!c.config.model) throw new Error("no selection");
      config = { ...c.config };
    } catch {
      return NextResponse.json(
        {
          error:
            "Select a configured connection in Settings first. No other connection was used.",
        },
        { status: 409, headers },
      );
    }
  }
  if (!config)
    return NextResponse.json(
      {
        error:
          "Use a tested connection in Settings first. No fallback was used.",
      },
      { status: 409, headers },
    );
  const start = Date.now();
  let assessment: ReturnType<typeof assessAnalysisCase> | null = null;
  let timing,
    issue = null,
    returnedModel: string | null = null;
  try {
    const result =
      parsed.data.operation === "minimal"
        ? await requestStructured(
            z.object({ ok: z.boolean() }).strict(),
            "MinimalStructuredCheck",
            "Return JSON with ok=true. This is a small structured-output compatibility and timing check.",
            {},
            config,
          )
        : await analyzeIdea(
            parsed.data.operation === "analysis_case"
              ? {
                  ...emptyRequirements,
                  idea: analysisCases[parsed.data.caseId].idea,
                }
              : parsed.data.requirements,
            config,
          );
    if (parsed.data.operation === "analysis_case" && "analysis" in result)
      assessment = assessAnalysisCase(parsed.data.caseId, result.analysis);
    timing = result.meta.timing;
    returnedModel = result.meta.model;
  } catch (error) {
    const safe = safeProviderError(error);
    timing = "timing" in safe ? safe.timing : undefined;
    returnedModel = timing?.reportedModel ?? null;
    issue = { code: safe.code, message: safe.message };
  }
  // Allowlisted telemetry only. No prompts, output, keys, endpoints, cookies or session identifiers.
  const report = {
    liveInference: true,
    source: "settings_session",
    operation: parsed.data.operation,
    caseId:
      parsed.data.operation === "analysis_case"
        ? parsed.data.caseId
        : undefined,
    contractVersion: ANALYSIS_CONTRACT_VERSION,
    assessment,
    provider: config.provider,
    profileId: config.profileId,
    model: config.model,
    returnedModel,
    calledAt: new Date(start).toISOString(),
    elapsedMs: Date.now() - start,
    success: !issue,
    issue,
    timing,
  };
  let recorded = false;
  try {
    await mkdir("artifacts/provider-diagnostics", { recursive: true });
    await writeFile(
      `artifacts/provider-diagnostics/${parsed.data.operation}-${start}.json`,
      JSON.stringify(report, null, 2),
      { flag: "wx" },
    );
    recorded = true;
  } catch {
    /* Inference evidence is still returned if this local server cannot write the report. */
  }
  return NextResponse.json({ ...report, recorded }, { headers });
}
