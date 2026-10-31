import { NextResponse } from "next/server";
import { Requirements, RecommendationResult } from "../../../lib/contracts";
import { filterCatalog } from "../../../lib/recommendation";
import { metaConfigured, rankWithMeta } from "../../../server/meta";

export const runtime = "nodejs";
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
  if (
    ["unsupported", "needs_clarification"].includes(result.state) ||
    !metaConfigured()
  )
    return NextResponse.json(result);
  try {
    const ranked = await rankWithMeta(parsed.data);
    return NextResponse.json(
      RecommendationResult.parse({
        ...result,
        ...ranked,
        state: "recommended",
        message:
          "Meta ranked the eligible definitions. Budget fit, generation and integration verification remain unresolved.",
      }),
    );
  } catch {
    return NextResponse.json({
      ...result,
      state: "meta_error",
      message:
        "Meta ranking failed or returned an invalid selection. No AI recommendation was accepted. Check your key, account/model access, then retry.",
    });
  }
}
