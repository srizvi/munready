import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

export const getDebateNotes = query({
  args: { resolutionId: v.optional(v.id("resolutions")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const query = ctx.db
      .query("debateNotes")
      .withIndex("by_author", (q) => q.eq("authorId", userId));

    const notes = args.resolutionId
      ? await query
          .filter((q) => q.eq(q.field("resolutionId"), args.resolutionId))
          .collect()
      : await query.collect();

    return notes.sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const createDebateNote = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    tags: v.array(v.string()),
    resolutionId: v.optional(v.id("resolutions")),
    linkedClause: v.optional(v.string()),
    linkedSpeaker: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.insert("debateNotes", {
      authorId: userId,
      title: args.title,
      content: args.content,
      tags: args.tags,
      resolutionId: args.resolutionId,
      linkedClause: args.linkedClause,
      linkedSpeaker: args.linkedSpeaker,
    });
  },
});

export const updateDebateNote = mutation({
  args: {
    noteId: v.id("debateNotes"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    linkedClause: v.optional(v.string()),
    linkedSpeaker: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const note = await ctx.db.get(args.noteId);
    if (!note || note.authorId !== userId) {
      throw new Error("Note not found or access denied");
    }

    const updates: any = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.content !== undefined) updates.content = args.content;
    if (args.tags !== undefined) updates.tags = args.tags;
    if (args.linkedClause !== undefined)
      updates.linkedClause = args.linkedClause;
    if (args.linkedSpeaker !== undefined)
      updates.linkedSpeaker = args.linkedSpeaker;

    await ctx.db.patch(args.noteId, updates);
    return null;
  },
});
