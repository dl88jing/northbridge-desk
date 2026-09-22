import { v } from "convex/values";
import { internalQuery } from "./_generated/server";

export const getCase = internalQuery({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.caseId);
  },
});

export const getEvidenceForCase = internalQuery({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("evidence")
      .withIndex("by_case", (q) => q.eq("caseId", args.caseId))
      .collect();
  },
});

export const findCaseByThread = internalQuery({
  args: { threadId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("cases")
      .withIndex("by_thread", (q) => q.eq("agentmailThreadId", args.threadId))
      .first();
  },
});

export const findCaseByInbox = internalQuery({
  args: { inboxId: v.string() },
  handler: async (ctx, args) => {
    const open = await ctx.db
      .query("cases")
      .withIndex("by_activity")
      .order("desc")
      .collect();
    return (
      open.find(
        (c) =>
          c.agentmailInboxId === args.inboxId && c.status !== "closed",
      ) ?? null
    );
  },
});
