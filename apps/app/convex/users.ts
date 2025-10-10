import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

export const getUserProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    return profile;
  },
});

export const createUserProfile = mutation({
  args: {
    username: v.string(),
    school: v.optional(v.string()),
    delegation: v.optional(v.string()),
    nativeLanguage: v.optional(v.string()),
    experienceLevel: v.union(
      v.literal("Beginner"),
      v.literal("Intermediate"),
      v.literal("Advanced"),
    ),
    preferredCommittees: v.array(v.string()),
    timezone: v.string(),
    defaultTheme: v.string(),
    citationPreferences: v.object({
      preferUNPrimaryDocs: v.boolean(),
      autoUpdateCountryData: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if profile already exists
    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingProfile) {
      throw new Error("Profile already exists");
    }

    return await ctx.db.insert("userProfiles", {
      userId,
      username: args.username,
      school: args.school,
      delegation: args.delegation,
      nativeLanguage: args.nativeLanguage,
      experienceLevel: args.experienceLevel,
      preferredCommittees: args.preferredCommittees,
      timezone: args.timezone,
      defaultTheme: args.defaultTheme,
      citationPreferences: args.citationPreferences,
      setupCompleted: true,
    });
  },
});

export const updateUserProfile = mutation({
  args: {
    username: v.optional(v.string()),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    school: v.optional(v.string()),
    delegation: v.optional(v.string()),
    nativeLanguage: v.optional(v.string()),
    experienceLevel: v.optional(
      v.union(
        v.literal("Beginner"),
        v.literal("Intermediate"),
        v.literal("Advanced"),
      ),
    ),
    preferredCommittees: v.optional(v.array(v.string())),
    timezone: v.optional(v.string()),
    defaultTheme: v.optional(v.string()),
    citationPreferences: v.optional(
      v.object({
        preferUNPrimaryDocs: v.boolean(),
        autoUpdateCountryData: v.boolean(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    const updates: any = {};
    if (args.username !== undefined) updates.username = args.username;
    if (args.name !== undefined) updates.name = args.name;
    if (args.email !== undefined) updates.email = args.email;
    if (args.school !== undefined) updates.school = args.school;
    if (args.delegation !== undefined) updates.delegation = args.delegation;
    if (args.nativeLanguage !== undefined)
      updates.nativeLanguage = args.nativeLanguage;
    if (args.experienceLevel !== undefined)
      updates.experienceLevel = args.experienceLevel;
    if (args.preferredCommittees !== undefined)
      updates.preferredCommittees = args.preferredCommittees;
    if (args.timezone !== undefined) updates.timezone = args.timezone;
    if (args.defaultTheme !== undefined)
      updates.defaultTheme = args.defaultTheme;
    if (args.citationPreferences !== undefined)
      updates.citationPreferences = args.citationPreferences;

    if (!profile) {
      throw new Error("Profile not found");
    }

    await ctx.db.patch(profile._id, updates);
    return null;
  },
});
