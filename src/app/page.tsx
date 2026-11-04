import { Intake } from "../components/intake";
import { catalog } from "../lib/catalog";
import { capabilityLabels } from "../lib/idea-analysis";
import Link from "next/link";
import { AISettings } from "../components/ai-settings";
export default function Page() {
  return (
    <main>
      <header className="topbar">
        <Link href="/" className="brand">
          <span className="mark">S</span> SaaSFoundation
        </Link>
        <span className="badge">BUILD FOR YOUR WORLD</span>
        <span className="release">Foundation architect · prototype</span>
        <AISettings />
      </header>
      <div className="hero">
        <p className="eyebrow">LESS GUESSWORK. A CLEARER START.</p>
        <h1>
          From an idea
          <br />
          <span>to a buildable foundation.</span>
        </h1>
        <p className="intro">
          Review what your micro-SaaS needs, compare supported foundations, and
          understand how the pieces connect. A clear starting plan for
          freelancers, founders and first-time builders.
        </p>
        <div className="steps">
          <span>
            <b>01</b> Describe your product
          </span>
          <span>
            <b>02</b> Confirm requirements
          </span>
          <span>
            <b>03</b> Explore your foundation
          </span>
        </div>
      </div>
      <Intake />
      <details className="catalog-section">
        <summary>
          Explore the two foundation definitions & their sources
        </summary>
        <div className="section-heading">
          <div>
            <p className="eyebrow">A SMALL, TRANSPARENT CATALOG</p>
            <h2 id="catalog-title">Two starting points. Clear boundaries.</h2>
          </div>
          <span className="badge">DEFINITIONS ONLY</span>
        </div>
        <div className="catalog-grid">
          {catalog.map((f, i) => (
            <article className="catalog-card" key={f.id}>
              <span className="card-number">
                0{i + 1} / {f.version}
              </span>
              <h3>{f.name}</h3>
              <p>{f.description}</p>
              <div className="tags">
                {f.capabilities.map((c) => (
                  <span key={c}>{capabilityLabels[c] ?? c}</span>
                ))}
              </div>
              <details>
                <summary>Scope, prerequisites & sources</summary>
                <h4>Planned technologies</h4>
                <p>{f.technologies.join(" · ")}</p>
                <h4>Prerequisites</h4>
                <ul>
                  {f.prerequisites.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
                <h4>Limitations</h4>
                <ul>
                  {f.limitations.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
                {f.sources.map((s, j) => (
                  <a
                    className="source"
                    href={s}
                    key={s}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Official reference {j + 1} ↗
                  </a>
                ))}
                <p>Reviewed {f.reviewedAt} · Verification planned</p>
              </details>
            </article>
          ))}
        </div>
      </details>
      <footer>
        SaaSFoundation / Meta AI hackathon{" "}
        <span>Transparent choices. Observable progress.</span>
      </footer>
    </main>
  );
}
