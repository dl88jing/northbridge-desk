import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { appendTimeline, setCaseStatus } from "./helpers";

export const markReviewing = internalMutation({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    const c = await ctx.db.get(args.caseId);
    if (!c) return;
    if (c.status === "new") {
      await setCaseStatus(ctx, args.caseId, "reviewing", "Gathering evidence");
    }
  },
});

export const addEvidence = internalMutation({
  args: {
    caseId: v.id("cases"),
    url: v.string(),
    title: v.string(),
    snippet: v.string(),
    source: v.union(v.literal("firecrawl"), v.literal("demo")),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("evidence", {
      caseId: args.caseId,
      url: args.url,
      title: args.title,
      snippet: args.snippet,
      source: args.source,
      scrapedAt: Date.now(),
    });
    await appendTimeline(ctx, {
      caseId: args.caseId,
      kind: "evidence_added",
      title:
        args.source === "demo"
          ? "Demo evidence attached"
          : "Firecrawl evidence attached",
      detail: args.title,
      meta: { url: args.url, source: args.source },
    });
  },
});

export const saveExtraction = internalMutation({
  args: {
    caseId: v.id("cases"),
    amounts: v.array(v.object({ label: v.string(), value: v.string() })),
    deadlines: v.array(v.object({ label: v.string(), date: v.string() })),
    actions: v.array(v.string()),
    summary: v.string(),
    riskFlags: v.array(v.string()),
    demo: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.caseId, {
      extracted: {
        amounts: args.amounts,
        deadlines: args.deadlines,
        actions: args.actions,
        summary: args.summary,
        demo: args.demo,
      },
      riskFlags: args.riskFlags,
      lastActivityAt: Date.now(),
    });
    await appendTimeline(ctx, {
      caseId: args.caseId,
      kind: "extraction",
      title: args.demo
        ? "Demo extraction complete"
        : "OpenAI extraction complete",
      detail: args.summary,
    });
    const c = await ctx.db.get(args.caseId);
    if (c && (c.status === "new" || c.status === "reviewing")) {
      await setCaseStatus(ctx, args.caseId, "drafting", "Ready to draft reply");
    }
  },
});

export const saveDraft = internalMutation({
  args: {
    caseId: v.id("cases"),
    to: v.string(),
    subject: v.string(),
    body: v.string(),
    demo: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.caseId, {
      draft: {
        to: args.to,
        subject: args.subject,
        body: args.body,
        demo: args.demo,
        updatedAt: Date.now(),
      },
      lastActivityAt: Date.now(),
    });
    await appendTimeline(ctx, {
      caseId: args.caseId,
      kind: "draft_created",
      title: args.demo ? "Demo draft ready" : "OpenAI draft ready",
      detail: args.subject,
    });
    await setCaseStatus(ctx, args.caseId, "drafting", "Draft awaiting approval");
  },
});

export const recordOutbound = internalMutation({
  args: {
    caseId: v.id("cases"),
    to: v.string(),
    subject: v.string(),
    body: v.string(),
    demo: v.boolean(),
    outboundId: v.optional(v.string()),
    threadId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.threadId) {
      await ctx.db.patch(args.caseId, {
        agentmailThreadId: args.threadId,
        lastActivityAt: Date.now(),
      });
    } else {
      await ctx.db.patch(args.caseId, { lastActivityAt: Date.now() });
    }
    await appendTimeline(ctx, {
      caseId: args.caseId,
      kind: "outbound",
      title: args.demo
        ? "Demo send recorded (AgentMail key not set)"
        : "Sent from the case inbox",
      detail: `To: ${args.to} · ${args.subject}`,
      meta: {
        outboundId: args.outboundId,
        demo: args.demo,
        bodyPreview: args.body.slice(0, 280),
      },
    });
    await setCaseStatus(
      ctx,
      args.caseId,
      "awaiting_reply",
      args.demo ? "Demo outbound logged" : "Waiting on reply",
    );
  },
});

export const recordInbound = internalMutation({
  args: {
    caseId: v.id("cases"),
    subject: v.string(),
    from: v.string(),
    body: v.string(),
    threadId: v.optional(v.string()),
    demo: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (args.threadId) {
      await ctx.db.patch(args.caseId, {
        agentmailThreadId: args.threadId,
        lastActivityAt: Date.now(),
      });
    }
    await appendTimeline(ctx, {
      caseId: args.caseId,
      kind: "inbound",
      title: args.demo
        ? "Demo inbound reply"
        : "Inbound reply via AgentMail webhook",
      detail: `From: ${args.from} · ${args.subject}`,
      meta: { bodyPreview: args.body.slice(0, 400), demo: args.demo ?? false },
    });
  },
});
