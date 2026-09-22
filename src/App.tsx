import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import type { MailCase } from "./types";
import { CaseList } from "./components/CaseList";
import { CaseDetail } from "./components/CaseDetail";

export default function App() {
  const cases = useQuery(api.cases.list, {}) as MailCase[] | undefined;
  const household = useQuery(api.cases.household, {});
  const seed = useMutation(api.seed.seedSampleCases);
  const clear = useMutation(api.seed.clearDemoData);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const selected = useMemo(() => {
    if (!cases || cases.length === 0) return null;
    const found = selectedId
      ? cases.find((c) => c._id === selectedId)
      : cases[0];
    return found ?? cases[0] ?? null;
  }, [cases, selectedId]);

  async function withBusy(label: string, fn: () => Promise<unknown>) {
    setBusy(label);
    try {
      const result = await fn();
      setToast(label);
      window.setTimeout(() => setToast(null), 3200);
      return result;
    } catch (err) {
      console.error(err);
      setToast(err instanceof Error ? err.message : "Something went wrong");
      window.setTimeout(() => setToast(null), 4200);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark" aria-hidden>
            N
          </div>
          <div>
            <h1>Northbridge Desk</h1>
            <p>
              Household mail ops for{" "}
              {(household?.adults as string[] | undefined)?.join(" & ") ??
                "Avery & Morgan"}
              . Verify claims, extract deadlines, draft and send from the case
              inbox.
            </p>
          </div>
        </div>
        <div className="top-actions">
          <button
            className="btn secondary"
            disabled={!!busy}
            onClick={() =>
              withBusy("Sample notices seeded", async () => {
                const res = await seed({});
                if (res.caseIds?.[0]) setSelectedId(String(res.caseIds[0]));
              })
            }
          >
            Demo: ingest sample notices
          </button>
          <button
            className="btn ghost"
            disabled={!!busy}
            onClick={() =>
              withBusy("Demo data cleared", async () => {
                await clear({});
                setSelectedId(null);
              })
            }
          >
            Clear cases
          </button>
        </div>
      </header>

      <div className="layout">
        <aside className="panel">
          <div className="panel-header">
            <h2>Open cases</h2>
            <span className="muted">{cases?.length ?? 0}</span>
          </div>
          <CaseList
            cases={cases}
            selectedId={selected?._id ?? null}
            onSelect={setSelectedId}
          />
        </aside>

        <main className="panel">
          {selected ? (
            <CaseDetail
              caseId={selected._id as Id<"cases">}
              mailCase={selected}
              busy={busy}
              onBusy={withBusy}
            />
          ) : (
            <div className="empty">
              <h3>No cases yet</h3>
              <p>
                Click <strong>Demo: ingest sample notices</strong> to load rent,
                insurance, and school mail for the Northbridge household.
              </p>
            </div>
          )}
        </main>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
