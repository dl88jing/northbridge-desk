import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

export type CaseStatus =
  | "new"
  | "reviewing"
  | "drafting"
  | "awaiting_reply"
  | "closed";

export type TimelineKind =
  | "notice_received"
  | "status_change"
  | "evidence_added"
  | "extraction"
  | "draft_created"
  | "draft_updated"
  | "outbound"
  | "inbound"
  | "note";

export async function appendTimeline(
  ctx: MutationCtx,
  args: {
    caseId: Id<"cases">;
    kind: TimelineKind;
    title: string;
    detail?: string;
    meta?: unknown;
  },
) {
  const createdAt = Date.now();
  await ctx.db.insert("timeline", {
    caseId: args.caseId,
    kind: args.kind,
    title: args.title,
    detail: args.detail,
    meta: args.meta,
    createdAt,
  });
  await ctx.db.patch(args.caseId, { lastActivityAt: createdAt });
}

export async function setCaseStatus(
  ctx: MutationCtx,
  caseId: Id<"cases">,
  status: CaseStatus,
  note?: string,
) {
  const existing = await ctx.db.get(caseId);
  if (!existing) throw new Error("Case not found");
  if (existing.status === status) return;
  await ctx.db.patch(caseId, { status, lastActivityAt: Date.now() });
  await appendTimeline(ctx, {
    caseId,
    kind: "status_change",
    title: `Status → ${status.replace(/_/g, " ")}`,
    detail: note,
  });
}

/** True when a real provider key is configured (not empty / demo placeholder). */
export function hasLiveKey(name: string): boolean {
  const value = process.env[name];
  if (!value || value.trim() === "") return false;
  const lower = value.toLowerCase();
  if (
    lower === "demo" ||
    lower === "placeholder" ||
    lower.startsWith("sk-demo") ||
    lower.startsWith("fc-demo") ||
    lower.includes("replace") ||
    lower.includes("your_") ||
    lower.includes("xxx")
  ) {
    return false;
  }
  return true;
}
