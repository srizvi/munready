import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const applicationTables = {
  userProfiles: defineTable({
    userId: v.id("users"),
    username: v.optional(v.string()),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
    school: v.optional(v.string()),
    delegation: v.optional(v.string()),
    nativeLanguage: v.optional(v.string()),
    timezone: v.optional(v.string()),
    defaultTheme: v.optional(v.string()),
    citationPreferences: v.optional(
      v.object({
        preferUNPrimaryDocs: v.boolean(),
        autoUpdateCountryData: v.boolean(),
      }),
    ),
    experienceLevel: v.optional(
      v.union(
        v.literal("Beginner"),
        v.literal("Intermediate"),
        v.literal("Advanced"),
      ),
    ),
    preferredCommittees: v.optional(v.array(v.string())),
    completedSetup: v.optional(v.boolean()),
    setupCompleted: v.optional(v.boolean()),
  }).index("by_user", ["userId"]),

  themes: defineTable({
    name: v.string(),
    primaryColor: v.string(),
    secondaryColor: v.string(),
    textColor: v.string(),
    isDefault: v.optional(v.boolean()),
    createdBy: v.optional(v.id("users")),
  })
    .index("by_name", ["name"])
    .index("by_creator", ["createdBy"]),

  countries: defineTable({
    name: v.string(),
    code: v.string(),
    region: v.optional(v.string()),
    description: v.optional(v.string()),
    isCustom: v.optional(v.boolean()),
    addedBy: v.optional(v.id("users")),
  }).index("by_name", ["name"]),

  topics: defineTable({
    name: v.string(),
    title: v.optional(v.string()),
    description: v.string(),
    category: v.string(),
    difficulty: v.optional(
      v.union(
        v.literal("Beginner"),
        v.literal("Intermediate"),
        v.literal("Advanced"),
      ),
    ),
    tags: v.optional(v.array(v.string())),
    isCustom: v.optional(v.boolean()),
    addedBy: v.optional(v.id("users")),
  })
    .index("by_category", ["category"])
    .index("by_name", ["name"]),

  committees: defineTable({
    name: v.string(),
    fullName: v.string(),
    description: v.optional(v.string()),
    type: v.string(),
    isCustom: v.optional(v.boolean()),
    addedBy: v.optional(v.id("users")),
  })
    .index("by_type", ["type"])
    .index("by_name", ["name"]),

  resolutions: defineTable({
    title: v.string(),
    country: v.optional(v.string()),
    topic: v.optional(v.string()),
    committee: v.optional(v.string()),
    countryId: v.id("countries"),
    topicId: v.id("topics"),
    committeeId: v.id("committees"),
    userId: v.optional(v.id("users")),
    status: v.union(
      v.literal("draft"),
      v.literal("in_progress"),
      v.literal("completed"),
    ),
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
    wordCount: v.number(),
    citations: v.optional(
      v.array(
        v.object({
          source: v.string(),
          url: v.optional(v.string()),
          date: v.optional(v.string()),
          type: v.string(),
        }),
      ),
    ),
    actionPlan: v.optional(
      v.object({
        years1to5: v.string(),
        years6to10: v.string(),
        years11to15: v.string(),
        years16to25: v.string(),
      }),
    ),
    recommendedVideo: v.optional(
      v.object({
        title: v.string(),
        platform: v.string(),
        url: v.string(),
        justification: v.string(),
      }),
    ),
    briefing: v.optional(
      v.object({
        basicSummary: v.string(),
        speechPreview: v.string(),
      }),
    ),
    // Legacy fields for backward compatibility
    authorId: v.optional(v.id("users")),
    lastModified: v.optional(v.number()),
    theme: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_country", ["countryId"])
    .index("by_topic", ["topicId"])
    .index("by_committee", ["committeeId"]),

  templates: defineTable({
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
    createdBy: v.id("users"),
    usageCount: v.number(),
  })
    .index("by_type", ["type"])
    .index("by_committee", ["committeeId"])
    .index("by_creator", ["createdBy"])
    .index("by_public", ["isPublic"]),

  starredItems: defineTable({
    userId: v.id("users"),
    itemType: v.union(
      v.literal("clause"),
      v.literal("alliance"),
      v.literal("note"),
      v.literal("proposal"),
      v.literal("delegate"),
      v.literal("bloc"),
    ),
    itemId: v.string(),
    resolutionId: v.optional(v.id("resolutions")),
    notes: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  allianceData: defineTable({
    countryId: v.id("countries"),
    suggestedAllies: v.array(
      v.object({
        countryId: v.id("countries"),
        reason: v.string(),
        category: v.string(),
        strength: v.number(),
      }),
    ),
    lastUpdated: v.optional(v.number()),
  }).index("by_country", ["countryId"]),

  debateNotes: defineTable({
    authorId: v.id("users"),
    resolutionId: v.optional(v.id("resolutions")),
    title: v.string(),
    content: v.string(),
    tags: v.array(v.string()),
    linkedClause: v.optional(v.string()),
    linkedSpeaker: v.optional(v.string()),
  })
    .index("by_author", ["authorId"])
    .index("by_resolution", ["resolutionId"]),

  caucusProposals: defineTable({
    resolutionId: v.id("resolutions"),
    authorId: v.id("users"),
    title: v.string(),
    description: v.string(),
    votes: v.number(),
    voters: v.array(v.id("users")),
    status: v.optional(v.string()),
  })
    .index("by_resolution", ["resolutionId"])
    .index("by_author", ["authorId"]),

  munChallenges: defineTable({
    title: v.string(),
    description: v.string(),
    category: v.string(),
    points: v.number(),
    isActive: v.boolean(),
    type: v.optional(
      v.union(
        v.literal("daily"),
        v.literal("weekly"),
        v.literal("achievement"),
      ),
    ),
    difficulty: v.optional(
      v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    ),
    requirements: v.optional(
      v.object({
        action: v.string(),
        target: v.number(),
        timeframe: v.optional(v.string()),
      }),
    ),
  }).index("by_type", ["type"]),

  userChallenges: defineTable({
    userId: v.id("users"),
    challengeId: v.id("munChallenges"),
    progress: v.number(),
    completed: v.boolean(),
    completedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_challenge", ["challengeId"])
    .index("by_user_and_challenge", ["userId", "challengeId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
