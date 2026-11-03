import "server-only";
import { createHash, randomBytes } from "node:crypto";
import type {
  ConnectionView,
  ListedModel,
  ProfileId,
} from "../../lib/connections";
import type { InferenceEvidence } from "../../lib/inference";
import type { ProviderConfig } from "../providers/config";
import { ProviderError } from "../providers/errors";
import { checksPassed, type ConnectionChecks } from "../../lib/connections";

export const COOKIE_NAME = "launchbase_ai_session";
export const SESSION_TTL = 8 * 60 * 60 * 1000;
export type Session = {
  expiresAt: number;
  revision: number;
  active: boolean;
  connection?: {
    profileId: ProfileId;
    config: ProviderConfig;
    models: ListedModel[];
    listing: ConnectionView["listing"];
    listedAt: string | null;
    authentication: ConnectionView["authentication"];
    test: InferenceEvidence | null;
    checks?: ConnectionChecks;
    issue: ConnectionView["issue"];
  };
};
type Memory = {
  sessions: Map<string, Session>;
  timer?: ReturnType<typeof setInterval>;
};
const root = globalThis as typeof globalThis & {
  launchbaseAIConnections?: Memory;
};
const memory: Memory = (root.launchbaseAIConnections ??= {
  sessions: new Map(),
});
const hash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export function cleanupSessions(now = Date.now()) {
  for (const [id, session] of memory.sessions)
    if (session.expiresAt <= now) {
      disconnect(session);
      memory.sessions.delete(id);
    }
}
if (!memory.timer) {
  memory.timer = setInterval(cleanupSessions, 60000);
  memory.timer.unref();
}
export function sessionToken(request: Request) {
  const token = request.headers
    .get("cookie")
    ?.split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);
  return token && /^[a-zA-Z0-9_-]{43}$/.test(token) ? token : null;
}
export function getSession(request: Request): Session | null {
  cleanupSessions();
  const token = sessionToken(request);
  return token ? (memory.sessions.get(hash(token)) ?? null) : null;
}
export function newSession(request: Request): {
  token: string;
  session: Session;
} {
  cleanupSessions();
  const old = sessionToken(request);
  if (old) {
    const s = memory.sessions.get(hash(old));
    if (s) disconnect(s);
    memory.sessions.delete(hash(old));
  }
  if (memory.sessions.size >= 200)
    throw new ProviderError(
      "temporary_failure",
      "The local server has reached its session limit. Try again later.",
    );
  const token = randomBytes(32).toString("base64url");
  const session: Session = {
    expiresAt: Date.now() + SESSION_TTL,
    revision: 0,
    active: false,
  };
  memory.sessions.set(hash(token), session);
  return { token, session };
}
export function requireSession(request: Request) {
  const session = getSession(request);
  if (!session?.connection)
    throw new ProviderError(
      "session_expired",
      "No connection is available for this session. Open Settings → AI connections and reconnect. The server may have restarted.",
    );
  return session;
}
export function disconnect(session: Session) {
  if (session.connection) session.connection.config.apiKey = "";
  session.connection = undefined;
  session.active = false;
  session.revision++;
}
export function connectionView(session: Session | null): ConnectionView {
  const c = session?.connection;
  return {
    profileId: c?.profileId ?? null,
    keyConfigured: Boolean(c?.config.apiKey),
    expiresAt: session ? new Date(session.expiresAt).toISOString() : null,
    authentication: c?.authentication ?? "unknown",
    models: c?.models ?? [],
    listing: c?.listing ?? "not_loaded",
    listedAt: c?.listedAt ?? null,
    selectedModel: c?.config.model || null,
    active: Boolean(session?.active && c?.test && checksPassed(c.checks)),
    test: checksPassed(c?.checks) ? (c?.test ?? null) : null,
    checks: c?.checks ?? null,
    issue: c?.issue ?? null,
  };
}
