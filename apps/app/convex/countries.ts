import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

export const listCountries = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("countries").order("asc").collect();
  },
});

export const addCustomCountry = mutation({
  args: {
    name: v.string(),
    region: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if country already exists
    const existing = await ctx.db
      .query("countries")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();

    if (existing) {
      throw new Error("Country already exists");
    }

    // Generate a simple code from the country name
    const code =
      args.name
        .toUpperCase()
        .replace(/[^A-Z]/g, "")
        .substring(0, 3) +
      Math.floor(Math.random() * 100)
        .toString()
        .padStart(2, "0");

    return await ctx.db.insert("countries", {
      name: args.name,
      code: code,
      region: args.region || "Custom",
      isCustom: true,
      addedBy: userId,
    });
  },
});

export const seedDefaultCountries = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if countries already exist
    const existingCountries = await ctx.db.query("countries").first();
    if (existingCountries) {
      return null;
    }

    const defaultCountries = [
      { name: "Afghanistan", code: "AF" },
      { name: "Albania", code: "AL" },
      { name: "Algeria", code: "DZ" },
      { name: "Argentina", code: "AR" },
      { name: "Australia", code: "AU" },
      { name: "Austria", code: "AT" },
      { name: "Bangladesh", code: "BD" },
      { name: "Belgium", code: "BE" },
      { name: "Brazil", code: "BR" },
      { name: "Canada", code: "CA" },
      { name: "China", code: "CN" },
      { name: "Denmark", code: "DK" },
      { name: "Egypt", code: "EG" },
      { name: "France", code: "FR" },
      { name: "Germany", code: "DE" },
      { name: "India", code: "IN" },
      { name: "Indonesia", code: "ID" },
      { name: "Iran", code: "IR" },
      { name: "Iraq", code: "IQ" },
      { name: "Israel", code: "IL" },
      { name: "Italy", code: "IT" },
      { name: "Japan", code: "JP" },
      { name: "Jordan", code: "JO" },
      { name: "Kenya", code: "KE" },
      { name: "Mexico", code: "MX" },
      { name: "Netherlands", code: "NL" },
      { name: "Nigeria", code: "NG" },
      { name: "Norway", code: "NO" },
      { name: "Pakistan", code: "PK" },
      { name: "Poland", code: "PL" },
      { name: "Russia", code: "RU" },
      { name: "Saudi Arabia", code: "SA" },
      { name: "South Africa", code: "ZA" },
      { name: "South Korea", code: "KR" },
      { name: "Spain", code: "ES" },
      { name: "Sweden", code: "SE" },
      { name: "Switzerland", code: "CH" },
      { name: "Turkey", code: "TR" },
      { name: "Ukraine", code: "UA" },
      { name: "United Kingdom", code: "GB" },
      { name: "United States", code: "US" },
    ];

    for (const country of defaultCountries) {
      await ctx.db.insert("countries", {
        name: country.name,
        code: country.code,
        region: "Unknown",
        isCustom: false,
      });
    }

    return null;
  },
});
