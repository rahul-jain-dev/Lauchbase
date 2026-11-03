import { NextResponse } from "next/server";
import { resolveConnection } from "../../../server/connections/service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  return NextResponse.json(resolveConnection(request).status, {
    headers: { "Cache-Control": "no-store" },
  });
}
