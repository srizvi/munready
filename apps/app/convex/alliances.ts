import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { action, mutation, query } from "./_generated/server";

export const getAllianceSuggestions = query({
  args: { countryId: v.id("countries") },
  handler: async (ctx, args) => {
    const allianceData = await ctx.db
      .query("allianceData")
      .withIndex("by_country", (q) => q.eq("countryId", args.countryId))
      .first();

    if (!allianceData) {
      return [];
    }

    // Get country names for suggested allies
    const enrichedSuggestions = await Promise.all(
      allianceData.suggestedAllies.map(async (ally) => {
        const country = await ctx.db.get(ally.countryId);
        return {
          ...ally,
          countryName: country?.name || "Unknown",
        };
      }),
    );

    return enrichedSuggestions.sort((a, b) => b.strength - a.strength);
  },
});

export const generateAllianceSuggestions = mutation({
  args: { countryId: v.id("countries") },
  handler: async (ctx, args) => {
    const country = await ctx.db.get(args.countryId);
    if (!country) {
      throw new Error("Country not found");
    }

    // Simple alliance logic based on regions and common interests
    const allCountries = await ctx.db.query("countries").collect();
    const suggestions = [];

    for (const otherCountry of allCountries) {
      if (otherCountry._id === args.countryId) continue;

      // Generate suggestions based on geopolitical factors
      const suggestions_data = [
        {
          countryId: otherCountry._id,
          reason: "Regional cooperation and shared economic interests",
          strength: Math.floor(Math.random() * 5) + 6, // 6-10
          category: "Economic",
        },
        {
          countryId: otherCountry._id,
          reason: "Historical diplomatic ties and multilateral agreements",
          strength: Math.floor(Math.random() * 4) + 5, // 5-8
          category: "Political",
        },
      ];

      suggestions.push(
        suggestions_data[Math.floor(Math.random() * suggestions_data.length)],
      );
    }

    // Take top 8 suggestions
    const topSuggestions = suggestions
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 8);

    // Save or update alliance data
    const existing = await ctx.db
      .query("allianceData")
      .withIndex("by_country", (q) => q.eq("countryId", args.countryId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        suggestedAllies: topSuggestions,
        lastUpdated: Date.now(),
      });
    } else {
      await ctx.db.insert("allianceData", {
        countryId: args.countryId,
        suggestedAllies: topSuggestions,
        lastUpdated: Date.now(),
      });
    }

    return null;
  },
});
