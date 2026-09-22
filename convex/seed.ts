import { mutation } from "./_generated/server";
import { appendTimeline } from "./helpers";

const SAMPLE_NOTICES = [
  {
    title: "Rent increase — Harbor View lease",
    category: "housing",
    senderName: "Harbor View Property Management",
    senderRole: "landlord",
    subject: "Notice of Rent Adjustment Effective November 1, 2026",
    assignedTo: "Avery",
    riskFlags: ["deadline", "money"],
    linkedUrls: [
      "https://www.hud.gov/topics/rental_assistance/tenantrights",
    ],
    bodyText: `Dear Avery & Morgan,

This letter serves as formal notice that monthly rent for Unit 4B at the Northbridge residence will increase from $2,450 to $2,695 effective November 1, 2026.

Per the lease addendum, 60 days' written notice is required for adjustments above 5%. Please confirm receipt and indicate whether you will renew at the new rate by October 10, 2026.

Reference materials:
https://www.hud.gov/topics/rental_assistance/tenantrights

Questions may be directed to the leasing office.

Harbor View Property Management`,
  },
  {
    title: "Insurance claim denial — water damage",
    category: "insurance",
    senderName: "Northstar Mutual Claims",
    senderRole: "insurer",
    subject: "Claim #NS-88421 — Partial Denial Determination",
    assignedTo: "Morgan",
    riskFlags: ["appeal_window", "money"],
    linkedUrls: [
      "https://www.naic.org/consumer_glossary.htm",
    ],
    bodyText: `Dear Policyholders,

Regarding claim NS-88421 for water damage reported September 3, 2026:

We have completed our review. Coverage for emergency mitigation ($1,840) is approved. Coverage for cabinet replacement ($4,260) is denied under exclusion 4.2 (gradual seepage).

You may appeal this determination within 30 days (deadline: October 20, 2026) by submitting additional documentation through our claims portal:
https://www.naic.org/consumer_glossary.htm

A claims adjuster is available if you wish to discuss the seepage finding.

Northstar Mutual Claims`,
  },
  {
    title: "School permission — overnight field study",
    category: "school",
    senderName: "Northbridge Elementary",
    senderRole: "school",
    subject: "Permission Required: Grade 4 Coastal Field Study (Oct 14–15)",
    assignedTo: "Avery",
    riskFlags: ["deadline", "permission"],
    linkedUrls: [],
    bodyText: `Hello Avery & Morgan,

Your child is invited to join the Grade 4 Coastal Field Study overnight trip on October 14–15, 2026. Cost is $85 (scholarships available).

Please return the signed permission form and emergency contacts by October 1, 2026. Without a signed form, your child cannot attend.

Packing list and itinerary will follow after forms are received.

Warmly,
Northbridge Elementary Office`,
  },
] as const;

export const seedSampleCases = mutation({
  args: {},
  handler: async (ctx) => {
    let household = await ctx.db.query("households").first();
    if (!household) {
      const householdId = await ctx.db.insert("households", {
        name: "Northbridge",
        adults: ["Avery", "Morgan"],
      });
      household = (await ctx.db.get(householdId))!;
    }

    const existing = await ctx.db
      .query("cases")
      .withIndex("by_household", (q) => q.eq("householdId", household!._id))
      .collect();
    if (existing.length >= 3) {
      return {
        seeded: false,
        message: "Sample cases already present",
        caseIds: existing.map((c) => c._id),
      };
    }

    const caseIds = [];
    const now = Date.now();

    for (let i = 0; i < SAMPLE_NOTICES.length; i++) {
      const notice = SAMPLE_NOTICES[i]!;
      const caseId = await ctx.db.insert("cases", {
        householdId: household._id,
        title: notice.title,
        status: "new",
        category: notice.category,
        senderName: notice.senderName,
        senderRole: notice.senderRole,
        subject: notice.subject,
        bodyText: notice.bodyText,
        linkedUrls: [...notice.linkedUrls],
        assignedTo: notice.assignedTo,
        riskFlags: [...notice.riskFlags],
        lastActivityAt: now - i * 60_000,
        agentmailInboxId: process.env.AGENTMAIL_DEFAULT_INBOX_ID,
      });
      caseIds.push(caseId);
      await appendTimeline(ctx, {
        caseId,
        kind: "notice_received",
        title: "Notice ingested",
        detail: notice.subject,
      });
    }

    return { seeded: true, message: "Seeded 3 Northbridge notices", caseIds };
  },
});

export const clearDemoData = mutation({
  args: {},
  handler: async (ctx) => {
    const cases = await ctx.db.query("cases").collect();
    for (const c of cases) {
      const evidence = await ctx.db
        .query("evidence")
        .withIndex("by_case", (q) => q.eq("caseId", c._id))
        .collect();
      for (const e of evidence) await ctx.db.delete(e._id);
      const timeline = await ctx.db
        .query("timeline")
        .withIndex("by_case", (q) => q.eq("caseId", c._id))
        .collect();
      for (const t of timeline) await ctx.db.delete(t._id);
      await ctx.db.delete(c._id);
    }
    return { cleared: cases.length };
  },
});
