import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

export const listTemplates = query({
  args: {
    type: v.optional(
      v.union(
        v.literal("resolution"),
        v.literal("position_paper"),
        v.literal("working_paper"),
        v.literal("gsl"),
        v.literal("moderated_caucus"),
      ),
    ),
    committeeId: v.optional(v.id("committees")),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("templates");

    if (args.type) {
      query = query.filter((q) => q.eq(q.field("type"), args.type));
    }

    if (args.committeeId) {
      query = query.filter((q) =>
        q.eq(q.field("committeeId"), args.committeeId),
      );
    }

    const templates = await query.collect();

    // Enrich with committee and creator information
    const enrichedTemplates = await Promise.all(
      templates.map(async (template) => {
        const committee = template.committeeId
          ? await ctx.db.get(template.committeeId)
          : null;
        const creator = await ctx.db.get(template.createdBy);

        return {
          ...template,
          committeeName: committee?.name || "General",
          committeeFullName: committee?.fullName || "General Template",
          creatorName: creator?.name || "System",
        };
      }),
    );

    return enrichedTemplates.sort((a, b) => b.usageCount - a.usageCount);
  },
});

export const getTemplate = query({
  args: { templateId: v.id("templates") },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    if (!template) return null;

    const committee = template.committeeId
      ? await ctx.db.get(template.committeeId)
      : null;
    const creator = await ctx.db.get(template.createdBy);

    return {
      ...template,
      committeeName: committee?.name || "General",
      committeeFullName: committee?.fullName || "General Template",
      creatorName: creator?.name || "System",
    };
  },
});

export const createTemplate = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    type: v.union(
      v.literal("resolution"),
      v.literal("position_paper"),
      v.literal("working_paper"),
      v.literal("gsl"),
      v.literal("moderated_caucus"),
    ),
    committeeId: v.optional(v.id("committees")),
    content: v.object({
      preamble: v.array(
        v.object({
          type: v.union(v.literal("clause"), v.literal("citation")),
          text: v.string(),
          citation: v.optional(v.string()),
        }),
      ),
      operative: v.array(
        v.object({
          number: v.number(),
          text: v.string(),
          subClauses: v.array(
            v.object({
              letter: v.string(),
              text: v.string(),
            }),
          ),
        }),
      ),
    }),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.insert("templates", {
      name: args.name,
      description: args.description,
      type: args.type,
      committeeId: args.committeeId,
      content: args.content,
      isPublic: args.isPublic,
      createdBy: userId,
      usageCount: 0,
    });
  },
});

export const useTemplate = mutation({
  args: { templateId: v.id("templates") },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    await ctx.db.patch(args.templateId, {
      usageCount: template.usageCount + 1,
    });

    return template;
  },
});

export const seedDefaultTemplates = mutation({
  args: {},
  handler: async (ctx) => {
    const existingTemplates = await ctx.db.query("templates").first();
    if (existingTemplates) {
      return null;
    }

    // Get system user (first user) or create a system template creator
    const systemUser = await ctx.db.query("users").first();
    if (!systemUser) {
      return null; // Wait for users to be created
    }

    const defaultTemplates = [
      // Resolution Templates
      {
        name: "Security Council Resolution Template",
        description:
          "Standard template for Security Council resolutions addressing international peace and security",
        type: "resolution" as const,
        content: {
          preamble: [
            {
              type: "clause" as const,
              text: "Reaffirming its primary responsibility for the maintenance of international peace and security under the Charter of the United Nations,",
            },
            {
              type: "clause" as const,
              text: "Recalling its previous resolutions on this matter and the relevant provisions of the Charter,",
            },
            {
              type: "clause" as const,
              text: "Expressing grave concern about the deteriorating situation and its impact on regional stability,",
            },
          ],
          operative: [
            {
              number: 1,
              text: "Condemns all acts of violence and calls for their immediate cessation;",
              subClauses: [],
            },
            {
              number: 2,
              text: "Demands that all parties comply with their obligations under international law;",
              subClauses: [],
            },
            {
              number: 3,
              text: "Calls upon the international community to provide humanitarian assistance;",
              subClauses: [],
            },
          ],
        },
        isPublic: true,
        createdBy: systemUser._id,
        usageCount: 0,
      },
      {
        name: "General Assembly Resolution Template",
        description:
          "Comprehensive template for General Assembly resolutions on various global issues",
        type: "resolution" as const,
        content: {
          preamble: [
            {
              type: "clause" as const,
              text: "Guided by the purposes and principles of the Charter of the United Nations,",
            },
            {
              type: "clause" as const,
              text: "Reaffirming the Universal Declaration of Human Rights and relevant international instruments,",
            },
            {
              type: "clause" as const,
              text: "Recognizing the importance of international cooperation in addressing global challenges,",
            },
          ],
          operative: [
            {
              number: 1,
              text: "Reaffirms its commitment to the principles enshrined in the Charter;",
              subClauses: [],
            },
            {
              number: 2,
              text: "Encourages Member States to strengthen their cooperation;",
              subClauses: [],
            },
            {
              number: 3,
              text: "Requests the Secretary-General to submit a comprehensive report;",
              subClauses: [],
            },
          ],
        },
        isPublic: true,
        createdBy: systemUser._id,
        usageCount: 0,
      },
      // Position Paper Template
      {
        name: "Position Paper Template",
        description:
          "Standard format for country position papers outlining national stance on committee topics",
        type: "position_paper" as const,
        content: {
          preamble: [
            {
              type: "clause" as const,
              text: "The delegation of [COUNTRY NAME] recognizes the critical importance of addressing [TOPIC] in the current global context,",
            },
            {
              type: "clause" as const,
              text: "Acknowledging our nation's commitment to multilateral cooperation and the principles of the United Nations Charter,",
            },
            {
              type: "clause" as const,
              text: "Emphasizing our country's unique perspective based on [RELEVANT NATIONAL EXPERIENCE/EXPERTISE],",
            },
          ],
          operative: [
            {
              number: 1,
              text: "National Position: [COUNTRY NAME] believes that effective solutions must prioritize [KEY PRINCIPLE];",
              subClauses: [],
            },
            {
              number: 2,
              text: "Policy Recommendations: We propose the following measures:",
              subClauses: [
                { letter: "a", text: "[Specific policy recommendation 1]" },
                { letter: "b", text: "[Specific policy recommendation 2]" },
                { letter: "c", text: "[Specific policy recommendation 3]" },
              ],
            },
            {
              number: 3,
              text: "International Cooperation: [COUNTRY NAME] is prepared to work with like-minded nations to achieve [SPECIFIC GOALS];",
              subClauses: [],
            },
          ],
        },
        isPublic: true,
        createdBy: systemUser._id,
        usageCount: 0,
      },
      // Working Paper Template
      {
        name: "Working Paper Template",
        description:
          "Template for collaborative working papers during committee sessions",
        type: "working_paper" as const,
        content: {
          preamble: [
            {
              type: "clause" as const,
              text: "The undersigned delegations, working collaboratively to address [TOPIC],",
            },
            {
              type: "clause" as const,
              text: "Recognizing the urgent need for concrete action on this matter,",
            },
            {
              type: "clause" as const,
              text: "Seeking to build consensus among Member States through constructive dialogue,",
            },
          ],
          operative: [
            {
              number: 1,
              text: "Proposes the establishment of [SPECIFIC MECHANISM/PROGRAM];",
              subClauses: [],
            },
            {
              number: 2,
              text: "Recommends the following implementation framework:",
              subClauses: [
                { letter: "a", text: "Timeline: [Specific timeframe]" },
                { letter: "b", text: "Funding: [Funding mechanism]" },
                { letter: "c", text: "Oversight: [Monitoring body]" },
              ],
            },
            {
              number: 3,
              text: "Invites further input from all Member States to refine these proposals;",
              subClauses: [],
            },
          ],
        },
        isPublic: true,
        createdBy: systemUser._id,
        usageCount: 0,
      },
      // GSL Template
      {
        name: "General Speakers List Template",
        description:
          "Template for organizing and managing General Speakers List sessions",
        type: "gsl" as const,
        content: {
          preamble: [
            {
              type: "clause" as const,
              text: "Opening Statement Guidelines: Each delegation will have [TIME LIMIT] to present their country's position on [TOPIC],",
            },
            {
              type: "clause" as const,
              text: "Speaking Order: Delegations will speak in the order they signed up for the General Speakers List,",
            },
            {
              type: "clause" as const,
              text: "Key Points to Address: Delegations are encouraged to cover their national position, proposed solutions, and areas for cooperation,",
            },
          ],
          operative: [
            {
              number: 1,
              text: "Speaker Guidelines:",
              subClauses: [
                { letter: "a", text: "State your country's position clearly" },
                {
                  letter: "b",
                  text: "Propose specific solutions or recommendations",
                },
                {
                  letter: "c",
                  text: "Identify potential areas for collaboration",
                },
                { letter: "d", text: "Respect the time limit strictly" },
              ],
            },
            {
              number: 2,
              text: "Questions and Follow-up: After each speech, there may be time for brief clarifying questions;",
              subClauses: [],
            },
            {
              number: 3,
              text: "Note-taking: Delegations should take detailed notes to inform later negotiations;",
              subClauses: [],
            },
          ],
        },
        isPublic: true,
        createdBy: systemUser._id,
        usageCount: 0,
      },
      // Moderated Caucus Template
      {
        name: "Moderated Caucus Template",
        description:
          "Template for structured moderated caucus sessions on specific sub-topics",
        type: "moderated_caucus" as const,
        content: {
          preamble: [
            {
              type: "clause" as const,
              text: "Moderated Caucus Topic: [SPECIFIC SUB-TOPIC OR ASPECT],",
            },
            {
              type: "clause" as const,
              text: "Duration: [TOTAL TIME] with [INDIVIDUAL SPEAKING TIME] per delegation,",
            },
            {
              type: "clause" as const,
              text: "Purpose: To facilitate focused discussion and identify areas of convergence on [SPECIFIC ISSUE],",
            },
          ],
          operative: [
            {
              number: 1,
              text: "Discussion Focus: This caucus will specifically address:",
              subClauses: [
                { letter: "a", text: "[Specific aspect 1 of the topic]" },
                { letter: "b", text: "[Specific aspect 2 of the topic]" },
                { letter: "c", text: "[Specific aspect 3 of the topic]" },
              ],
            },
            {
              number: 2,
              text: "Speaking Procedure: Delegations will be recognized by the Chair in the order they raise their placards;",
              subClauses: [],
            },
            {
              number: 3,
              text: "Expected Outcomes: By the end of this caucus, we aim to have identified [SPECIFIC GOALS];",
              subClauses: [],
            },
          ],
        },
        isPublic: true,
        createdBy: systemUser._id,
        usageCount: 0,
      },
    ];

    for (const template of defaultTemplates) {
      await ctx.db.insert("templates", template);
    }

    return null;
  },
});
