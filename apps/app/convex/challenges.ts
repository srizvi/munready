import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

export const getUserChallenges = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const userChallenges = await ctx.db
      .query("userChallenges")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const enrichedChallenges = await Promise.all(
      userChallenges.map(async (userChallenge) => {
        const challenge = await ctx.db.get(userChallenge.challengeId);
        return {
          ...userChallenge,
          challenge,
        };
      }),
    );

    return enrichedChallenges.filter((c) => c.challenge?.isActive);
  },
});

export const getActiveChallenges = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("munChallenges")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

export const getUserStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return {
        totalPoints: 0,
        completedChallenges: 0,
        inProgress: 0,
        successRate: 0,
      };
    }

    const userChallenges = await ctx.db
      .query("userChallenges")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const activeChallenges = await ctx.db
      .query("munChallenges")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const completedChallenges = userChallenges.filter((uc) => uc.completed);
    const totalPoints = await Promise.all(
      completedChallenges.map(async (uc) => {
        const challenge = await ctx.db.get(uc.challengeId);
        return challenge?.points || 0;
      }),
    ).then((points) => points.reduce((sum, p) => sum + p, 0));

    const totalActiveChallenges = activeChallenges.length;
    const completedCount = completedChallenges.length;
    const inProgressCount = Math.max(0, totalActiveChallenges - completedCount);
    const successRate =
      totalActiveChallenges > 0
        ? Math.round((completedCount / totalActiveChallenges) * 100)
        : 0;

    return {
      totalPoints,
      completedChallenges: completedCount,
      inProgress: inProgressCount,
      successRate,
    };
  },
});

export const completeChallenge = mutation({
  args: { challengeId: v.id("munChallenges") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const existing = await ctx.db
      .query("userChallenges")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("challengeId"), args.challengeId))
      .first();

    if (existing && !existing.completed) {
      await ctx.db.patch(existing._id, {
        completed: true,
        completedAt: Date.now(),
        progress: 100,
      });
    } else if (!existing) {
      await ctx.db.insert("userChallenges", {
        userId,
        challengeId: args.challengeId,
        completed: true,
        completedAt: Date.now(),
        progress: 100,
      });
    }

    return null;
  },
});

export const seedDefaultChallenges = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("munChallenges").first();
    if (existing) {
      return null;
    }

    const challenges = [
      // Easy Challenges (🟢)
      {
        title: "Official Name Master",
        description: "Use your country's full official name in a speech",
        category: "Easy",
        points: 10,
        isActive: true,
      },
      {
        title: "Clause Bank Explorer",
        description:
          "Star three clauses in the clause bank before the first unmoderated caucus",
        category: "Easy",
        points: 15,
        isActive: true,
      },
      {
        title: "Networking Novice",
        description:
          "Learn the names of three new delegates during the session",
        category: "Easy",
        points: 10,
        isActive: true,
      },
      // Medium Challenges (🟡)
      {
        title: "Regional Bloc Builder",
        description: "Form a bloc with three countries from different regions",
        category: "Medium",
        points: 25,
        isActive: true,
      },
      {
        title: "Amendment Advocate",
        description:
          "Suggest an amendment that gets accepted into a draft resolution",
        category: "Medium",
        points: 30,
        isActive: true,
      },
      {
        title: "Statistical Speaker",
        description: "Use a statistic from a UN agency in one of your speeches",
        category: "Medium",
        points: 20,
        isActive: true,
      },
      // Difficult Challenges (🔴)
      {
        title: "Vote Changer",
        description:
          "Convince a delegate to change their vote from abstain to yes",
        category: "Difficult",
        points: 50,
        isActive: true,
      },
      {
        title: "Bloc Unifier",
        description:
          "Bring two different blocs together for a joint draft resolution",
        category: "Difficult",
        points: 60,
        isActive: true,
      },
      {
        title: "Amendment Winner",
        description: "Win a vote for an amendment you proposed",
        category: "Difficult",
        points: 40,
        isActive: true,
      },
      // Wildcard Challenges (🎯)
      {
        title: "Coffee Break Diplomat",
        description:
          "Secure support for your bloc's idea during a coffee or lunch break without mentioning 'resolution' or 'clause'",
        category: "Wildcard",
        points: 35,
        isActive: true,
      },
      // Original challenges for backward compatibility
      {
        title: "First Resolution",
        description: "Create your first resolution draft",
        category: "Getting Started",
        points: 10,
        isActive: true,
      },
      {
        title: "Citation Master",
        description: "Use 5 UN document citations in a single resolution",
        category: "Research",
        points: 20,
        isActive: true,
      },
      {
        title: "Alliance Architect",
        description: "Star 10 potential alliance partners",
        category: "Strategy",
        points: 30,
        isActive: true,
      },
      {
        title: "C.A.P.S. Expert",
        description: "Complete a resolution using all C.A.P.S. format elements",
        category: "Advanced",
        points: 50,
        isActive: true,
      },
    ];

    for (const challenge of challenges) {
      await ctx.db.insert("munChallenges", challenge);
    }

    return null;
  },
});
