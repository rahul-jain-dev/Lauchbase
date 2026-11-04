import { NextResponse } from "next/server";
import { Requirements } from "../../../lib/contracts";
import { AnalysisResponse } from "../../../lib/idea-analysis";
import { analyzeIdea } from "../../../server/ai";
import { resolveConnection } from "../../../server/connections/service";
import { safeProviderError } from "../../../server/providers/errors";
import { isSameOrigin } from "../../../server/request-origin";

export const runtime = "nodejs";
export const maxDuration = 180;
export async function POST(request: Request) {
  if (
    (request.headers.has("origin") && !isSameOrigin(request)) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    return NextResponse.json({ error: "Origin not allowed" }, { status: 403 });
  const text = await request.text();
  if (text.length > 20000)
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const input = Requirements.safeParse(raw);
  if (!input.success)
    return NextResponse.json(
      { error: "Check your idea and answers." },
      { status: 400 },
    );
  const { status: activeProvider, config } = resolveConnection(request);
  if (!activeProvider.ready)
    return NextResponse.json({
      state: "provider_configuration_required",
      analysis: null,
      meta: null,
      activeProvider,
    });
  try {
    return NextResponse.json(
      AnalysisResponse.parse({
        state: "analyzed",
        ...(await analyzeIdea(input.data, config)),
        activeProvider,
      }),
    );
  } catch (error) {
    return NextResponse.json({
      state: "provider_error",
      analysis: null,
      meta: null,
      activeProvider: { ...activeProvider, issue: safeProviderError(error) },
    });
  }
}
