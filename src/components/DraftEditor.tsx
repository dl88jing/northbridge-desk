export function DraftEditor({
  to,
  subject,
  body,
  demo,
  busy,
  onChange,
  onSave,
  onApprove,
  onSimulateInbound,
}: {
  to: string;
  subject: string;
  body: string;
  demo?: boolean;
  busy: boolean;
  onChange: {
    setTo: (v: string) => void;
    setSubject: (v: string) => void;
    setBody: (v: string) => void;
  };
  onSave: () => void;
  onApprove: () => void;
  onSimulateInbound: () => void;
}) {
  return (
    <div className="card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "0.75rem",
          alignItems: "center",
          marginBottom: "0.75rem",
        }}
      >
        <h4 style={{ margin: 0 }}>Reply draft</h4>
        {demo && <span className="badge demo">demo draft</span>}
      </div>
      <div className="field">
        <label htmlFor="draft-to">To</label>
        <input
          id="draft-to"
          value={to}
          onChange={(e) => onChange.setTo(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="draft-subject">Subject</label>
        <input
          id="draft-subject"
          value={subject}
          onChange={(e) => onChange.setSubject(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="draft-body">Body</label>
        <textarea
          id="draft-body"
          value={body}
          onChange={(e) => onChange.setBody(e.target.value)}
        />
      </div>
      <div className="action-row">
        <button className="btn secondary" disabled={busy || !body} onClick={onSave}>
          Save edits
        </button>
        <button className="btn" disabled={busy || !body} onClick={onApprove}>
          Approve & send
        </button>
        <button
          className="btn ghost"
          disabled={busy}
          onClick={onSimulateInbound}
        >
          Simulate inbound reply
        </button>
      </div>
      <p className="muted" style={{ marginTop: "0.75rem" }}>
        Approve sends from the case inbox via AgentMail when keys are set.
        Without keys, the desk records a labeled demo send so the timeline still
        advances to awaiting reply.
      </p>
    </div>
  );
}
