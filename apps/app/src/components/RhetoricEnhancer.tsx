import { useState } from "react";
import { useAction } from "convex/react";
import { toast } from "sonner";

import { api } from "../../convex/_generated/api";

interface RhetoricEnhancerProps {
  onRhetoricGenerated?: (rhetoric: RhetoricSuggestion[]) => void;
}

interface RhetoricSuggestion {
  type: "question" | "repetition" | "emotive" | "contrast";
  headline: string;
  examples: string[];
}

export function RhetoricEnhancer({
  onRhetoricGenerated,
}: RhetoricEnhancerProps) {
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [rhetoric, setRhetoric] = useState<RhetoricSuggestion[]>([]);
  const [showResults, setShowResults] = useState(false);

  const generateRhetoric = useAction(api.ai.generateRhetoricDevices);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!topic.trim()) {
      toast.error("Please enter a speech topic");
      return;
    }

    setIsGenerating(true);
    setGenerationError(null); // Clear any previous errors

    try {
      const result = await generateRhetoric({ topic: topic.trim() });
      setRhetoric(result);
      setShowResults(true);
      onRhetoricGenerated?.(result);
      toast.success("Rhetorical devices generated successfully!");
    } catch (error) {
      console.error("Rhetoric generation error:", error);

      let errorMessage = "Failed to generate rhetoric. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes("AI_TIMEOUT")) {
          errorMessage = "Generation timed out. Please try again.";
        } else if (error.message.includes("AI_RATE_LIMIT")) {
          errorMessage =
            "Too many requests. Please wait a moment and try again.";
        } else if (error.message.includes("AI_NO_CONTENT")) {
          errorMessage = "AI didn't generate content. Please try again.";
        } else if (error.message.includes("AI_GENERAL_ERROR")) {
          errorMessage = "Generation failed. Please try again.";
        }
      }

      setGenerationError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const getRhetoricIcon = (type: string) => {
    switch (type) {
      case "question":
        return "❓";
      case "repetition":
        return "🔄";
      case "emotive":
        return "💭";
      case "contrast":
        return "⚖️";
      default:
        return "💬";
    }
  };

  const getRhetoricColor = (type: string) => {
    switch (type) {
      case "question":
        return "bg-blue-50 border-blue-200";
      case "repetition":
        return "bg-green-50 border-green-200";
      case "emotive":
        return "bg-purple-50 border-purple-200";
      case "contrast":
        return "bg-orange-50 border-orange-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 p-6">
        <div className="mb-2 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500">
            <span className="text-lg text-white">🎭</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              AI Rhetoric Enhancer
            </h2>
            <p className="text-gray-600">
              Generate powerful rhetorical devices for your speeches
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {!showResults ? (
          <form onSubmit={handleGenerate} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Speech Topic *
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                placeholder="e.g., nuclear disarmament, refugee crisis, climate change..."
                required
              />
              <p className="mt-2 text-sm text-gray-500">
                Enter the main topic of your speech to generate tailored
                rhetorical devices
              </p>
            </div>

            <div className="rounded-lg bg-gradient-to-r from-purple-50 to-indigo-50 p-4">
              <h3 className="mb-2 font-medium text-purple-900">
                🎯 What You'll Get:
              </h3>
              <div className="grid grid-cols-1 gap-3 text-sm text-purple-800 md:grid-cols-2">
                <div className="flex items-center gap-2">
                  <span>❓</span>
                  <span>Powerful rhetorical questions</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🔄</span>
                  <span>Repetition & parallelism</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>💭</span>
                  <span>Emotive appeals</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>⚖️</span>
                  <span>Compelling contrasts</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 px-6 py-3 text-white transition-all hover:from-purple-600 hover:to-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Generating Rhetoric...
                </>
              ) : (
                <>
                  <span className="text-lg">🎭</span>
                  Generate Rhetorical Devices
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Rhetorical Devices for: "{topic}"
                </h3>
                <p className="text-gray-600">
                  Click any example to copy to clipboard
                </p>
              </div>
              <div className="flex items-center gap-2">
                {generationError && (
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="rounded-lg bg-orange-500 px-3 py-2 text-sm text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
                  >
                    🔄 Retry
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowResults(false);
                    setTopic("");
                    setRhetoric([]);
                    setGenerationError(null);
                  }}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200"
                >
                  Generate New
                </button>
              </div>
            </div>

            {generationError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  <p className="text-sm text-red-800">{generationError}</p>
                </div>
              </div>
            )}

            <div className="grid gap-6">
              {rhetoric.map((item, index) => (
                <div
                  key={index}
                  className={`rounded-lg border p-5 ${getRhetoricColor(item.type)}`}
                >
                  <div className="mb-4 flex items-center gap-3">
                    <span className="text-2xl">
                      {getRhetoricIcon(item.type)}
                    </span>
                    <div>
                      <h4 className="font-semibold capitalize text-gray-900">
                        {item.type === "question"
                          ? "Rhetorical Questions"
                          : item.type === "repetition"
                            ? "Repetition & Parallelism"
                            : item.type === "emotive"
                              ? "Emotive Appeals"
                              : "Compelling Contrasts"}
                      </h4>
                      <p className="text-sm text-gray-600">{item.headline}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {item.examples.map((example, exampleIndex) => (
                      <div
                        key={exampleIndex}
                        onClick={() => copyToClipboard(example)}
                        className="group cursor-pointer rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-gray-300 hover:shadow-sm"
                      >
                        <div className="flex items-start justify-between">
                          <p className="flex-1 pr-3 italic text-gray-800">
                            "{example}"
                          </p>
                          <div className="opacity-0 transition-opacity group-hover:opacity-100">
                            <svg
                              className="h-4 w-4 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-lg bg-blue-50 p-4">
              <h4 className="mb-2 font-medium text-blue-900">💡 Usage Tips:</h4>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>
                  • Use rhetorical questions to engage your audience and prompt
                  reflection
                </li>
                <li>• Employ repetition at key moments for maximum impact</li>
                <li>• Balance emotive appeals with factual arguments</li>
                <li>
                  • Use contrasts to clarify your position and highlight urgency
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
