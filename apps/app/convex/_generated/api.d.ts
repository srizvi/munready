/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

import type * as ai from "../ai.js";
import type * as alliances from "../alliances.js";
import type * as auth from "../auth.js";
import type * as caucus from "../caucus.js";
import type * as challenges from "../challenges.js";
import type * as committees from "../committees.js";
import type * as countries from "../countries.js";
import type * as debates from "../debates.js";
import type * as http from "../http.js";
import type * as resolutions from "../resolutions.js";
import type * as router from "../router.js";
import type * as starring from "../starring.js";
import type * as templates from "../templates.js";
import type * as themes from "../themes.js";
import type * as topics from "../topics.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  alliances: typeof alliances;
  auth: typeof auth;
  caucus: typeof caucus;
  challenges: typeof challenges;
  committees: typeof committees;
  countries: typeof countries;
  debates: typeof debates;
  http: typeof http;
  resolutions: typeof resolutions;
  router: typeof router;
  starring: typeof starring;
  templates: typeof templates;
  themes: typeof themes;
  topics: typeof topics;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
