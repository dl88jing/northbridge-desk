import type { Evidence } from "../types";

export function EvidencePanel({
  evidence,
}: {
  evidence: Evidence[] | undefined;
}) {
  return (
    <div className="card">
      <h4>Evidence</h4>
      {evidence === undefined ? (
        <p className="muted">Loading…</p>
      ) : evidence.length === 0 ? (
        <p className="muted">
          No evidence yet. Scrape linked URLs with Firecrawl (or demo fixtures).
        </p>
      ) : (
        <ul className="evidence-list">
          {evidence.map((e) => (
            <li className="evidence-item" key={e._id}>
              <div className="chips" style={{ marginBottom: "0.35rem" }}>
                <span
                  className={`badge ${e.source === "demo" ? "demo" : ""}`}
                >
                  {e.source === "demo" ? "demo evidence" : "firecrawl"}
                </span>
              </div>
              <h5>{e.title}</h5>
              <p>{e.snippet}</p>
              {e.url !== "about:blank" && (
                <a href={e.url} target="_blank" rel="noreferrer">
                  {e.url}
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
