import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { registerStaticRoutes } from "@convex-dev/static-hosting";
import { components } from "./_generated/api";
import { agentmail } from "./mail";

const http = httpRouter();

http.route({
  path: "/agentmail/webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => agentmail.handleWebhook(ctx, req)),
});

// Health check for uptime / judges
http.route({
  path: "/api/health",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(JSON.stringify({ ok: true, app: "northbridge-desk" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// App-owned static hosting catch-all (exact routes above win)
registerStaticRoutes(http, components.staticHosting);

export default http;
