"use client";
import { useState } from "react";
import {
  ScopeCategory,
  categoryLabels,
  dependencyLabels,
  type ScopeRequirement,
  nextScopeId,
} from "../lib/scope";
import type { Proposal } from "../lib/idea-analysis";

function ScopeFields({
  item,
  change,
}: {
  item: ScopeRequirement;
  change: (item: ScopeRequirement) => void;
}) {
  return (
    <>
      <div className="form-grid">
        <label className="field">
          Requirement category
          <select
            value={item.category}
            onChange={(e) =>
              change({ ...item, category: ScopeCategory.parse(e.target.value) })
            }
          >
            {Object.entries(categoryLabels).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Importance
          <select
            value={item.importance}
            onChange={(e) =>
              change({
                ...item,
                importance: e.target.value as ScopeRequirement["importance"],
              })
            }
          >
            <option value="essential">Essential</option>
            <option value="optional">Nice to have</option>
            <option value="unknown">Needs a decision</option>
          </select>
        </label>
      </div>
      {item.category === "technical_constraint" && (
        <label className="field">
          Technical requirement
          <select
            value={item.constraint ?? "other"}
            onChange={(e) =>
              change({
                ...item,
                constraint: e.target.value as ScopeRequirement["constraint"],
              })
            }
          >
            <option value="other">
              Needs clarification / other constraint
            </option>
            <option value="typescript_only">TypeScript only</option>
            <option value="nextjs_only">Next.js only</option>
            <option value="python_only">Python only</option>
            <option value="self_host_only">Self-hosted Node.js only</option>
          </select>
        </label>
      )}
      <fieldset className="dependency-options">
        <legend>Infrastructure and security this need depends on</legend>
        {Object.entries(dependencyLabels).map(([key, label]) => (
          <label key={key}>
            <input
              type="checkbox"
              checked={item.dependencies.includes(key as never)}
              onChange={(e) =>
                change({
                  ...item,
                  dependencies: e.target.checked
                    ? [
                        ...item.dependencies.filter(
                          (v) => v !== "unknown" || key === "unknown",
                        ),
                        key as ScopeRequirement["dependencies"][number],
                      ]
                    : item.dependencies.filter((v) => v !== key),
                })
              }
            />
            {label}
          </label>
        ))}
      </fieldset>
    </>
  );
}
function ProposalCard({
  proposal,
  confirm,
}: {
  proposal: Proposal;
  confirm: (item: ScopeRequirement) => void;
}) {
  const [item, setItem] = useState<ScopeRequirement>({
    id: `proposal-${proposal.value.length}`,
    text: proposal.value,
    originalText: proposal.value,
    category: proposal.category ?? "unresolved",
    importance: proposal.essential ? "essential" : "optional",
    dependencies: proposal.dependencies ?? ["unknown"],
    source: "model",
    excerpt: proposal.excerpt,
    confirmed: false,
  });
  return (
    <article className="proposal">
      <h3>{item.text}</h3>
      <p>
        Proposed interpretation — review its category, importance and
        dependencies independently.
      </p>
      {item.excerpt && <blockquote>“{item.excerpt}”</blockquote>}
      <ScopeFields item={item} change={setItem} />
      <button
        type="button"
        className="secondary"
        onClick={() => confirm({ ...item, confirmed: true })}
      >
        Confirm this scope item
      </button>
    </article>
  );
}
function ScopeItemEditor({
  item,
  save,
  remove,
}: {
  item: ScopeRequirement;
  save: (next: ScopeRequirement) => void;
  remove: () => void;
}) {
  const [draft, setDraft] = useState(item);
  return (
    <article className="scope-item">
      <label className="field">
        Confirmed requirement
        <input
          value={draft.text}
          maxLength={200}
          onChange={(e) => setDraft({ ...draft, text: e.target.value })}
        />
      </label>
      <ScopeFields item={draft} change={setDraft} />
      {item.excerpt && (
        <details>
          <summary>Original supporting excerpt</summary>
          <blockquote>“{item.excerpt}”</blockquote>
        </details>
      )}
      <p className="hint">
        {item.importance === "essential"
          ? "Essential need retained"
          : "Importance recorded"}{" "}
        · {categoryLabels[item.category]} · confirmed by you
      </p>
      <div className="actions">
        <button
          className="secondary"
          type="button"
          disabled={draft.text.trim().length < 3}
          onClick={() =>
            save({
              ...draft,
              source: "user",
              originalText: item.originalText ?? item.text,
              text: draft.text.trim(),
            })
          }
        >
          Save requirement changes
        </button>
        <button className="secondary" type="button" onClick={remove}>
          Remove requirement
        </button>
      </div>
    </article>
  );
}
export function ScopeReview({
  items,
  proposals,
  change,
}: {
  items: ScopeRequirement[];
  proposals: Proposal[];
  change: (items: ScopeRequirement[]) => void;
}) {
  const [draft, setDraft] = useState<ScopeRequirement>({
    id: "draft",
    text: "",
    category: "product_workflow",
    importance: "essential",
    dependencies: ["unknown"],
    source: "user",
    excerpt: null,
    confirmed: true,
  });
  return (
    <section className="scope-review">
      <h3>Product scope and starter coverage</h3>
      <p>
        Essential business workflows remain essential custom work. Their
        infrastructure, integrations and security dependencies still need to
        fit; a database alone does not implement a workflow.
      </p>
      {proposals
        .filter(
          (p) =>
            !items.some(
              (s) => s.text === p.value || s.originalText === p.value,
            ),
        )
        .map((p, i) => (
          <ProposalCard
            key={`${p.value}-${i}`}
            proposal={p}
            confirm={(item) =>
              change([...items, { ...item, id: nextScopeId(items) }])
            }
          />
        ))}
      {items.map((item, i) => (
        <ScopeItemEditor
          key={JSON.stringify(item)}
          item={item}
          save={(next) => change(items.map((s, j) => (j === i ? next : s)))}
          remove={() => change(items.filter((_, j) => j !== i))}
        />
      ))}
      <details>
        <summary>
          Add a product workflow, capability, integration or constraint manually
        </summary>
        <label className="field">
          Additional scope requirement
          <input
            value={draft.text}
            maxLength={200}
            onChange={(e) => setDraft({ ...draft, text: e.target.value })}
          />
        </label>
        <ScopeFields item={draft} change={setDraft} />
        <button
          type="button"
          className="secondary"
          disabled={draft.text.trim().length < 3 || items.length >= 30}
          onClick={() => {
            change([
              ...items,
              { ...draft, id: `manual-${Date.now()}`, text: draft.text.trim() },
            ]);
            setDraft({ ...draft, text: "" });
          }}
        >
          Add confirmed requirement
        </button>
      </details>
    </section>
  );
}
