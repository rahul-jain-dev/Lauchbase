import { NextResponse } from "next/server";
import { Requirements, RecommendationResult } from "../../../lib/contracts";
import { filterCatalog } from "../../../lib/recommendation";
import { rankFoundations } from "../../../server/ai";
import { resolveConnection } from "../../../server/connections/service";
import { safeProviderError } from "../../../server/providers/errors";

export const runtime = "nodejs";
export const maxDuration = 180;
export async function POST(request: Request) {
  if (
    request.headers.get("origin") &&
    request.headers.get("origin") !== new URL(request.url).origin
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
  const parsed = Requirements.safeParse(raw);
  if (!parsed.success)
    return NextResponse.json(
      {
        error: "Check your intake answers.",
        details: parsed.error.issues.map(
          (i) => `${i.path.join(".")}: ${i.message}`,
        ),
      },
      { status: 400 },
    );
  const result = filterCatalog(parsed.data);
  const { status: activeProvider, config } = resolveConnection(request);
  if (
    ["unsupported", "needs_clarification"].includes(result.state) ||
    !activeProvider.ready
  )
    return NextResponse.json({ ...result, activeProvider });
  try {
    const ranked = await rankFoundations(parsed.data, config);
    return NextResponse.json(
      RecommendationResult.parse({
        ...result,
        ...ranked,
        activeProvider,
        state: "recommended",
        message:
          "The selected provider ranked the eligible definitions. Budget fit, generation and integration verification remain unresolved.",
      }),
    );
  } catch (error) {
    return NextResponse.json({
      ...result,
      state: "provider_error",
      activeProvider: { ...activeProvider, issue: safeProviderError(error) },
      message:
        "The selected provider failed or returned an invalid selection. No AI recommendation was accepted. Review the provider error and retry.",
    });
  }
}
