# Hackathon log

- **Project:** Northbridge Desk
- **Event:** Convex All Gas Hackathon sponsored by OpenAI, Firecrawl, & AgentMail
- **What it does:** Household mail-ops desk for Avery & Morgan that scrapes notice links with Firecrawl, extracts deadlines with OpenAI, and sends drafts from the case inbox via AgentMail on Convex.
- **Live app:** not deployed
- **Repo:** https://github.com/dl88jing/northbridge-desk
- **Frontend:** Convex static hosting
- **Convex deployment:** not deployed
- **Components:** @firecrawl/firecrawl-convex, @agentmail/convex, @convex-dev/static-hosting
- **Convex features:** schema, indexes, queries, mutations, actions, HTTP actions, scheduled functions, realtime queries, registered components
- **Auth:** none
- **AI models:** gpt-4o-mini
- **Started:** 2026-09-22T08:55:17Z
- **Last updated:** 2026-09-22T08:55:17Z

## Log

### 2026-09-22 - d51052c
Built the full Northbridge Desk source under time pressure when cloud agents hit GitHub rate limits. Added Convex schema for households, cases, evidence, and timeline with status flow new → reviewing → drafting → awaiting_reply → closed. Wired seed fixtures (rent increase, insurance denial, school permission), Firecrawl scrape action with demo fallback, OpenAI extract/draft action (gpt-4o-mini) with demo fallback, AgentMail approve/send plus signed webhook route that appends inbound replies to the case timeline, and a React desk UI on Convex static hosting. Convex features: schema, indexes, query, mutation, action, httpAction, scheduler, registered components (`convex/schema.ts`, `convex/convex.config.ts`, `convex/http.ts`, `convex/scrape.ts`, `convex/extract.ts`, `convex/mail.ts`, `src/App.tsx`).
