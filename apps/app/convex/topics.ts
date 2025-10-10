import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

export const listTopics = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("topics").order("asc").collect();
  },
});

export const addCustomTopic = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if topic already exists
    const existing = await ctx.db
      .query("topics")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();

    if (existing) {
      throw new Error("Topic already exists");
    }

    return await ctx.db.insert("topics", {
      name: args.name,
      title: args.name,
      description: args.description || `Custom topic: ${args.name}`,
      category: args.category || "Custom",
      difficulty: "Intermediate",
      tags: [],
      isCustom: true,
      addedBy: userId,
    });
  },
});

export const seedDefaultTopics = mutation({
  args: {},
  handler: async (ctx) => {
    const existingTopics = await ctx.db.query("topics").first();
    if (existingTopics) {
      return null;
    }

    const defaultTopics = [
      {
        name: "Nuclear Disarmament",
        category: "Security",
        description: "Nuclear weapons reduction and non-proliferation",
      },
      {
        name: "Climate Migration",
        category: "Environment",
        description: "Displacement due to climate change",
      },
      {
        name: "Cybersecurity",
        category: "Technology",
        description: "Digital security and cyber warfare",
      },
      {
        name: "Human Trafficking",
        category: "Human Rights",
        description: "Modern slavery and trafficking prevention",
      },
      {
        name: "Sustainable Development",
        category: "Development",
        description: "SDG implementation and progress",
      },
      {
        name: "Refugee Crisis",
        category: "Humanitarian",
        description: "Global refugee protection and assistance",
      },
      {
        name: "Food Security",
        category: "Development",
        description: "Global hunger and agricultural sustainability",
      },
      {
        name: "Gender Equality",
        category: "Human Rights",
        description: "Women's rights and gender parity",
      },
      {
        name: "Peacekeeping Operations",
        category: "Security",
        description: "UN peacekeeping effectiveness",
      },
      {
        name: "Digital Divide",
        category: "Technology",
        description: "Technology access and digital inequality",
      },
      {
        name: "Ocean Conservation",
        category: "Environment",
        description: "Marine ecosystem protection",
      },
      {
        name: "Counter-Terrorism",
        category: "Security",
        description: "International terrorism prevention",
      },
    ];

    for (const topic of defaultTopics) {
      await ctx.db.insert("topics", {
        name: topic.name,
        title: topic.name,
        description: topic.description,
        category: topic.category,
        difficulty: "Intermediate",
        tags: [],
        isCustom: false,
      });
    }

    return null;
  },
});
