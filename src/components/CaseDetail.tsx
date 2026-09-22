import { useEffect, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { Evidence, MailCase, TimelineEvent } from "../types";
import { EvidencePanel } from "./EvidencePanel";
import { Timeline } from "./Timeline";
import { DraftEditor } from "./DraftEditor";

export function CaseDetail({
  caseId,
  mailCase,
  busy,
  onBusy,
}: {
  caseId: Id<"cases">;
  mailCase: MailCase;
  busy: string | null;
  onBusy: (label: string, fn: () => Promise<unknown>) => Promise<unknown>;
}) {
  const evidence = useQuery(api.cases.getEvidence, { caseId }) as
    | Evidence[]
    | undefined;
  const timeline = useQuery(api.cases.getTimeline, { caseId }) as
    | TimelineEvent[]
    | undefined;

  const processCase = useAction(api.pipeline.processCase);
  const scrape = useAction(api.scrape.scrapeCaseLinks);
  const extract = useAction(api.extract.extractAndDraft);
  const approve = useAction(api.mail.approveAndSend);
  const simulateInbound = useMutation(api.mail.simulateInboundReply);
  const updateDraft = useMutation(api.cases.updateDraft);
  const closeCase = useMutation(api.cases.closeCase);

  const [draftTo, setDraftTo] = useState(mailCase.draft?.to ?? "");
  const [draftSubject, setDraftSubject] = useState(
    mailCase.draft?.subject ?? "",
  );
  const [draftBody, setDraftBody] = useState(mailCase.draft?.body ?? "");

  useEffect(() => {
    setDraftTo(mailCase.draft?.to ?? mailCase.senderName);
    setDraftSubject(mailCase.draft?.subject ?? `Re: ${mailCase.subject}`);
    setDraftBody(mailCase.draft?.body ?? "");
  }, [mailCase._id, mailCase.draft?.updatedAt]);

  const extracted = mailCase.extracted;

  return (
    <div className="detail">
      <div className="detail-hero">
        <div className="chips">
          <span className={`badge status-${mailCase.status}`}>
            {mailCase.status.replace(/_/g, " ")}
          </span>
          <span className="badge">{mailCase.category}</span>
          {mailCase.riskFlags.map((flag) => (
            <span className="badge risk" key={flag}>
              {flag}
            </span>
          ))}
          {extracted?.demo && <span className="badge demo">demo extract</span>}
          {mailCase.draft?.demo && (
            <span className="badge demo">demo draft</span>
          )}
        </div>
        <h3>{mailCase.title}</h3>
        <p className="detail-sub">
          {mailCase.senderName} · assigned to {mailCase.assignedTo}
        </p>
        <div className="action-row">
          <button
            className="btn"
            disabled={!!busy}
            onClick={() =>
              onBusy("Processed: scrape + extract + draft", () =>
                processCase({ caseId }),
              )
            }
          >
            Run full pipeline
          </button>
          <button
            className="btn secondary"
            disabled={!!busy}
            onClick={() =>
              onBusy("Evidence refreshed", () => scrape({ caseId }))
            }
          >
            Scrape links
          </button>
          <button
            className="btn secondary"
            disabled={!!busy}
            onClick={() =>
              onBusy("Extraction + draft ready", () => extract({ caseId }))
            }
          >
            Extract & draft
          </button>
          <button
            className="btn ghost"
            disabled={!!busy || mailCase.status === "closed"}
            onClick={() => onBusy("Case closed", () => closeCase({ caseId }))}
          >
            Close case
          </button>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h4>Notice</h4>
          <p className="detail-sub" style={{ marginBottom: "0.75rem" }}>
            <strong>{mailCase.subject}</strong>
          </p>
          <div className="notice-body">{mailCase.bodyText}</div>
          {mailCase.linkedUrls.length > 0 && (
            <div style={{ marginTop: "0.9rem" }}>
              <div className="muted" style={{ marginBottom: "0.35rem" }}>
                Linked URLs
              </div>
              {mailCase.linkedUrls.map((url) => (
                <div key={url}>
                  <a href={url} target="_blank" rel="noreferrer">
                    {url}
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h4>Extracted facts</h4>
          {!extracted ? (
            <p className="muted">
              Run the pipeline to pull amounts, deadlines, and asked actions.
            </p>
          ) : (
            <div className="kv">
              <p style={{ margin: "0 0 0.5rem", lineHeight: 1.45 }}>
                {extracted.summary}
              </p>
              {extracted.amounts.map((a) => (
                <div className="kv-row" key={a.label}>
                  <span>{a.label}</span>
                  <span>{a.value}</span>
                </div>
              ))}
              {extracted.deadlines.map((d) => (
                <div className="kv-row" key={d.label}>
                  <span>{d.label}</span>
                  <span>{d.date}</span>
                </div>
              ))}
              {extracted.actions.length > 0 && (
                <ul style={{ margin: "0.4rem 0 0", paddingLeft: "1.1rem" }}>
                  {extracted.actions.map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid-2">
        <EvidencePanel evidence={evidence} />
        <Timeline events={timeline} />
      </div>

      <DraftEditor
        to={draftTo}
        subject={draftSubject}
        body={draftBody}
        demo={mailCase.draft?.demo}
        busy={!!busy}
        onChange={{ setTo: setDraftTo, setSubject: setDraftSubject, setBody: setDraftBody }}
        onSave={() =>
          onBusy("Draft saved", () =>
            updateDraft({
              caseId,
              to: draftTo,
              subject: draftSubject,
              body: draftBody,
            }),
          )
        }
        onApprove={() =>
          onBusy("Approved — sent from the case inbox", async () => {
            await updateDraft({
              caseId,
              to: draftTo,
              subject: draftSubject,
              body: draftBody,
            });
            return approve({ caseId });
          })
        }
        onSimulateInbound={() =>
          onBusy("Simulated inbound reply", () =>
            simulateInbound({ caseId }),
          )
        }
      />
    </div>
  );
}
