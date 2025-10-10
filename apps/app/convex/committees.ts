import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

export const listCommittees = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("committees").order("asc").collect();
  },
});

export const addCustomCommittee = mutation({
  args: {
    name: v.string(),
    fullName: v.optional(v.string()),
    type: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if committee already exists
    const existing = await ctx.db
      .query("committees")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();

    if (existing) {
      throw new Error("Committee already exists");
    }

    return await ctx.db.insert("committees", {
      name: args.name,
      fullName: args.fullName || args.name,
      type: args.type || "Custom",
      description: args.description || `Custom committee: ${args.name}`,
      isCustom: true,
      addedBy: userId,
    });
  },
});

export const seedDefaultCommittees = mutation({
  args: {},
  handler: async (ctx) => {
    const existingCommittees = await ctx.db.query("committees").first();
    if (existingCommittees) {
      return null;
    }

    const defaultCommittees = [
      {
        name: "DISEC",
        fullName: "First Committee - Disarmament and International Security",
        type: "GA",
      },
      {
        name: "ECOFIN",
        fullName: "Second Committee - Economic and Financial",
        type: "GA",
      },
      {
        name: "SOCHUM",
        fullName: "Third Committee - Social, Humanitarian and Cultural",
        type: "GA",
      },
      {
        name: "SPECPOL",
        fullName: "Fourth Committee - Special Political and Decolonization",
        type: "GA",
      },
      { name: "GA Plenary", fullName: "General Assembly Plenary", type: "GA" },
      {
        name: "ECOSOC",
        fullName: "Economic and Social Council",
        type: "ECOSOC",
      },
      {
        name: "UNSC",
        fullName: "United Nations Security Council",
        type: "Security Council",
      },
      {
        name: "WHO",
        fullName: "World Health Organization",
        type: "Specialized Agency",
      },
      {
        name: "UNESCO",
        fullName:
          "United Nations Educational, Scientific and Cultural Organization",
        type: "Specialized Agency",
      },
      {
        name: "UNICEF",
        fullName: "United Nations Children's Fund",
        type: "Specialized Agency",
      },
      {
        name: "UNHCR",
        fullName: "United Nations High Commissioner for Refugees",
        type: "Specialized Agency",
      },
      {
        name: "UNEP",
        fullName: "United Nations Environment Programme",
        type: "Specialized Agency",
      },
    ];

    for (const committee of defaultCommittees) {
      await ctx.db.insert("committees", {
        name: committee.name,
        fullName: committee.fullName,
        description: committee.fullName,
        type: committee.type,
        isCustom: false,
      });
    }

    return null;
  },
});
