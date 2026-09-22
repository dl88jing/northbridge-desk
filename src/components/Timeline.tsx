import type { TimelineEvent } from "../types";

function formatWhen(ts: number) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/Los_Angeles",
    }).format(new Date(ts));
  } catch {
    return new Date(ts).toLocaleString();
  }
}

export function Timeline({
  events,
}: {
  events: TimelineEvent[] | undefined;
}) {
  return (
    <div className="card">
      <h4>Timeline</h4>
      {events === undefined ? (
        <p className="muted">Loading…</p>
      ) : events.length === 0 ? (
        <p className="muted">Case activity will appear here live.</p>
      ) : (
        <ul className="timeline-list">
          {[...events].reverse().map((ev) => (
            <li className="timeline-item" key={ev._id}>
              <h5>{ev.title}</h5>
              {ev.detail && <p>{ev.detail}</p>}
              <div className="when">{formatWhen(ev.createdAt)} PT</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
