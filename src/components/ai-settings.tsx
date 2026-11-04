"use client";
import { AI_CLIENT_TIMEOUT_MS } from "../lib/provider-timing";
import { useRef, useState } from "react";
import {
  ConnectionView,
  connectionProfiles,
  recognizeKey,
  checksPassed,
  type ProfileId,
} from "../lib/connections";
import { inferenceLabel } from "../lib/inference";
import { DeveloperDiagnostics } from "./developer-diagnostics";

export function AISettings() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [view, setView] = useState<ConnectionView | null>(null);
  const [profile, setProfile] = useState<ProfileId | "">("");
  const [key, setKey] = useState("");
  const [search, setSearch] = useState("");
  const [manualModel, setManualModel] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const hint = recognizeKey(key);
  function changed() {
    window.dispatchEvent(new Event("ai-connection-changed"));
  }
  async function load() {
    setBusy("Loading connection…");
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/connections", { cache: "no-store" });
      if (!response.ok)
        throw new Error("Could not load this session's connection.");
      const data = ConnectionView.parse(await response.json());
      setView(data);
      if (data.issue) setError(data.issue.message);
      if (data.profileId) setProfile(data.profileId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load settings.");
    } finally {
      setBusy("");
    }
  }
  async function act(
    action: Record<string, unknown>,
    message: string,
    holdBusy = false,
  ) {
    setBusy(message);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action),
        signal: AbortSignal.timeout(AI_CLIENT_TIMEOUT_MS),
      });
      const raw = await response.json();
      if (!response.ok)
        throw new Error(raw.issue?.message ?? "Connection action failed.");
      const data = ConnectionView.parse(raw);
      setView(data);
      changed();
      if (data.issue)
        setError(
          `${data.issue.code.replaceAll("_", " ")}: ${data.issue.message}`,
        );
      else
        setNotice(
          action.action === "connect"
            ? "Key configured for this session. Select a model, then test it."
            : action.action === "test"
              ? checksPassed(data.checks)
                ? "Both representative checks passed for this contract. This is an example check, not a guarantee for every future input. Click Use this connection to activate it."
                : "Operation check finished. Both analysis and ranking must pass before activation."
              : action.action === "activate"
                ? "This connection is now active for idea analysis and foundation ranking."
                : action.action === "disconnect"
                  ? "Disconnected. No other connection will be used automatically."
                  : action.action === "refresh"
                    ? "Model information refreshed. Listed models are not automatically tested."
                    : "Model selected. Test this exact selection before using it.",
        );
      return data;
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Connection action failed. Please retry.",
      );
      changed();
      return null;
    } finally {
      if (!holdBusy) setBusy("");
      if (action.action === "connect") setKey("");
    }
  }
  async function testBoth() {
    try {
      const first = await act(
        { action: "test", operation: "analysis" },
        "Testing representative idea analysis…",
        true,
      );
      if (
        !first ||
        [
          "authentication_failed",
          "billing_quota",
          "access_denied",
          "incompatible_model",
        ].includes(first.issue?.code ?? "")
      )
        return;
      await act(
        { action: "test", operation: "ranking" },
        "Testing representative foundation ranking…",
        true,
      );
    } finally {
      setBusy("");
    }
  }
  async function changeProfile(next: ProfileId | "") {
    if (view?.keyConfigured)
      await act({ action: "disconnect" }, "Clearing the previous connection…");
    setProfile(next);
    setManualModel("");
    setSearch("");
    setNotice("");
  }
  const models =
    view?.models.filter((m) =>
      `${m.name} ${m.id}`.toLowerCase().includes(search.toLowerCase()),
    ) ?? [];
  const selected = view?.models.find((m) => m.id === view.selectedModel);
  const profileName = connectionProfiles.find(
    (p) => p.id === view?.profileId,
  )?.name;
  return (
    <>
      <button
        type="button"
        className="secondary settings-entry"
        onClick={() => {
          dialog.current?.showModal();
          void load();
        }}
      >
        Settings
      </button>
      <dialog
        ref={dialog}
        className="ai-settings"
        aria-labelledby="ai-settings-title"
        onClose={() => setKey("")}
        onCancel={() => setKey("")}
      >
        <div className="settings-heading">
          <div>
            <p className="eyebrow">SETTINGS</p>
            <h2 id="ai-settings-title">AI connections</h2>
          </div>
          <button
            type="button"
            className="secondary"
            onClick={() => dialog.current?.close()}
            aria-label="Close Settings"
          >
            Close
          </button>
        </div>
        <p className="session-note">
          Connection lasts for this session. Reconnect after the server
          restarts.
        </p>
        <p className="hint">
          Keys stay on this local server in session memory for up to 8 hours. No
          shared permanent credential storage is used. Only your explicitly
          selected provider receives your key.
        </p>
        <div className="connection-status">
          <h3>Current connection</h3>
          <p>
            {view?.keyConfigured
              ? `${profileName} · ${view.selectedModel ?? "no model selected"}`
              : "No key configured for this session"}
          </p>
          <ul>
            <li>
              Authentication:{" "}
              {view?.authentication === "verified"
                ? "verified by a protected provider request"
                : view?.authentication === "failed"
                  ? "failed"
                  : "not verified"}
            </li>
            <li>
              Models:{" "}
              {view?.listing === "listed"
                ? `${view.models.length} listed by provider`
                : view?.listing === "manual"
                  ? "listing unsupported for this approved profile; manual model ID"
                  : view?.listing === "failed"
                    ? "listing failed; retry or use the labeled manual option"
                    : "not loaded"}
            </li>
            <li>
              Tested for both operations:{" "}
              {view?.test
                ? `passed at ${new Date(view.test.calledAt).toLocaleString()}`
                : "not passed"}
            </li>
            <li>
              Idea-analysis check: {view?.checks?.analysis.state ?? "planned"}
            </li>
            <li>
              Foundation-ranking check:{" "}
              {view?.checks?.ranking.state ?? "planned"}
            </li>
            <li>
              Active for both AI operations:{" "}
              {view?.active ? "Yes — ready" : "No"}
            </li>
          </ul>
          {view?.test && (
            <small>
              Test source: {inferenceLabel(view.test)} · {view.test.model}
            </small>
          )}
          {view?.expiresAt && (
            <p className="hint">
              Server expiry: {new Date(view.expiresAt).toLocaleString()}
            </p>
          )}
        </div>
        <fieldset disabled={!!busy}>
          <label className="field">
            <span>Provider</span>
            <select
              value={profile}
              onChange={(e) =>
                void changeProfile(e.target.value as ProfileId | "")
              }
            >
              <option value="">Choose a provider</option>
              {connectionProfiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <p className="hint">
            Meta and Gemini use native adapters. OpenAI and OpenRouter use named
            Chat Completions profiles. Approved gateway uses only an
            administrator-approved endpoint; arbitrary services and URLs are not
            supported.
          </p>
          {!view?.keyConfigured ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (profile)
                  void act(
                    { action: "connect", profileId: profile, apiKey: key },
                    "Connecting and fetching models…",
                  );
              }}
            >
              <label className="field">
                <span>API key</span>
                <input
                  type="password"
                  autoComplete="off"
                  spellCheck={false}
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  maxLength={4096}
                  placeholder="Enter the selected provider's API key"
                />
              </label>
              {key && (
                <p className="hint">
                  {hint
                    ? `Key format suggests ${connectionProfiles.find((p) => p.id === hint)?.name}. This is only a hint; confirm or correct the provider above.`
                    : "Key format is ambiguous. Select the provider explicitly; we will not probe multiple services."}
                </p>
              )}
              <button
                type="submit"
                disabled={!profile || key.trim().length < 8}
              >
                Connect
              </button>
            </form>
          ) : (
            <div className="actions">
              <span className="key-indicator">
                Key configured · value hidden
              </span>
              <button
                type="button"
                className="secondary"
                onClick={() =>
                  void act(
                    { action: "disconnect" },
                    "Removing the previous key…",
                  )
                }
              >
                Replace key
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() =>
                  void act({ action: "disconnect" }, "Disconnecting…")
                }
              >
                Disconnect
              </button>
            </div>
          )}
          {view?.keyConfigured && (
            <div className="model-settings">
              <div className="section-heading">
                <h3>Select a text model</h3>
                <button
                  type="button"
                  className="secondary"
                  onClick={() =>
                    void act({ action: "refresh" }, "Refreshing models…")
                  }
                >
                  Refresh models
                </button>
              </div>
              {view.listing === "listed" && (
                <>
                  <label className="field">
                    <span>Search models</span>
                    <input
                      type="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search provider model IDs or names"
                    />
                  </label>
                  <label className="field">
                    <span>Model</span>
                    <select
                      value={view.selectedModel ?? ""}
                      onChange={(e) =>
                        void act(
                          { action: "select", model: e.target.value },
                          "Selecting model…",
                        )
                      }
                    >
                      <option value="" disabled>
                        Choose a model
                      </option>
                      {view.selectedModel &&
                        !models.some((m) => m.id === view.selectedModel) && (
                          <option value={view.selectedModel}>
                            {view.selectedModel} (current selection)
                          </option>
                        )}
                      {models.map((m) => (
                        <option
                          key={m.id}
                          value={m.id}
                          disabled={!m.selectable}
                        >
                          {m.name} — {m.id}
                          {m.selectable ? "" : " (unsupported workflow)"}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className="hint">
                    {models.length} search results. Listing a model does not
                    establish SaaSFoundation compatibility.
                  </p>
                </>
              )}
              {(view.listing === "manual" || view.listing === "failed") && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void act(
                      { action: "select", model: manualModel },
                      "Selecting manual model ID…",
                    );
                  }}
                >
                  <label className="field">
                    <span>Manual model ID — listing unavailable</span>
                    <input
                      value={manualModel}
                      onChange={(e) => setManualModel(e.target.value)}
                      placeholder="Exact text model ID from provider documentation"
                      maxLength={150}
                    />
                  </label>
                  <p className="hint">
                    This ID is not verified by a model list. Testing is required
                    before activation.
                  </p>
                  <button
                    type="submit"
                    className="secondary"
                    disabled={!manualModel}
                  >
                    Select manual model
                  </button>
                </form>
              )}
              {selected && (
                <p className="hint">
                  Text output metadata:{" "}
                  {selected.textOutput === null
                    ? "not provided"
                    : selected.textOutput
                      ? "text output listed"
                      : "no text output listed"}
                  . Structured-output metadata:{" "}
                  {selected.structuredOutput === null
                    ? "not provided; test required"
                    : selected.structuredOutput
                      ? "parameter support listed; test required"
                      : "not listed"}
                  . {selected.reason}
                </p>
              )}
              {view.models.some((m) => !m.selectable) && (
                <details>
                  <summary>Why some models are unavailable</summary>
                  <ul>
                    {view.models
                      .filter((m) => !m.selectable)
                      .map((m) => (
                        <li key={m.id}>
                          {m.name}: {m.reason}
                        </li>
                      ))}
                  </ul>
                </details>
              )}
              <p className="credit-note">
                Testing makes two API requests: representative idea analysis,
                then foundation ranking through SaaSFoundation’s real validation.
                Each may retry once for a transient failure and consume provider
                credits. Both checks must pass for this connection and contract
                version.
              </p>
              <div className="actions">
                <button
                  type="button"
                  onClick={() => void testBoth()}
                  disabled={!view.selectedModel}
                >
                  Test selected model
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void act(
                      { action: "activate" },
                      "Activating this connection…",
                    )
                  }
                  disabled={
                    !view.test || !checksPassed(view.checks) || view.active
                  }
                >
                  Use this connection
                </button>
              </div>
            </div>
          )}
        </fieldset>
        <DeveloperDiagnostics connection={view} />
        {busy && (
          <p role="status" className="inline-note">
            {busy}
          </p>
        )}
        {error && (
          <p role="alert" className="settings-error">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="settings-success">
            {notice}
          </p>
        )}
      </dialog>
    </>
  );
}
