/* eslint-disable */
/**
 * Generated API stub for local frontend builds.
 * Run `npx convex dev` to regenerate accurate types from your deployment.
 */
import type { FunctionReference } from "convex/server";

type AnyRef = FunctionReference<any, any, any, any>;

export declare const api: {
  cases: {
    list: AnyRef;
    get: AnyRef;
    getEvidence: AnyRef;
    getTimeline: AnyRef;
    household: AnyRef;
    updateStatus: AnyRef;
    updateDraft: AnyRef;
    closeCase: AnyRef;
  };
  seed: {
    seedSampleCases: AnyRef;
    clearDemoData: AnyRef;
  };
  scrape: {
    scrapeCaseLinks: AnyRef;
  };
  extract: {
    extractAndDraft: AnyRef;
  };
  mail: {
    approveAndSend: AnyRef;
    simulateInboundReply: AnyRef;
  };
  pipeline: {
    processCase: AnyRef;
  };
  staticHosting: {
    getCurrentDeployment: AnyRef;
  };
};

export declare const internal: {
  internalQueries: {
    getCase: AnyRef;
    getEvidenceForCase: AnyRef;
    findCaseByThread: AnyRef;
    findCaseByInbox: AnyRef;
  };
  internalMutations: {
    markReviewing: AnyRef;
    addEvidence: AnyRef;
    saveExtraction: AnyRef;
    saveDraft: AnyRef;
    recordOutbound: AnyRef;
    recordInbound: AnyRef;
  };
  mail: {
    onMessageReceived: AnyRef;
    enqueueSend: AnyRef;
  };
};

export declare const components: {
  firecrawl: any;
  agentmail: any;
  staticHosting: any;
};
