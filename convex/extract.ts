import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { hasLiveKey } from "./helpers";

type Extraction = {
  amounts: Array<{ label: string; value: string }>;
  deadlines: Array<{ label: string; date: string }>;
  actions: string[];
  summary: string;
  riskFlags: string[];
  draftTo: string;
  draftSubject: string;
  draftBody: string;
};

function fixtureExtraction(caseDoc: {
  category: string;
  senderName: string;
  subject: string;
  bodyText: string;
}): Extraction {
  if (caseDoc.category === "housing") {
    return {
      amounts: [
        { label: "Current rent", value: "$2,450/mo" },
        { label: "New rent", value: "$2,695/mo" },
        { label: "Increase", value: "$245/mo (~10%)" },
      ],
      deadlines: [
        { label: "Confirm renewal", date: "2026-10-10" },
        { label: "Increase effective", date: "2026-11-01" },
      ],
      actions: [
        "Confirm receipt of notice",
        "Decide renew / negotiate / exit",
        "Reply before October 10",
      ],
      summary:
        "Landlord proposes a ~10% rent increase effective Nov 1 with a reply deadline of Oct 10. Lease may require 60 days' notice for increases over 5%.",
      riskFlags: ["deadline", "money", "lease_notice"],
      draftTo: caseDoc.senderName,
      draftSubject: `Re: ${caseDoc.subject}`,
      draftBody: `Hello Harbor View team,

Thank you for the written notice regarding the proposed rent adjustment for Unit 4B.

We acknowledge receipt. Before confirming renewal at $2,695/month effective November 1, 2026, we would like to:
1) Confirm that the notice period complies with our lease addendum for increases above 5%, and
2) Discuss whether a smaller step-up is possible given our on-time payment history.

Please reply with available times this week.

— Avery & Morgan
Northbridge household`,
    };
  }

  if (caseDoc.category === "insurance") {
    return {
      amounts: [
        { label: "Approved (mitigation)", value: "$1,840" },
        { label: "Denied (cabinets)", value: "$4,260" },
      ],
      deadlines: [{ label: "Appeal deadline", date: "2026-10-20" }],
      actions: [
        "Gather photos and contractor estimates",
        "File appeal citing sudden water event",
        "Track 30-day appeal window",
      ],
      summary:
        "Partial claim denial: mitigation paid, cabinet replacement denied under gradual seepage exclusion. Appeal window closes Oct 20.",
      riskFlags: ["appeal_window", "money"],
      draftTo: caseDoc.senderName,
      draftSubject: `Re: ${caseDoc.subject} — Appeal of cabinet denial`,
      draftBody: `Hello Claims team,

We are appealing the denial of cabinet replacement under claim NS-88421.

The loss followed a sudden supply-line failure, not gradual seepage. We will upload:
- Timestamped photos from the discovery date
- Plumber report documenting the failure mode
- Two cabinet replacement estimates totaling $4,260

Please confirm the appeal is opened before the October 20, 2026 deadline and share any additional documentation you need.

— Morgan
Northbridge household`,
    };
  }

  return {
    amounts: [{ label: "Trip cost", value: "$85" }],
    deadlines: [{ label: "Permission form due", date: "2026-10-01" }],
    actions: [
      "Sign permission form",
      "Provide emergency contacts",
      "Return by October 1",
    ],
    summary:
      "School overnight field study requires signed permission and $85 fee by October 1.",
    riskFlags: ["deadline", "permission"],
    draftTo: caseDoc.senderName,
    draftSubject: `Re: ${caseDoc.subject}`,
    draftBody: `Hello Northbridge Elementary Office,

Avery & Morgan approve participation in the Grade 4 Coastal Field Study on October 14–15, 2026. We will return the signed permission form and emergency contacts before October 1. Please confirm receipt and share the packing list when ready.

Thank you,
Avery & Morgan
Northbridge household`,
  };
}

async function callOpenAI(prompt: string): Promise<Extraction | null> {
  if (!hasLiveKey("OPENAI_API_KEY")) return null;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You extract household mail facts and draft a calm reply for Avery & Morgan of the Northbridge household. Return JSON only.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) {
    console.error("OpenAI error", await res.text());
    return null;
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) return null;
  const parsed = JSON.parse(content) as Extraction;
  return parsed;
}

export const extractAndDraft = action({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    const caseDoc = await ctx.runQuery(internal.internalQueries.getCase, {
      caseId: args.caseId,
    });
    if (!caseDoc) throw new Error("Case not found");

    const evidence = await ctx.runQuery(
      internal.internalQueries.getEvidenceForCase,
      { caseId: args.caseId },
    );

    const evidenceBlock = evidence
      .map((e) => `- (${e.source}) ${e.title}: ${e.snippet}`)
      .join("\n");

    const prompt = `Extract amounts, deadlines, asked actions, risk flags, and draft a reply.

Return JSON with keys:
amounts: [{label, value}]
deadlines: [{label, date}]  // ISO dates when possible
actions: string[]
summary: string
riskFlags: string[]
draftTo: string
draftSubject: string
draftBody: string

Sender: ${caseDoc.senderName} (${caseDoc.senderRole})
Subject: ${caseDoc.subject}
Body:
${caseDoc.bodyText}

Evidence snippets:
${evidenceBlock || "(none yet)"}`;

    let extraction = await callOpenAI(prompt);
    let demo = false;
    if (!extraction) {
      extraction = fixtureExtraction(caseDoc);
      demo = true;
    }

    await ctx.runMutation(internal.internalMutations.saveExtraction, {
      caseId: args.caseId,
      amounts: extraction.amounts ?? [],
      deadlines: extraction.deadlines ?? [],
      actions: extraction.actions ?? [],
      summary: extraction.summary ?? "",
      riskFlags: extraction.riskFlags ?? caseDoc.riskFlags,
      demo,
    });

    await ctx.runMutation(internal.internalMutations.saveDraft, {
      caseId: args.caseId,
      to: extraction.draftTo || caseDoc.senderName,
      subject: extraction.draftSubject || `Re: ${caseDoc.subject}`,
      body: extraction.draftBody || "",
      demo,
    });

    return { demo, summary: extraction.summary };
  },
});
