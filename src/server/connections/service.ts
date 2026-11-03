import "server-only";
import type { z } from "zod";
import {
  ConnectionAction,
  freshChecks,
  checksPassed,
} from "../../lib/connections";
import { CONNECTION_TEST_VERSION } from "../../lib/ai-contract-version";
import { analysisCases, assessAnalysisCase } from "../../lib/analysis-cases";
import { emptyRequirements } from "../../lib/idea-analysis";
import { analyzeIdea, rankFoundations } from "../ai";
import { ProviderError, safeProviderError } from "../providers/errors";
import { profileConfig, assertModel } from "./profiles";
import { discoverModels } from "./discovery";
import { recordOperationCheck } from "../providers/evidence";
import {
  disconnect,
  getSession,
  newSession,
  requireSession,
  connectionView,
  type Session,
} from "./store";
import type { ProviderStatus } from "../../lib/inference";

function current(session: Session, revision: number) {
  if (
    session.revision !== revision ||
    session.expiresAt <= Date.now() ||
    !session.connection
  )
    throw new ProviderError(
      "connection_changed",
      "The connection changed or expired during this request. Test the current selection again.",
    );
}
export function checkProfileSnapshot(session: Session | null) {
  const c = session?.connection;
  if (session && c && c.checks?.contractVersion !== CONNECTION_TEST_VERSION) {
    const hadEvidence = Boolean(c.test || session.active);
    c.test = null;
    session.active = false;
    c.checks = freshChecks();
    session.revision++;
    if (hadEvidence)
      c.issue = {
        code: "contract_changed",
        message:
          "The analysis/test contract changed. Test both idea analysis and ranking again before activating this connection.",
      };
  }
  if (!session || !c || c.profileId !== "approved-gateway") return;
  let matches = false;
  try {
    matches =
      profileConfig(c.profileId, c.config.apiKey, c.config.model).endpoint ===
      c.config.endpoint;
  } catch {
    /* Administrator approval was removed. */
  }
  if (!matches) {
    session.active = false;
    c.test = null;
    c.checks = freshChecks();
    session.revision++;
    c.issue = {
      code: "profile_changed",
      message:
        "The approved endpoint profile changed. Reconnect and test it before use; the key was not sent to the new endpoint.",
    };
  }
}
async function refresh(session: Session) {
  const revision = session.revision;
  const c = session.connection!;
  try {
    const discovered = await discoverModels(c.profileId, { ...c.config });
    current(session, revision);
    c.models = discovered.models;
    c.authentication = discovered.authentication;
    c.listing = discovered.listing;
    c.listedAt =
      discovered.listing === "listed" ? new Date().toISOString() : null;
    c.issue = null;
    if (c.config.model) {
      try {
        assertModel(c.profileId, c.config.model, c.models, c.listing);
      } catch {
        c.test = null;
        c.checks = freshChecks();
        session.active = false;
        session.revision++;
      }
    }
  } catch (error) {
    current(session, revision);
    c.issue = safeProviderError(error);
    c.listing = "failed";
    if (["authentication_failed", "access_denied"].includes(c.issue.code)) {
      c.authentication = "failed";
      c.test = null;
      c.checks = freshChecks();
      session.active = false;
    }
  }
}
export async function connectionAction(
  request: Request,
  action: z.infer<typeof ConnectionAction>,
) {
  let session: Session;
  let token: string | undefined;
  if (action.action === "disconnect") {
    const existing = getSession(request);
    if (existing) disconnect(existing);
    return { view: connectionView(existing), token };
  }
  if (action.action === "connect") {
    const config = profileConfig(action.profileId, action.apiKey);
    ({ session, token } = newSession(request));
    session.connection = {
      profileId: action.profileId,
      config,
      models: [],
      listing: "not_loaded",
      listedAt: null,
      authentication: "unknown",
      test: null,
      checks: freshChecks(),
      issue: null,
    };
    await refresh(session);
  } else {
    session = requireSession(request);
    checkProfileSnapshot(session);
    const c = session.connection!;
    if (c.issue?.code === "profile_changed")
      throw new ProviderError("profile_changed", c.issue.message);
    if (action.action === "refresh") await refresh(session);
    else if (action.action === "select") {
      if (action.model.includes(c.config.apiKey))
        throw new ProviderError(
          "unsupported_model",
          "Enter a model identifier, not a credential.",
        );
      assertModel(c.profileId, action.model, c.models, c.listing);
      if (c.config.model !== action.model) {
        c.config.model = action.model;
        c.test = null;
        c.checks = freshChecks();
        c.issue = null;
        session.active = false;
        session.revision++;
      }
    } else if (action.action === "test") {
      assertModel(c.profileId, c.config.model, c.models, c.listing);
      if (!c.config.model)
        throw new ProviderError(
          "unsupported_model",
          "Select a text model before testing.",
        );
      session.active = false;
      c.test = null;
      const revision = ++session.revision;
      const configSnapshot = { ...c.config };
      try {
        const representative: import("../../lib/contracts").Requirements = {
          ...emptyRequirements,
          idea: analysisCases.individual.idea,
          accountModel: "individual",
          billing: "no",
          uploads: "no",
          background: "no",
        };
        c.checks ??= freshChecks();
        const result =
          action.operation === "analysis"
            ? await analyzeIdea(representative, configSnapshot)
            : await rankFoundations(representative, configSnapshot);
        if (action.operation === "analysis" && "analysis" in result) {
          const assessment = assessAnalysisCase("individual", result.analysis);
          if (!assessment.extractionPassed) {
            const issue = new ProviderError(
              "invalid_output",
              "The representative idea was structurally valid but failed the extraction checks. No compatibility pass was recorded.",
            );
            issue.timing = result.meta.timing;
            if (issue.timing) {
              issue.timing.validationStage = "semantic";
              issue.timing.validationIssues = assessment.issues;
              issue.timing.classification = issue.code;
            }
            throw issue;
          }
        }
        current(session, revision);
        c.checks[action.operation] = {
          state: "passed",
          meta: result.meta,
          issue: null,
        };
        c.test = checksPassed(c.checks) ? c.checks.ranking.meta : null;
        c.authentication = "verified";
        c.issue = c.checks.analysis.issue ?? c.checks.ranking.issue;
      } catch (error) {
        current(session, revision);
        c.issue = safeProviderError(error);
        c.checks ??= freshChecks();
        c.checks[action.operation] = {
          state: "failed",
          meta: null,
          issue: c.issue,
        };
        if (
          c.issue.timing?.attempts.some((attempt) => attempt.httpStatus === 200)
        )
          c.authentication = "verified";
        if (["authentication_failed", "access_denied"].includes(c.issue.code))
          c.authentication = "failed";
      }
      await recordOperationCheck(
        configSnapshot,
        action.operation,
        CONNECTION_TEST_VERSION,
        c.checks![action.operation],
      );
    } else if (action.action === "activate") {
      if (
        !c.test ||
        !checksPassed(c.checks) ||
        c.test.requestedModel !== c.config.model
      )
        throw new ProviderError(
          "test_required",
          "Pass both representative idea-analysis and foundation-ranking checks for this exact connection and current contract before using it.",
        );
      session.active = true;
    }
  }
  return { view: connectionView(session), token };
}
export function resolveConnection(request: Request) {
  const session = getSession(request);
  checkProfileSnapshot(session);
  const c = session?.connection;
  const status: ProviderStatus = {
    provider: c?.config.provider ?? null,
    model: c?.config.model || null,
    profileId: c?.profileId,
    ready: Boolean(session?.active && c?.test && checksPassed(c.checks)),
    issue:
      session?.active && c?.test && checksPassed(c.checks)
        ? null
        : {
            code: "configuration_required",
            message:
              "Open Settings → AI connections. Connect, test a text model, then explicitly use the connection. No environment fallback is used.",
          },
  };
  return { status, config: status.ready && c ? { ...c.config } : undefined };
}
