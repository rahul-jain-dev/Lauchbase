import { NextResponse } from "next/server";
import { ConnectionAction } from "../../../lib/connections";
import {
  connectionAction,
  checkProfileSnapshot,
} from "../../../server/connections/service";
import {
  COOKIE_NAME,
  connectionView,
  getSession,
} from "../../../server/connections/store";
import { safeProviderError } from "../../../server/providers/errors";
import { applicationOrigin, isSameOrigin } from "../../../server/request-origin";

export const runtime = "nodejs";
export const maxDuration = 180;
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store", Pragma: "no-cache" };
export async function GET(request: Request) {
  const session = getSession(request);
  checkProfileSnapshot(session);
  return NextResponse.json(connectionView(session), { headers });
}
export async function POST(request: Request) {
  if (!isSameOrigin(request))
    return NextResponse.json(
      {
        issue: {
          code: "origin_denied",
          message: "Settings changes require a same-origin request.",
        },
      },
      { status: 403, headers },
    );
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return NextResponse.json(
      {
        issue: {
          code: "invalid_request",
          message: "Settings changes require JSON.",
        },
      },
      { status: 415, headers },
    );
  const text = await request.text();
  if (text.length > 8192)
    return NextResponse.json(
      {
        issue: {
          code: "invalid_request",
          message: "Settings request is too large.",
        },
      },
      { status: 413, headers },
    );
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return NextResponse.json(
      {
        issue: {
          code: "invalid_request",
          message: "Invalid settings request.",
        },
      },
      { status: 400, headers },
    );
  }
  const parsed = ConnectionAction.safeParse(raw);
  if (!parsed.success)
    return NextResponse.json(
      {
        issue: {
          code: "invalid_request",
          message:
            "Check the selected profile, key and model. Custom destination URLs are not accepted.",
        },
      },
      { status: 400, headers },
    );
  try {
    const { view, token } = await connectionAction(request, parsed.data);
    const response = NextResponse.json(view, { headers });
    if (token)
      response.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: "strict",
        secure: applicationOrigin(request)?.startsWith("https:") === true,
        path: "/",
      });
    return response;
  } catch (error) {
    return NextResponse.json(
      { issue: safeProviderError(error) },
      { status: 400, headers },
    );
  }
}
