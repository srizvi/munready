import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

export const getCaucusProposals = query({
  args: { resolutionId: v.id("resolutions") },
  handler: async (ctx, args) => {
    const proposals = await ctx.db
      .query("caucusProposals")
      .withIndex("by_resolution", (q) =>
        q.eq("resolutionId", args.resolutionId),
      )
      .order("desc")
      .collect();

    // Get author names
    const enrichedProposals = await Promise.all(
      proposals.map(async (proposal) => {
        const author = await ctx.db.get(proposal.authorId);
        return {
          ...proposal,
          authorName: author?.name || "Unknown",
        };
      }),
    );

    return enrichedProposals;
  },
});

export const createCaucusProposal = mutation({
  args: {
    resolutionId: v.id("resolutions"),
    title: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.insert("caucusProposals", {
      authorId: userId,
      resolutionId: args.resolutionId,
      title: args.title,
      description: args.description,
      votes: 0,
      voters: [],
      status: "active",
    });
  },
});

export const voteOnProposal = mutation({
  args: {
    proposalId: v.id("caucusProposals"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal) {
      throw new Error("Proposal not found");
    }

    const hasVoted = proposal.voters.includes(userId);

    if (hasVoted) {
      // Remove vote
      await ctx.db.patch(args.proposalId, {
        votes: proposal.votes - 1,
        voters: proposal.voters.filter((id) => id !== userId),
      });
    } else {
      // Add vote
      await ctx.db.patch(args.proposalId, {
        votes: proposal.votes + 1,
        voters: [...proposal.voters, userId],
      });
    }

    return null;
  },
});
