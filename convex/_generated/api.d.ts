/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as cases from "../cases.js";
import type * as extract from "../extract.js";
import type * as helpers from "../helpers.js";
import type * as http from "../http.js";
import type * as internalMutations from "../internalMutations.js";
import type * as internalQueries from "../internalQueries.js";
import type * as mail from "../mail.js";
import type * as pipeline from "../pipeline.js";
import type * as scrape from "../scrape.js";
import type * as seed from "../seed.js";
import type * as staticHosting from "../staticHosting.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  cases: typeof cases;
  extract: typeof extract;
  helpers: typeof helpers;
  http: typeof http;
  internalMutations: typeof internalMutations;
  internalQueries: typeof internalQueries;
  mail: typeof mail;
  pipeline: typeof pipeline;
  scrape: typeof scrape;
  seed: typeof seed;
  staticHosting: typeof staticHosting;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  firecrawl: import("@firecrawl/firecrawl-convex/_generated/component.js").ComponentApi<"firecrawl">;
  agentmail: import("@agentmail/convex/_generated/component.js").ComponentApi<"agentmail">;
  staticHosting: import("@convex-dev/static-hosting/_generated/component.js").ComponentApi<"staticHosting">;
};
