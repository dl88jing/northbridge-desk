import { defineApp } from "convex/server";
import { v } from "convex/values";
import firecrawl from "@firecrawl/firecrawl-convex/convex.config";
import agentmail from "@agentmail/convex/convex.config";
import staticHosting from "@convex-dev/static-hosting/convex.config";

/**
 * App-owned HTTP root so AgentMail + Firecrawl webhooks keep stable paths.
 * Static hosting is registered via registerStaticRoutes in http.ts.
 */
const app = defineApp({
  env: {
    FIRECRAWL_API_KEY: v.string(),
    FIRECRAWL_WEBHOOK_SECRET: v.optional(v.string()),
    FIRECRAWL_API_URL: v.optional(v.string()),
  },
});

app.use(firecrawl, {
  httpPrefix: "/firecrawl/",
  env: {
    FIRECRAWL_API_KEY: app.env.FIRECRAWL_API_KEY,
    FIRECRAWL_WEBHOOK_SECRET: app.env.FIRECRAWL_WEBHOOK_SECRET,
    FIRECRAWL_API_URL: app.env.FIRECRAWL_API_URL,
  },
});

app.use(agentmail);
app.use(staticHosting);

export default app;
