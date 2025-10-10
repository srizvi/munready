import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

// Default themes data
const DEFAULT_THEMES = [
  {
    name: "Diplomatic Dawn",
    primaryColor: "#E3F2FD",
    secondaryColor: "#90CAF9",
    textColor: "#0D1B2A",
    isDefault: true,
  },
  {
    name: "Treaty Beige",
    primaryColor: "#F5F0E6",
    secondaryColor: "#D7CCC8",
    textColor: "#3E2723",
    isDefault: true,
  },
  {
    name: "Resolution Rose",
    primaryColor: "#FCE4EC",
    secondaryColor: "#F48FB1",
    textColor: "#4A0E2E",
    isDefault: true,
  },
  {
    name: "Summit Sage",
    primaryColor: "#E8F5E9",
    secondaryColor: "#A5D6A7",
    textColor: "#1B4332",
    isDefault: true,
  },
  {
    name: "Caucus Cloud",
    primaryColor: "#ECEFF1",
    secondaryColor: "#B0BEC5",
    textColor: "#263238",
    isDefault: true,
  },
  {
    name: "Protocol Noir",
    primaryColor: "#CFD8DC",
    secondaryColor: "#90A4AE",
    textColor: "#0A0A0A",
    isDefault: true,
  },
];

export const listThemes = query({
  args: {},
  handler: async (ctx) => {
    const themes = await ctx.db.query("themes").collect();

    // If no themes exist, return default themes
    if (themes.length === 0) {
      return DEFAULT_THEMES.map((theme, index) => ({
        _id: `default-${index}` as any,
        _creationTime: Date.now(),
        ...theme,
      }));
    }

    return themes;
  },
});

export const initializeDefaultThemes = mutation({
  args: {},
  handler: async (ctx) => {
    const existingThemes = await ctx.db.query("themes").collect();

    // Only initialize if no themes exist
    if (existingThemes.length === 0) {
      for (const theme of DEFAULT_THEMES) {
        await ctx.db.insert("themes", theme);
      }
    }

    return { initialized: existingThemes.length === 0 };
  },
});

export const createCustomTheme = mutation({
  args: {
    name: v.string(),
    primaryColor: v.string(),
    secondaryColor: v.string(),
    textColor: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to create custom themes");
    }

    return await ctx.db.insert("themes", {
      name: args.name,
      primaryColor: args.primaryColor,
      secondaryColor: args.secondaryColor,
      textColor: args.textColor,
      isDefault: false,
      createdBy: userId,
    });
  },
});

export const updateUserTheme = mutation({
  args: {
    themeName: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to update theme");
    }

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (userProfile) {
      await ctx.db.patch(userProfile._id, {
        defaultTheme: args.themeName,
      });
    }

    return { success: true };
  },
});
