import { v } from "convex/values";
import { FirecrawlClient } from "@firecrawl/firecrawl-convex";
import { action } from "./_generated/server";
import { components, internal } from "./_generated/api";
import { hasLiveKey } from "./helpers";

const firecrawl = new FirecrawlClient(components.firecrawl);

const DEMO_EVIDENCE: Record<string, { title: string; snippet: string }> = {
  "https://www.hud.gov/topics/rental_assistance/tenantrights": {
    title: "HUD — Tenant Rights (demo evidence)",
    snippet:
      "Tenants generally must receive advance written notice before a rent increase. Many jurisdictions require 30–60 days' notice. Review your lease for the exact notice period and any caps on increases. Keep written records of all landlord communications.",
  },
  "https://www.naic.org/consumer_glossary.htm": {
    title: "NAIC — Consumer Insurance Glossary (demo evidence)",
    snippet:
      "A claim denial may be appealed. Document the covered peril, keep photos and contractor estimates, and note appeal deadlines in the determination letter. Gradual damage exclusions are common; sudden and accidental water damage is often treated differently.",
  },
};

function demoForUrl(url: string) {
  try {
    return (
      DEMO_EVIDENCE[url] ?? {
        title: `Demo evidence for ${new URL(url).hostname}`,
        snippet:
          "Demo mode: Firecrawl key not configured. This labeled fixture stands in for a live scrape so judges can complete the desk flow end-to-end.",
      }
    );
  } catch {
    return {
      title: "Demo evidence",
      snippet:
        "Demo mode: Firecrawl key not configured. This labeled fixture stands in for a live scrape.",
    };
  }
}

export const scrapeCaseLinks = action({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    const caseDoc = await ctx.runQuery(internal.internalQueries.getCase, {
      caseId: args.caseId,
    });
    if (!caseDoc) throw new Error("Case not found");

    await ctx.runMutation(internal.internalMutations.markReviewing, {
      caseId: args.caseId,
    });

    const urls = caseDoc.linkedUrls;
    if (urls.length === 0) {
      await ctx.runMutation(internal.internalMutations.addEvidence, {
        caseId: args.caseId,
        url: "about:blank",
        title: "No linked URLs on notice",
        snippet:
          "This notice did not include external links. Extraction can still run on the email body.",
        source: "demo",
      });
      return { mode: "demo" as const, count: 0 };
    }

    const live = hasLiveKey("FIRECRAWL_API_KEY");
    const results: Array<{ url: string; source: "firecrawl" | "demo" }> = [];

    for (const url of urls) {
      if (live) {
        try {
          const page = await firecrawl.scrape(ctx, url, {
            formats: ["markdown", "summary"],
            onlyMainContent: true,
            maxAge: 3_600_000,
          });
          const title =
            (page.metadata?.title as string | undefined) ??
            `Scraped ${new URL(url).hostname}`;
          const snippet = String(
            page.summary ?? page.markdown ?? "No content returned",
          ).slice(0, 1200);
          await ctx.runMutation(internal.internalMutations.addEvidence, {
            caseId: args.caseId,
            url,
            title,
            snippet,
            source: "firecrawl",
          });
          results.push({ url, source: "firecrawl" });
          continue;
        } catch (err) {
          console.error("Firecrawl scrape failed, using demo evidence", err);
        }
      }

      const demo = demoForUrl(url);
      await ctx.runMutation(internal.internalMutations.addEvidence, {
        caseId: args.caseId,
        url,
        title: demo.title,
        snippet: demo.snippet,
        source: "demo",
      });
      results.push({ url, source: "demo" });
    }

    return {
      mode: live ? ("live" as const) : ("demo" as const),
      count: results.length,
      results,
    };
  },
});
