import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

export const createResolution = mutation({
  args: {
    title: v.string(),
    country: v.string(),
    topic: v.string(),
    committee: v.string(),
    countryId: v.id("countries"),
    topicId: v.id("topics"),
    committeeId: v.id("committees"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const resolutionId = await ctx.db.insert("resolutions", {
      title: args.title,
      country: args.country,
      topic: args.topic,
      committee: args.committee,
      countryId: args.countryId,
      topicId: args.topicId,
      committeeId: args.committeeId,
      userId,
      status: "draft",
      content: {
        preamble: [],
        operative: [],
      },
      wordCount: 0,
    });

    return resolutionId;
  },
});

export const listResolutions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const resolutions = await ctx.db
      .query("resolutions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return resolutions;
  },
});

export const getResolution = query({
  args: { resolutionId: v.id("resolutions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const resolution = await ctx.db.get(args.resolutionId);
    if (!resolution || resolution.userId !== userId) {
      return null;
    }

    return resolution;
  },
});

export const updateResolutionContent = mutation({
  args: {
    resolutionId: v.id("resolutions"),
    content: v.object({
      preamble: v.array(
        v.object({
          type: v.union(v.literal("clause"), v.literal("citation")),
          text: v.string(),
          citation: v.optional(v.string()),
        }),
      ),
      operative: v.array(
        v.object({
          number: v.number(),
          text: v.string(),
          subClauses: v.array(
            v.object({
              letter: v.string(),
              text: v.string(),
            }),
          ),
        }),
      ),
    }),
    wordCount: v.number(),
    citations: v.optional(
      v.array(
        v.object({
          source: v.string(),
          url: v.optional(v.string()),
          date: v.optional(v.string()),
          type: v.string(),
        }),
      ),
    ),
    actionPlan: v.optional(
      v.object({
        years1to5: v.string(),
        years6to10: v.string(),
        years11to15: v.string(),
        years16to25: v.string(),
      }),
    ),
    recommendedVideo: v.optional(
      v.object({
        title: v.string(),
        platform: v.string(),
        url: v.string(),
        justification: v.string(),
      }),
    ),
    briefing: v.optional(
      v.object({
        basicSummary: v.string(),
        speechPreview: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const resolution = await ctx.db.get(args.resolutionId);
    if (!resolution || resolution.userId !== userId) {
      throw new Error("Resolution not found or access denied");
    }

    await ctx.db.patch(args.resolutionId, {
      content: args.content,
      wordCount: args.wordCount,
      citations: args.citations,
      actionPlan: args.actionPlan,
      recommendedVideo: args.recommendedVideo,
      briefing: args.briefing,
    });
  },
});

export const updateResolutionStatus = mutation({
  args: {
    resolutionId: v.id("resolutions"),
    status: v.union(
      v.literal("draft"),
      v.literal("in_progress"),
      v.literal("completed"),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const resolution = await ctx.db.get(args.resolutionId);
    if (!resolution || resolution.userId !== userId) {
      throw new Error("Resolution not found or access denied");
    }

    await ctx.db.patch(args.resolutionId, {
      status: args.status,
    });
  },
});

export const deleteResolution = mutation({
  args: { resolutionId: v.id("resolutions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const resolution = await ctx.db.get(args.resolutionId);
    if (!resolution || resolution.userId !== userId) {
      throw new Error("Resolution not found or access denied");
    }

    await ctx.db.delete(args.resolutionId);
  },
});
