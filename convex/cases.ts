import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { caseStatus } from "./schema";
import { appendTimeline, setCaseStatus } from "./helpers";

export const list = query({
  args: {
    status: v.optional(caseStatus),
  },
  handler: async (ctx, args) => {
    const cases = args.status
      ? await ctx.db
          .query("cases")
          .withIndex("by_status", (q) => q.eq("status", args.status!))
          .collect()
      : await ctx.db.query("cases").withIndex("by_activity").order("desc").collect();

    return cases.sort((a, b) => b.lastActivityAt - a.lastActivityAt);
  },
});

export const get = query({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.caseId);
  },
});

export const getEvidence = query({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("evidence")
      .withIndex("by_case", (q) => q.eq("caseId", args.caseId))
      .collect();
  },
});

export const getTimeline = query({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("timeline")
      .withIndex("by_case_time", (q) => q.eq("caseId", args.caseId))
      .collect();
    return rows.sort((a, b) => a.createdAt - b.createdAt);
  },
});

export const household = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("households").first();
  },
});

export const updateStatus = mutation({
  args: {
    caseId: v.id("cases"),
    status: caseStatus,
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await setCaseStatus(ctx, args.caseId, args.status, args.note);
  },
});

export const updateDraft = mutation({
  args: {
    caseId: v.id("cases"),
    to: v.string(),
    subject: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.caseId);
    if (!existing) throw new Error("Case not found");
    await ctx.db.patch(args.caseId, {
      draft: {
        to: args.to,
        subject: args.subject,
        body: args.body,
        demo: existing.draft?.demo ?? false,
        updatedAt: Date.now(),
      },
      lastActivityAt: Date.now(),
    });
    await appendTimeline(ctx, {
      caseId: args.caseId,
      kind: "draft_updated",
      title: "Draft edited",
      detail: args.subject,
    });
    if (existing.status === "reviewing" || existing.status === "new") {
      await setCaseStatus(ctx, args.caseId, "drafting", "Draft ready for review");
    }
  },
});

export const closeCase = mutation({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    await setCaseStatus(ctx, args.caseId, "closed", "Marked closed by household");
  },
});
