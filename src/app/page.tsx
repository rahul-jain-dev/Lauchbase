import { Intake } from "../components/intake";
import { catalog } from "../lib/catalog";
import Link from "next/link";
export default function Page() {
  return (
    <main>
      <header className="topbar">
        <Link href="/" className="brand">
          <span className="mark">L</span> LaunchBase
        </Link>
        <span className="badge">BUILD FOR YOUR WORLD</span>
        <span className="release">Foundation explorer · 0.1</span>
      </header>
      <div className="hero">
        <p className="eyebrow">LESS GUESSWORK. A CLEARER START.</p>
        <h1>
          Your idea.
          <br />
          <span>A foundation that fits.</span>
        </h1>
        <p className="intro">
          Tell us what you’re building and what matters to you. Explore
          supported options, see the trade-offs, and understand what still needs
          work.
        </p>
        <div className="steps">
          <span>
            <b>01</b> Describe your product
          </span>
          <span>
            <b>02</b> Resolve the unknowns
          </span>
          <span>
            <b>03</b> Compare foundations
          </span>
        </div>
      </div>
      <Intake />
      <section className="catalog-section" aria-labelledby="catalog-title">
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
                  <span key={c}>{c}</span>
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
              <p className="catalog-note">
                Catalog definition · No generated or verified application yet
              </p>
            </article>
          ))}
        </div>
      </section>
      <footer>
        LaunchBase / Meta AI hackathon{" "}
        <span>Transparent choices. Observable progress.</span>
      </footer>
    </main>
  );
}
