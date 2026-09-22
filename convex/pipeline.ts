import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

/** One-click happy path: scrape → extract/draft. */
export const processCase = action({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    const scrape = await ctx.runAction(api.scrape.scrapeCaseLinks, {
      caseId: args.caseId,
    });
    const extract = await ctx.runAction(api.extract.extractAndDraft, {
      caseId: args.caseId,
    });
    return { scrape, extract };
  },
});
