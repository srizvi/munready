import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

export const getStarredItems = query({
  args: { resolutionId: v.optional(v.id("resolutions")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const query = ctx.db
      .query("starredItems")
      .withIndex("by_user", (q) => q.eq("userId", userId));

    const items = args.resolutionId
      ? await query
          .filter((q) => q.eq(q.field("resolutionId"), args.resolutionId))
          .collect()
      : await query.collect();

    return items;
  },
});

export const toggleStar = mutation({
  args: {
    itemType: v.union(
      v.literal("clause"),
      v.literal("delegate"),
      v.literal("bloc"),
      v.literal("alliance"),
    ),
    itemId: v.string(),
    resolutionId: v.optional(v.id("resolutions")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if already starred
    const existing = await ctx.db
      .query("starredItems")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("itemType"), args.itemType),
          q.eq(q.field("itemId"), args.itemId),
          args.resolutionId
            ? q.eq(q.field("resolutionId"), args.resolutionId)
            : q.eq(q.field("resolutionId"), undefined),
        ),
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { starred: false };
    } else {
      await ctx.db.insert("starredItems", {
        userId,
        itemType: args.itemType,
        itemId: args.itemId,
        resolutionId: args.resolutionId,
        notes: args.notes,
      });
      return { starred: true };
    }
  },
});
