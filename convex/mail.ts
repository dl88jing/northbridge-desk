import { v } from "convex/values";
import { AgentMail } from "@agentmail/convex";
import { action, internalMutation, mutation } from "./_generated/server";
import { components, internal } from "./_generated/api";
import { hasLiveKey } from "./helpers";

const agentmail = new AgentMail(components.agentmail, {
  onMessageReceived: internal.mail.onMessageReceived,
});

export const onMessageReceived = internalMutation({
  args: {
    message: v.any(),
    thread: v.any(),
    eventId: v.string(),
  },
  handler: async (ctx, args) => {
    const message = args.message as {
      inbox_id?: string;
      thread_id?: string;
      subject?: string;
      text?: string;
      preview?: string;
      from?: string | Array<{ email?: string; name?: string }>;
    };

    const threadId = message.thread_id;
    const inboxId = message.inbox_id;

    let caseDoc = threadId
      ? await ctx.db
          .query("cases")
          .withIndex("by_thread", (q) => q.eq("agentmailThreadId", threadId))
          .first()
      : null;

    if (!caseDoc && inboxId) {
      const recent = await ctx.db
        .query("cases")
        .withIndex("by_activity")
        .order("desc")
        .collect();
      caseDoc =
        recent.find(
          (c) =>
            c.agentmailInboxId === inboxId && c.status !== "closed",
        ) ?? null;
    }

    if (!caseDoc) {
      console.log("No case matched inbound AgentMail message", args.eventId);
      return;
    }

    const fromRaw = message.from;
    const from =
      typeof fromRaw === "string"
        ? fromRaw
        : Array.isArray(fromRaw)
          ? fromRaw.map((f) => f.name || f.email || "unknown").join(", ")
          : "unknown sender";

    await ctx.scheduler.runAfter(0, internal.internalMutations.recordInbound, {
      caseId: caseDoc._id,
      subject: message.subject ?? "(no subject)",
      from,
      body: message.text ?? message.preview ?? "",
      threadId,
      demo: false,
    });
  },
});

export const approveAndSend = action({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    const caseDoc = await ctx.runQuery(internal.internalQueries.getCase, {
      caseId: args.caseId,
    });
    if (!caseDoc) throw new Error("Case not found");
    if (!caseDoc.draft) throw new Error("No draft to send");

    const inboxId =
      caseDoc.agentmailInboxId || process.env.AGENTMAIL_DEFAULT_INBOX_ID;

    if (hasLiveKey("AGENTMAIL_API_KEY") && inboxId) {
      try {
        const outboundId = await ctx.runMutation(internal.mail.enqueueSend, {
          caseId: args.caseId,
          inboxId,
          to: caseDoc.draft.to,
          subject: caseDoc.draft.subject,
          body: caseDoc.draft.body,
        });
        return { demo: false, outboundId };
      } catch (err) {
        console.error("AgentMail send failed, recording demo outbound", err);
      }
    }

    await ctx.runMutation(internal.internalMutations.recordOutbound, {
      caseId: args.caseId,
      to: caseDoc.draft.to,
      subject: caseDoc.draft.subject,
      body: caseDoc.draft.body,
      demo: true,
    });
    return { demo: true };
  },
});

export const enqueueSend = internalMutation({
  args: {
    caseId: v.id("cases"),
    inboxId: v.string(),
    to: v.string(),
    subject: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const outboundId = await agentmail.sendMessage(ctx, args.inboxId, {
      to: args.to,
      subject: args.subject,
      text: args.body,
      labels: ["northbridge-desk", "case-reply"],
    });
    await ctx.scheduler.runAfter(0, internal.internalMutations.recordOutbound, {
      caseId: args.caseId,
      to: args.to,
      subject: args.subject,
      body: args.body,
      demo: false,
      outboundId: String(outboundId),
    });
    return outboundId;
  },
});

/** Judges: complete the inbound half of the loop without a live mailbox. */
export const simulateInboundReply = mutation({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    const caseDoc = await ctx.db.get(args.caseId);
    if (!caseDoc) throw new Error("Case not found");
    await ctx.scheduler.runAfter(0, internal.internalMutations.recordInbound, {
      caseId: args.caseId,
      subject: `Re: ${caseDoc.subject}`,
      from: caseDoc.senderName,
      body: `Thanks for your note — we received it and will follow up with next steps within two business days.\n\n— ${caseDoc.senderName}`,
      demo: true,
    });
  },
});

export { agentmail };
