import { v } from "convex/values";
import OpenAI from "openai";

import { action } from "./_generated/server";

const openai = new OpenAI({
  baseURL: process.env.CONVEX_OPENAI_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
});

// Fallback content generators
const generateFallbackResolution = (args: any) => {
  const { title, country, topic, committee, focus } = args;

  const preambleTemplates = [
    `Recognizing the urgent need to address ${topic} in the context of international cooperation`,
    `Noting with concern the current challenges facing the global community regarding ${topic}`,
    `Acknowledging the vital role of ${country} in promoting sustainable solutions`,
    `Emphasizing the importance of multilateral dialogue and cooperation`,
    `Reaffirming the principles of the United Nations Charter`,
  ];

  const operativeTemplates = [
    `Calls upon all Member States to strengthen their commitment to addressing ${topic}`,
    `Requests the Secretary-General to establish a comprehensive framework for action`,
    `Encourages international cooperation and knowledge sharing among nations`,
    `Decides to allocate necessary resources for implementation of this resolution`,
    `Invites all stakeholders to participate actively in the proposed initiatives`,
  ];

  return {
    preamble: preambleTemplates.map((text, index) => ({
      type: "clause" as const,
      text,
    })),
    operative: operativeTemplates.map((text, index) => ({
      number: index + 1,
      text,
      subClauses: [],
    })),
  };
};

const generateFallbackSpeech = (args: any) => {
  const { title, country, topic, committee } = args;

  const speechBody = `Honorable Chair, distinguished delegates,

${country} stands before this esteemed ${committee} today to address the critical issue of ${topic}. This matter requires our immediate attention and collective action.

Our nation recognizes that ${topic} presents both challenges and opportunities for the international community. We must work together to find sustainable solutions that benefit all Member States.

${country} proposes a comprehensive approach that includes:

First, strengthening international cooperation through enhanced dialogue and partnership mechanisms.

Second, implementing evidence-based policies that address the root causes of this issue.

Third, ensuring adequate resources and technical assistance are available to all nations, particularly developing countries.

Fourth, establishing clear monitoring and evaluation frameworks to track our progress.

We believe that through unity, determination, and shared responsibility, we can overcome the challenges posed by ${topic}. ${country} stands ready to work with all delegations to achieve meaningful results.

Thank you, Chair.`;

  const rhetoricDevices = [
    {
      headline: "Powerful questions that engage the assembly",
      examples: [
        "Can we afford to delay action on this critical issue any longer?",
        "What legacy will we leave for future generations if we fail to act today?",
        "How can we justify inaction when the stakes are so high?",
      ],
    },
    {
      headline: "Repetitive structures that emphasize key points",
      examples: [
        "We must act with courage, we must act with unity, we must act now.",
        "This is our moment, this is our responsibility, this is our opportunity.",
        "Together we stand, together we decide, together we succeed.",
      ],
    },
    {
      headline: "Emotional appeals that inspire action",
      examples: [
        "The time for half-measures has passed; bold action is required.",
        "We owe it to those who cannot speak for themselves to be their voice.",
        "History will judge us not by our words, but by our actions.",
      ],
    },
    {
      headline: "Clear contrasts that highlight the choice before us",
      examples: [
        "We can choose progress over stagnation, hope over despair.",
        "While others debate, we must act; while others hesitate, we must lead.",
        "The choice is clear: unity or division, cooperation or conflict.",
      ],
    },
  ];

  return {
    draftSpeech: {
      title: `${country}'s Position on ${topic}`,
      body: speechBody,
    },
    rhetoricInserts: rhetoricDevices,
  };
};

const generateFallbackRhetoric = (topic: string) => {
  return [
    {
      type: "question",
      headline: "Thought-provoking questions that challenge the status quo",
      examples: [
        `How can we justify inaction on ${topic} when the stakes are so high?`,
        `What will future generations say if we fail to address ${topic} today?`,
        `Can we truly call ourselves leaders if we ignore this critical issue?`,
      ],
    },
    {
      type: "repetition",
      headline: "Powerful repetition that reinforces our commitment",
      examples: [
        "We must act with courage, with unity, with urgency.",
        "This is our moment, our responsibility, our opportunity to lead.",
        "Every day we delay, every hour we hesitate, every moment we wait costs us dearly.",
      ],
    },
    {
      type: "emotive",
      headline: "Appeals that connect with human dignity and shared values",
      examples: [
        `Behind every statistic about ${topic} is a human life, a dream, a future at stake.`,
        "We speak not just as diplomats, but as guardians of human dignity.",
        "The eyes of history are upon us, and we must not look away.",
      ],
    },
    {
      type: "contrast",
      headline: "Sharp distinctions that clarify the choice before us",
      examples: [
        "We can choose progress over stagnation, hope over despair.",
        "While others debate, we must act; while others hesitate, we must lead.",
        `The question is not whether we can afford to act on ${topic}, but whether we can afford not to.`,
      ],
    },
  ];
};

// Enhanced retry logic with exponential backoff
const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
): Promise<T> => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Max retries exceeded");
};

export const generateResolutionContent = action({
  args: {
    title: v.string(),
    committee: v.string(),
    topic: v.string(),
    country: v.string(),
    urgency: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    focus: v.union(
      v.literal("general"),
      v.literal("economic"),
      v.literal("security"),
      v.literal("humanitarian"),
      v.literal("environmental"),
    ),
    tone: v.union(
      v.literal("diplomatic"),
      v.literal("assertive"),
      v.literal("collaborative"),
    ),
    length: v.union(v.literal("short"), v.literal("medium"), v.literal("long")),
    includeStatistics: v.boolean(),
    includeCitations: v.boolean(),
    customInstructions: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const prompt = `Generate a UN-style resolution with the following specifications:

Title: ${args.title}
Committee: ${args.committee}
Topic: ${args.topic}
Country/Delegation: ${args.country}
Urgency Level: ${args.urgency}
Focus Area: ${args.focus}
Tone: ${args.tone}
Length: ${args.length}
Include Statistics: ${args.includeStatistics}
Include Citations: ${args.includeCitations}
${args.customInstructions ? `Custom Instructions: ${args.customInstructions}` : ""}

Please generate a professional resolution with:
1. Preambular clauses (starting with words like "Recognizing", "Noting", "Concerned", etc.)
2. Operative clauses (numbered, starting with action words like "Calls upon", "Requests", "Decides", etc.)
3. Appropriate diplomatic language
4. ${args.includeStatistics ? "Relevant statistics where appropriate" : "No specific statistics required"}
5. ${args.includeCitations ? "Proper citations in UN format" : "No citations required"}

Format the response as JSON with this structure:
{
  "preamble": [
    {"type": "clause", "text": "clause text here"},
    {"type": "citation", "text": "clause text", "citation": "source"}
  ],
  "operative": [
    {"number": 1, "text": "operative clause text", "subClauses": [{"letter": "a", "text": "sub-clause text"}]}
  ]
}`;

    // Strategy 1: Try primary AI with retries
    try {
      const result = await retryWithBackoff(
        async () => {
          const completion = await openai.chat.completions.create({
            model: "gpt-4.1-nano",
            messages: [
              {
                role: "system",
                content:
                  "You are an expert UN resolution writer. Generate professional, diplomatic resolutions following proper UN format and language conventions. Always respond with valid JSON.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            temperature: 0.7,
            max_tokens: 2000,
            stream: false,
          });

          const content = completion.choices[0].message.content;
          if (!content) {
            throw new Error("No content generated");
          }

          // Try to parse as JSON
          try {
            return JSON.parse(content);
          } catch {
            throw new Error("Invalid JSON response");
          }
        },
        3,
        1000,
      );

      return result;
    } catch (primaryError) {
      console.warn("Primary AI failed, using fallback strategy:", primaryError);
    }

    // Strategy 2: Try with simpler prompt
    try {
      const result = await retryWithBackoff(
        async () => {
          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content:
                  "Generate a UN resolution in JSON format. Be concise and diplomatic.",
              },
              {
                role: "user",
                content: `Create a resolution about ${args.topic} for ${args.country}. Return JSON with preamble and operative arrays.`,
              },
            ],
            temperature: 0.5,
            max_tokens: 1500,
            stream: false,
          });

          const content = completion.choices[0].message.content;
          if (!content) {
            throw new Error("No content generated");
          }

          try {
            return JSON.parse(content);
          } catch {
            throw new Error("Invalid JSON response");
          }
        },
        2,
        1500,
      );

      return result;
    } catch (secondaryError) {
      console.warn(
        "Secondary AI failed, using guaranteed fallback:",
        secondaryError,
      );
    }

    // Strategy 3: Guaranteed fallback - always succeeds
    console.log("Using guaranteed fallback content generation");
    return generateFallbackResolution(args);
  },
});

export const generateDraftSpeech = action({
  args: {
    title: v.string(),
    committee: v.string(),
    topic: v.string(),
    country: v.string(),
  },
  handler: async (ctx, args) => {
    const speechPrompt = `Generate a compelling UN-style diplomatic speech for the following context:

Title: ${args.title}
Committee: ${args.committee}
Topic: ${args.topic}
Country/Delegation: ${args.country}

Create a full draft speech that:
1. Opens with a strong diplomatic greeting
2. Clearly states the country's position
3. Addresses key aspects of the topic
4. Uses appropriate diplomatic language
5. Concludes with a call to action
6. Is 3-4 minutes long when spoken (approximately 400-500 words)

Format as JSON:
{
  "title": "Speech title that captures the main message",
  "body": "Full speech text with proper diplomatic formatting and structure"
}`;

    const rhetoricPrompt = `Generate powerful rhetorical devices for a UN-style diplomatic speech on the topic: "${args.topic}"

Create 4 categories of rhetorical devices, each with:
1. A headline sentence summarizing the rhetorical style
2. 2-3 specific examples tailored to the topic

Categories needed:
1. Rhetorical Questions - Challenging questions that provoke thought
2. Repetition/Parallelism - Repeated structures for emphasis
3. Emotive Appeals - Statements that inspire and move the audience
4. Contrasts - Sharp comparisons that clarify positions

Format as JSON:
[
  {
    "headline": "headline about rhetorical questions for this topic",
    "examples": ["example 1", "example 2", "example 3"]
  },
  {
    "headline": "headline about repetition/parallelism for this topic",
    "examples": ["example 1", "example 2", "example 3"]
  },
  {
    "headline": "headline about emotive appeals for this topic", 
    "examples": ["example 1", "example 2", "example 3"]
  },
  {
    "headline": "headline about contrasts for this topic",
    "examples": ["example 1", "example 2", "example 3"]
  }
]`;

    // Strategy 1: Try primary AI with parallel requests
    try {
      const [speechResult, rhetoricResult] = await Promise.all([
        retryWithBackoff(
          async () => {
            const completion = await openai.chat.completions.create({
              model: "gpt-4.1-nano",
              messages: [
                {
                  role: "system",
                  content:
                    "You are an expert UN speechwriter. Generate compelling, diplomatic speeches in valid JSON format.",
                },
                {
                  role: "user",
                  content: speechPrompt,
                },
              ],
              temperature: 0.7,
              max_tokens: 1500,
              stream: false,
            });

            const content = completion.choices[0].message.content;
            if (!content) throw new Error("No speech content");

            try {
              return JSON.parse(content);
            } catch {
              return {
                title: `${args.country}'s Position on ${args.topic}`,
                body: content,
              };
            }
          },
          3,
          1000,
        ),

        retryWithBackoff(
          async () => {
            const completion = await openai.chat.completions.create({
              model: "gpt-4.1-nano",
              messages: [
                {
                  role: "system",
                  content:
                    "You are an expert in diplomatic rhetoric. Generate rhetorical devices in valid JSON format.",
                },
                {
                  role: "user",
                  content: rhetoricPrompt,
                },
              ],
              temperature: 0.8,
              max_tokens: 1000,
              stream: false,
            });

            const content = completion.choices[0].message.content;
            if (!content) throw new Error("No rhetoric content");

            try {
              return JSON.parse(content);
            } catch {
              throw new Error("Invalid rhetoric JSON");
            }
          },
          3,
          1000,
        ),
      ]);

      return {
        draftSpeech: speechResult,
        rhetoricInserts: rhetoricResult,
      };
    } catch (primaryError) {
      console.warn(
        "Primary speech generation failed, trying backup:",
        primaryError,
      );
    }

    // Strategy 2: Try simpler approach
    try {
      const result = await retryWithBackoff(
        async () => {
          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content:
                  "Generate a diplomatic speech and rhetorical devices. Be concise.",
              },
              {
                role: "user",
                content: `Create a UN speech for ${args.country} about ${args.topic}. Include rhetorical devices.`,
              },
            ],
            temperature: 0.6,
            max_tokens: 1200,
            stream: false,
          });

          const content = completion.choices[0].message.content;
          if (!content) throw new Error("No content");

          // Parse or create structured response
          const fallback = generateFallbackSpeech(args);
          return {
            draftSpeech: {
              title: fallback.draftSpeech.title,
              body: content.length > 100 ? content : fallback.draftSpeech.body,
            },
            rhetoricInserts: fallback.rhetoricInserts,
          };
        },
        2,
        1500,
      );

      return result;
    } catch (secondaryError) {
      console.warn(
        "Secondary speech generation failed, using guaranteed fallback:",
        secondaryError,
      );
    }

    // Strategy 3: Guaranteed fallback - always succeeds
    console.log("Using guaranteed fallback speech generation");
    return generateFallbackSpeech(args);
  },
});

export const generateRhetoricDevices = action({
  args: {
    topic: v.string(),
  },
  handler: async (ctx, args) => {
    const prompt = `Generate powerful rhetorical devices for a UN-style diplomatic speech on the topic: "${args.topic}"

Create 4 categories of rhetorical devices, each with:
1. A headline sentence summarizing the rhetorical style
2. 2-3 specific examples tailored to the topic

Categories needed:
1. Rhetorical Questions - Challenging questions that provoke thought
2. Repetition/Parallelism - Repeated structures for emphasis
3. Emotive Appeals - Statements that inspire and move the audience
4. Contrasts - Sharp comparisons that clarify positions

The tone must be:
- Formal and diplomatic
- Appropriate for UN debate
- Impactful and memorable
- Respectful of international protocol

Format as JSON:
[
  {
    "type": "question",
    "headline": "headline about rhetorical questions for this topic",
    "examples": ["example 1", "example 2", "example 3"]
  },
  {
    "type": "repetition", 
    "headline": "headline about repetition/parallelism for this topic",
    "examples": ["example 1", "example 2", "example 3"]
  },
  {
    "type": "emotive",
    "headline": "headline about emotive appeals for this topic", 
    "examples": ["example 1", "example 2", "example 3"]
  },
  {
    "type": "contrast",
    "headline": "headline about contrasts for this topic",
    "examples": ["example 1", "example 2", "example 3"]
  }
]`;

    // Strategy 1: Try primary AI with retries
    try {
      const result = await retryWithBackoff(
        async () => {
          const completion = await openai.chat.completions.create({
            model: "gpt-4.1-nano",
            messages: [
              {
                role: "system",
                content:
                  "You are an expert in diplomatic rhetoric and UN-style debate. Generate powerful, appropriate rhetorical devices in valid JSON format.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            temperature: 0.8,
            max_tokens: 1000,
            stream: false,
          });

          const content = completion.choices[0].message.content;
          if (!content) {
            throw new Error("No content generated");
          }

          try {
            return JSON.parse(content);
          } catch {
            throw new Error("Invalid JSON response");
          }
        },
        3,
        1000,
      );

      return result;
    } catch (primaryError) {
      console.warn(
        "Primary rhetoric generation failed, trying backup:",
        primaryError,
      );
    }

    // Strategy 2: Try simpler approach
    try {
      const result = await retryWithBackoff(
        async () => {
          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content:
                  "Generate rhetorical devices for diplomatic speeches in JSON format.",
              },
              {
                role: "user",
                content: `Create rhetorical devices for a speech about ${args.topic}. Include questions, repetition, emotional appeals, and contrasts.`,
              },
            ],
            temperature: 0.7,
            max_tokens: 800,
            stream: false,
          });

          const content = completion.choices[0].message.content;
          if (!content) throw new Error("No content");

          try {
            return JSON.parse(content);
          } catch {
            throw new Error("Invalid JSON");
          }
        },
        2,
        1500,
      );

      return result;
    } catch (secondaryError) {
      console.warn(
        "Secondary rhetoric generation failed, using guaranteed fallback:",
        secondaryError,
      );
    }

    // Strategy 3: Guaranteed fallback - always succeeds
    console.log("Using guaranteed fallback rhetoric generation");
    return generateFallbackRhetoric(args.topic);
  },
});
