import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const caseStatus = v.union(
  v.literal("new"),
  v.literal("reviewing"),
  v.literal("drafting"),
  v.literal("awaiting_reply"),
  v.literal("closed"),
);

export const timelineKind = v.union(
  v.literal("notice_received"),
  v.literal("status_change"),
  v.literal("evidence_added"),
  v.literal("extraction"),
  v.literal("draft_created"),
  v.literal("draft_updated"),
  v.literal("outbound"),
  v.literal("inbound"),
  v.literal("note"),
);

export default defineSchema({
  households: defineTable({
    name: v.string(),
    adults: v.array(v.string()),
  }),

  cases: defineTable({
    householdId: v.id("households"),
    title: v.string(),
    status: caseStatus,
    category: v.string(),
    senderName: v.string(),
    senderRole: v.string(),
    subject: v.string(),
    bodyText: v.string(),
    linkedUrls: v.array(v.string()),
    assignedTo: v.string(),
    riskFlags: v.array(v.string()),
    extracted: v.optional(
      v.object({
        amounts: v.array(
          v.object({
            label: v.string(),
            value: v.string(),
          }),
        ),
        deadlines: v.array(
          v.object({
            label: v.string(),
            date: v.string(),
          }),
        ),
        actions: v.array(v.string()),
        summary: v.string(),
        demo: v.boolean(),
      }),
    ),
    draft: v.optional(
      v.object({
        to: v.string(),
        subject: v.string(),
        body: v.string(),
        demo: v.boolean(),
        updatedAt: v.number(),
      }),
    ),
    agentmailInboxId: v.optional(v.string()),
    agentmailThreadId: v.optional(v.string()),
    lastActivityAt: v.number(),
  })
    .index("by_household", ["householdId"])
    .index("by_status", ["status"])
    .index("by_activity", ["lastActivityAt"])
    .index("by_thread", ["agentmailThreadId"]),

  evidence: defineTable({
    caseId: v.id("cases"),
    url: v.string(),
    title: v.string(),
    snippet: v.string(),
    source: v.union(v.literal("firecrawl"), v.literal("demo")),
    scrapedAt: v.number(),
  }).index("by_case", ["caseId"]),

  timeline: defineTable({
    caseId: v.id("cases"),
    kind: timelineKind,
    title: v.string(),
    detail: v.optional(v.string()),
    meta: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_case", ["caseId"])
    .index("by_case_time", ["caseId", "createdAt"]),
});
