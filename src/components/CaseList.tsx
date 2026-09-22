import type { MailCase } from "../types";

const STATUS_LABEL: Record<string, string> = {
  new: "new",
  reviewing: "reviewing",
  drafting: "drafting",
  awaiting_reply: "awaiting reply",
  closed: "closed",
};

export function CaseList({
  cases,
  selectedId,
  onSelect,
}: {
  cases: MailCase[] | undefined;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (cases === undefined) {
    return <div className="empty">Loading cases…</div>;
  }
  if (cases.length === 0) {
    return (
      <div className="empty">
        <p>Seed sample notices to begin.</p>
      </div>
    );
  }

  return (
    <ul className="case-list">
      {cases.map((c) => (
        <li key={c._id}>
          <button
            type="button"
            className={`case-item${selectedId === c._id ? " active" : ""}`}
            onClick={() => onSelect(c._id)}
          >
            <div className="title">{c.title}</div>
            <div className="meta">
              <span className={`badge status-${c.status}`}>
                {STATUS_LABEL[c.status] ?? c.status}
              </span>
              <span>{c.assignedTo}</span>
              <span>·</span>
              <span>{c.senderRole}</span>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
