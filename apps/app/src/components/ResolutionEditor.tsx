import { useEffect, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface ResolutionEditorProps {
  resolutionId: Id<"resolutions">;
  onBack: () => void;
}

export function ResolutionEditor({
  resolutionId,
  onBack,
}: ResolutionEditorProps) {
  // Check if this is a temporary ID (offline created resolution)
  const isTemporaryId =
    typeof resolutionId === "string" && resolutionId.startsWith("temp-");

  const resolution = useQuery(
    api.resolutions.getResolution,
    isTemporaryId ? "skip" : { resolutionId },
  );
  const userProfile = useQuery(api.users.getUserProfile);
  const allianceSuggestions = useQuery(
    api.alliances.getAllianceSuggestions,
    resolution ? { countryId: resolution.countryId } : "skip",
  );
  const debateNotes = useQuery(
    api.debates.getDebateNotes,
    isTemporaryId ? "skip" : { resolutionId },
  );
  const caucusProposals = useQuery(
    api.caucus.getCaucusProposals,
    isTemporaryId ? "skip" : { resolutionId },
  );

  const updateContent = useMutation(api.resolutions.updateResolutionContent);
  const updateStatus = useMutation(api.resolutions.updateResolutionStatus);
  const generateContent = useAction(api.ai.generateResolutionContent);
  const generateDraftSpeech = useAction(api.ai.generateDraftSpeech);
  const toggleStar = useMutation(api.starring.toggleStar);
  const createDebateNote = useMutation(api.debates.createDebateNote);
  const createCaucusProposal = useMutation(api.caucus.createCaucusProposal);
  const voteOnProposal = useMutation(api.caucus.voteOnProposal);
  const generateAlliances = useMutation(
    api.alliances.generateAllianceSuggestions,
  );

  const [content, setContent] = useState({
    preamble: [] as Array<{
      type: "clause" | "citation";
      text: string;
      citation?: string;
    }>,
    operative: [] as Array<{
      number: number;
      text: string;
      subClauses: Array<{ letter: string; text: string }>;
    }>,
  });

  const [activeSection, setActiveSection] = useState<
    | "preamble"
    | "operative"
    | "actionplan"
    | "citations"
    | "alliances"
    | "caucus"
    | "briefing"
  >("briefing");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [newNote, setNewNote] = useState({ title: "", content: "", tags: "" });
  const [newProposal, setNewProposal] = useState({
    title: "",
    description: "",
  });
  const [briefing, setBriefing] = useState<{
    basicSummary: string;
    speechPreview: string;
  } | null>(null);
  const [draftSpeech, setDraftSpeech] = useState<{
    title: string;
    body: string;
  } | null>(null);
  const [rhetoricInserts, setRhetoricInserts] = useState<Array<{
    headline: string;
    examples: string[];
  }> | null>(null);

  useEffect(() => {
    if (resolution?.content) {
      setContent(resolution.content);
    }
    if (resolution?.briefing) {
      setBriefing(resolution.briefing);
    }
  }, [resolution]);

  useEffect(() => {
    if (resolution?.countryId) {
      generateAlliances({ countryId: resolution.countryId });
    }
  }, [resolution?.countryId, generateAlliances]);

  // Handle temporary/offline resolutions
  if (isTemporaryId) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="border-b border-gray-200 p-6">
            <div className="mb-4 flex items-center justify-between">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to Dashboard
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
                <svg
                  className="h-8 w-8 text-yellow-600"
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
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Resolution Not Available
              </h3>
              <p className="mb-4 text-gray-600">
                This resolution was created offline and cannot be accessed right
                now. Please connect to the internet to view and edit your
                resolutions.
              </p>
              <button
                onClick={onBack}
                className="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const generateDelegateBriefingContent = async () => {
    if (!resolution) return;

    setIsGenerating(true);
    setGenerationError(null); // Clear any previous errors
    try {
      const speechResult = await generateDraftSpeech({
        title: resolution.title || "Untitled Resolution",
        country: resolution.country || "Unknown",
        topic: resolution.topic || "Unknown",
        committee: resolution.committee || "Unknown",
      });

      // Set the speech content
      setDraftSpeech(speechResult.draftSpeech);
      setRhetoricInserts(speechResult.rhetoricInserts);

      // Also set briefing for backward compatibility
      const briefingContent = {
        basicSummary: `Delegate briefing for ${resolution.country || "Unknown"} on ${resolution.topic || "Unknown"}`,
        speechPreview: speechResult.draftSpeech.body.substring(0, 200) + "...",
      };

      setBriefing(briefingContent);

      await updateContent({
        resolutionId,
        content,
        wordCount: calculateWordCount(content.preamble, content.operative),
        briefing: briefingContent,
      });

      toast.success("Delegate briefing generated!");
    } catch (error) {
      console.error("Briefing generation error:", error);

      let errorMessage = "Failed to generate briefing";
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

  const generateFullResolution = async () => {
    if (!resolution || !userProfile) return;

    setIsGenerating(true);
    setGenerationError(null); // Clear any previous errors
    try {
      // Generate both speech and resolution content in parallel
      const [speechResult, aiContent] = await Promise.all([
        generateDraftSpeech({
          title: resolution.title || "Untitled Resolution",
          country: resolution.country || "Unknown",
          topic: resolution.topic || "Unknown",
          committee: resolution.committee || "Unknown",
        }),
        generateContent({
          title: resolution.title || "Untitled Resolution",
          country: resolution.country || "Unknown",
          topic: resolution.topic || "Unknown",
          committee: resolution.committee || "Unknown",
          urgency: "medium" as const,
          focus: "general" as const,
          tone: "diplomatic" as const,
          length: "medium" as const,
          includeStatistics: true,
          includeCitations: true,
        }),
      ]);

      // Set the speech content
      setDraftSpeech(speechResult.draftSpeech);
      setRhetoricInserts(speechResult.rhetoricInserts);

      // Set the resolution content
      setContent({
        preamble: aiContent.preamble,
        operative: aiContent.operative,
      });

      const wordCount = calculateWordCount(
        aiContent.preamble,
        aiContent.operative,
      );
      await updateContent({
        resolutionId,
        content: {
          preamble: aiContent.preamble,
          operative: aiContent.operative,
        },
        wordCount,
        citations: aiContent.citations,
        actionPlan: aiContent.actionPlan,
        recommendedVideo: aiContent.recommendedVideo,
        briefing: briefing || undefined,
      });

      // Switch to briefing section to show the generated speech
      setActiveSection("briefing");
      toast.success("AI-generated speech and resolution content created!");
    } catch (error) {
      console.error("Full resolution generation error:", error);

      let errorMessage = "Failed to generate content";
      if (error instanceof Error) {
        if (error.message.includes("AI_TIMEOUT")) {
          errorMessage = "Generation timed out. Please try again.";
        } else if (error.message.includes("AI_RATE_LIMIT")) {
          errorMessage = "Too many requests. Please wait and try again.";
        } else if (error.message.includes("AI_NO_CONTENT")) {
          errorMessage = "AI didn't generate content. Please try again.";
        }
      }

      setGenerationError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const getSuggestions = async (clauseType: "preamble" | "operative") => {
    if (!resolution) return;

    setIsGenerating(true);
    setGenerationError(null); // Clear any previous errors
    try {
      const existingClauses =
        clauseType === "preamble"
          ? content.preamble.map((c) => c.text)
          : content.operative.map((c) => c.text);

      // Generate actual AI suggestions
      const completion = await generateContent({
        title: resolution.title || "Untitled Resolution",
        country: resolution.country || "Unknown",
        topic: resolution.topic || "Unknown",
        committee: resolution.committee || "Unknown",
        urgency: "medium" as const,
        focus: "general" as const,
        tone: "diplomatic" as const,
        length: "short" as const,
        includeStatistics: false,
        includeCitations: false,
      });

      const aiSuggestions =
        clauseType === "preamble"
          ? completion.preamble.map((c: any) => c.text).slice(0, 5)
          : completion.operative.map((c: any) => c.text).slice(0, 5);

      setSuggestions(aiSuggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Suggestions generation error:", error);

      let errorMessage = "Failed to generate suggestions";
      if (error instanceof Error && error.message.includes("AI_")) {
        errorMessage = "AI generation failed. Please try again.";
      }

      setGenerationError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const addSuggestion = (suggestionText: string) => {
    if (activeSection === "preamble") {
      setContent((prev) => ({
        ...prev,
        preamble: [...prev.preamble, { type: "clause", text: suggestionText }],
      }));
    } else if (activeSection === "operative") {
      const nextNumber = content.operative.length + 1;
      setContent((prev) => ({
        ...prev,
        operative: [
          ...prev.operative,
          { number: nextNumber, text: suggestionText, subClauses: [] },
        ],
      }));
    }
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const starClause = async (
    clauseIndex: number,
    clauseType: "preamble" | "operative",
  ) => {
    try {
      await toggleStar({
        itemType: "clause",
        itemId: `${clauseType}-${clauseIndex}`,
        resolutionId,
      });
      toast.success("Clause starred!");
    } catch (error) {
      toast.error("Failed to star clause");
    }
  };

  const addPreambleClause = () => {
    setContent((prev) => ({
      ...prev,
      preamble: [...prev.preamble, { type: "clause", text: "" }],
    }));
  };

  const addOperativeClause = () => {
    const nextNumber = content.operative.length + 1;
    setContent((prev) => ({
      ...prev,
      operative: [
        ...prev.operative,
        { number: nextNumber, text: "", subClauses: [] },
      ],
    }));
  };

  const updatePreambleClause = (
    index: number,
    updates: Partial<(typeof content.preamble)[0]>,
  ) => {
    setContent((prev) => ({
      ...prev,
      preamble: prev.preamble.map((clause, i) =>
        i === index ? { ...clause, ...updates } : clause,
      ),
    }));
  };

  const updateOperativeClause = (
    index: number,
    updates: Partial<(typeof content.operative)[0]>,
  ) => {
    setContent((prev) => ({
      ...prev,
      operative: prev.operative.map((clause, i) =>
        i === index ? { ...clause, ...updates } : clause,
      ),
    }));
  };

  const deletePreambleClause = (index: number) => {
    setContent((prev) => ({
      ...prev,
      preamble: prev.preamble.filter((_, i) => i !== index),
    }));
  };

  const deleteOperativeClause = (index: number) => {
    setContent((prev) => ({
      ...prev,
      operative: prev.operative
        .filter((_, i) => i !== index)
        .map((clause, i) => ({
          ...clause,
          number: i + 1,
        })),
    }));
  };

  const saveContent = async () => {
    const wordCount = calculateWordCount(content.preamble, content.operative);
    try {
      await updateContent({
        resolutionId,
        content,
        wordCount,
        briefing: briefing || undefined,
      });
      toast.success("Resolution saved!");
    } catch (error) {
      toast.error("Failed to save resolution");
      console.error(error);
    }
  };

  const calculateWordCount = (preamble: any[], operative: any[]) => {
    if (!preamble || !operative) return 0;

    const preambleWords = preamble.reduce(
      (count, clause) =>
        count +
        (clause?.text || "")
          .split(/\s+/)
          .filter((word: string) => word.length > 0).length,
      0,
    );
    const operativeWords = operative.reduce((count, clause) => {
      const clauseWords = (clause?.text || "")
        .split(/\s+/)
        .filter((word: string) => word.length > 0).length;
      const subClauseWords = (clause?.subClauses || []).reduce(
        (subCount: number, subClause: any) =>
          subCount +
          (subClause?.text || "")
            .split(/\s+/)
            .filter((word: string) => word.length > 0).length,
        0,
      );
      return count + clauseWords + subClauseWords;
    }, 0);
    return preambleWords + operativeWords;
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.title.trim() || !newNote.content.trim()) return;

    try {
      await createDebateNote({
        title: newNote.title,
        content: newNote.content,
        tags: newNote.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
        resolutionId,
      });
      setNewNote({ title: "", content: "", tags: "" });
      toast.success("Debate note created!");
    } catch (error) {
      toast.error("Failed to create note");
    }
  };

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProposal.title.trim() || !newProposal.description.trim()) return;

    try {
      await createCaucusProposal({
        resolutionId,
        title: newProposal.title,
        description: newProposal.description,
      });
      setNewProposal({ title: "", description: "" });
      toast.success("Proposal created!");
    } catch (error) {
      toast.error("Failed to create proposal");
    }
  };

  if (!resolution) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="rounded-lg border bg-white shadow-sm">
        <div className="border-b border-gray-200 p-6">
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Dashboard
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={generateFullResolution}
                disabled={isGenerating}
                className="rounded-lg bg-purple-500 px-4 py-2 text-white transition-colors hover:bg-purple-600 disabled:opacity-50"
              >
                {isGenerating ? "Generating..." : "🤖 Generate with AI"}
              </button>
              <span className="text-sm text-gray-500">
                {calculateWordCount(content.preamble, content.operative)} words
              </span>
              <button
                onClick={saveContent}
                className="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          </div>

          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            {resolution.title}
          </h1>
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <span>
              <strong>Country:</strong> {resolution.country || "Unknown"}
            </span>
            <span>
              <strong>Topic:</strong> {resolution.topic || "Unknown"}
            </span>
            <span>
              <strong>Committee:</strong> {resolution.committee || "Unknown"}
            </span>
          </div>
        </div>

        <div className="flex">
          <div className="w-64 border-r border-gray-200 p-4">
            <nav className="space-y-2">
              <button
                onClick={() => setActiveSection("briefing")}
                className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${
                  activeSection === "briefing"
                    ? "border border-blue-200 bg-blue-50 text-blue-700"
                    : "hover:bg-gray-50"
                }`}
              >
                🎯 Delegate Briefing
              </button>
              <button
                onClick={() => setActiveSection("preamble")}
                className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${
                  activeSection === "preamble"
                    ? "border border-blue-200 bg-blue-50 text-blue-700"
                    : "hover:bg-gray-50"
                }`}
              >
                Preambular Clauses
              </button>
              <button
                onClick={() => setActiveSection("operative")}
                className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${
                  activeSection === "operative"
                    ? "border border-blue-200 bg-blue-50 text-blue-700"
                    : "hover:bg-gray-50"
                }`}
              >
                Operative Clauses
              </button>
              <button
                onClick={() => setActiveSection("actionplan")}
                className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${
                  activeSection === "actionplan"
                    ? "border border-blue-200 bg-blue-50 text-blue-700"
                    : "hover:bg-gray-50"
                }`}
              >
                25-Year Action Plan
              </button>
              <button
                onClick={() => setActiveSection("citations")}
                className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${
                  activeSection === "citations"
                    ? "border border-blue-200 bg-blue-50 text-blue-700"
                    : "hover:bg-gray-50"
                }`}
              >
                Citations & Resources
              </button>
              <button
                onClick={() => setActiveSection("alliances")}
                className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${
                  activeSection === "alliances"
                    ? "border border-blue-200 bg-blue-50 text-blue-700"
                    : "hover:bg-gray-50"
                }`}
              >
                🤝 Alliance Suggestions
              </button>
              <button
                onClick={() => setActiveSection("caucus")}
                className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${
                  activeSection === "caucus"
                    ? "border border-blue-200 bg-blue-50 text-blue-700"
                    : "hover:bg-gray-50"
                }`}
              >
                📋 Unmod Caucus
              </button>
            </nav>
          </div>

          <div className="flex-1 p-6">
            {activeSection === "briefing" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    🎯 Delegate Briefing for {resolution.country || "Unknown"}
                  </h3>
                  <div className="flex items-center gap-2">
                    {generationError && (
                      <button
                        onClick={generateDelegateBriefingContent}
                        disabled={isGenerating}
                        className="rounded-lg bg-orange-500 px-3 py-2 text-sm text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
                      >
                        🔄 Retry
                      </button>
                    )}
                    <button
                      onClick={generateDelegateBriefingContent}
                      disabled={isGenerating}
                      className="rounded-lg bg-purple-500 px-4 py-2 text-white transition-colors hover:bg-purple-600 disabled:opacity-50"
                    >
                      {isGenerating ? "Generating..." : "🤖 Generate Briefing"}
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

                {draftSpeech ? (
                  <div className="space-y-6">
                    {/* Draft Speech */}
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
                      <div className="mb-4 flex items-center justify-between">
                        <h4 className="text-lg font-semibold text-blue-900">
                          🎤 Draft Speech
                        </h4>
                        <button
                          onClick={generateDelegateBriefingContent}
                          disabled={isGenerating}
                          className="rounded bg-blue-500 px-3 py-1 text-sm text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
                        >
                          {isGenerating ? "Regenerating..." : "🔄 Regenerate"}
                        </button>
                      </div>
                      <h5 className="mb-4 text-xl font-bold text-blue-900">
                        {draftSpeech.title}
                      </h5>
                      <div className="rounded-lg border border-blue-200 bg-white p-4">
                        <div className="prose prose-blue max-w-none">
                          <p className="whitespace-pre-wrap leading-relaxed text-blue-800">
                            {draftSpeech.body}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Speech Idea Preview */}
                    <div className="rounded-lg border border-green-200 bg-green-50 p-6">
                      <h4 className="mb-4 text-lg font-semibold text-green-900">
                        ✨ Rhetorical Devices
                      </h4>
                      {rhetoricInserts &&
                        rhetoricInserts.map((insert, index) => (
                          <div
                            key={index}
                            className="mb-3 rounded-lg border border-green-200 bg-white p-3"
                          >
                            <h5 className="mb-2 font-medium text-green-900">
                              {insert.headline}
                            </h5>
                            <ul className="space-y-1">
                              {insert.examples.map((example, exampleIndex) => (
                                <li
                                  key={exampleIndex}
                                  className="text-sm italic text-green-800"
                                >
                                  • {example}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                    </div>

                    {/* Quick Reference */}
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
                      <h4 className="mb-4 text-lg font-semibold text-gray-900">
                        🔧 Additional Options
                      </h4>
                      <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                        <div>
                          <h5 className="mb-2 font-medium text-gray-700">
                            Your Country:
                          </h5>
                          <p className="text-gray-600">
                            {resolution.country || "Unknown"}
                          </p>
                        </div>
                        <div>
                          <h5 className="mb-2 font-medium text-gray-700">
                            Topic:
                          </h5>
                          <p className="text-gray-600">
                            {resolution.topic || "Unknown"}
                          </p>
                        </div>
                        <div>
                          <h5 className="mb-2 font-medium text-gray-700">
                            Committee:
                          </h5>
                          <p className="text-gray-600">
                            {resolution.committee || "Unknown"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-gray-500">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                      <span className="text-2xl">🎯</span>
                    </div>
                    <h4 className="mb-2 text-lg font-medium text-gray-900">
                      No briefing generated yet
                    </h4>
                    <p className="mb-4 text-gray-600">
                      Generate a delegate briefing to get your country's
                      position summary and speech talking points.
                    </p>
                    <button
                      onClick={generateDelegateBriefingContent}
                      disabled={isGenerating}
                      className="rounded-lg bg-purple-500 px-4 py-2 text-white transition-colors hover:bg-purple-600 disabled:opacity-50"
                    >
                      {isGenerating ? "Generating..." : "🤖 Generate Briefing"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeSection === "preamble" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Preambular Clauses</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => getSuggestions("preamble")}
                      disabled={isGenerating}
                      className="rounded bg-purple-100 px-3 py-1 text-sm text-purple-700 transition-colors hover:bg-purple-200 disabled:opacity-50"
                    >
                      💡 Get AI Suggestions
                    </button>
                    <button
                      onClick={addPreambleClause}
                      className="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
                    >
                      Add Clause
                    </button>
                  </div>
                </div>

                {showSuggestions && suggestions.length > 0 && (
                  <div className="mb-4 rounded-lg border border-purple-200 bg-purple-50 p-4">
                    <h4 className="mb-3 font-medium text-purple-900">
                      AI Suggestions:
                    </h4>
                    <div className="space-y-2">
                      {suggestions.map((suggestion, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <button
                            onClick={() => addSuggestion(suggestion)}
                            className="rounded bg-purple-500 px-2 py-1 text-sm text-white transition-colors hover:bg-purple-600"
                          >
                            Add
                          </button>
                          <p className="flex-1 text-sm text-purple-800">
                            {suggestion}
                          </p>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setShowSuggestions(false)}
                      className="mt-3 text-sm text-purple-600 hover:text-purple-800"
                    >
                      Close suggestions
                    </button>
                  </div>
                )}

                {content.preamble.map((clause, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-gray-200 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <select
                          value={clause.type}
                          onChange={(e) =>
                            updatePreambleClause(index, {
                              type: e.target.value as "clause" | "citation",
                            })
                          }
                          className="rounded border border-gray-300 px-3 py-1 text-sm"
                        >
                          <option value="clause">Clause</option>
                          <option value="citation">Citation</option>
                        </select>
                        <span className="text-sm text-gray-500">
                          Clause {index + 1}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => starClause(index, "preamble")}
                          className="text-yellow-500 hover:text-yellow-600"
                        >
                          ⭐
                        </button>
                        <button
                          onClick={() => deletePreambleClause(index)}
                          className="text-sm text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={clause.text}
                      onChange={(e) =>
                        updatePreambleClause(index, { text: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      rows={3}
                      placeholder="Enter clause text..."
                    />
                    {clause.type === "citation" && (
                      <input
                        type="text"
                        value={clause.citation || ""}
                        onChange={(e) =>
                          updatePreambleClause(index, {
                            citation: e.target.value,
                          })
                        }
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="Citation source..."
                      />
                    )}
                  </div>
                ))}

                {content.preamble.length === 0 && (
                  <div className="py-8 text-center text-gray-500">
                    <p>
                      No preambular clauses yet. Click "Add Clause" or "Generate
                      with AI" to get started.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeSection === "operative" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    Operative Clauses (C.A.P.S. Format)
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => getSuggestions("operative")}
                      disabled={isGenerating}
                      className="rounded bg-purple-100 px-3 py-1 text-sm text-purple-700 transition-colors hover:bg-purple-200 disabled:opacity-50"
                    >
                      💡 Get AI Suggestions
                    </button>
                    <button
                      onClick={addOperativeClause}
                      className="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
                    >
                      Add Clause
                    </button>
                  </div>
                </div>

                <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <h4 className="mb-2 font-medium text-blue-900">
                    C.A.P.S. Format Guide:
                  </h4>
                  <ul className="space-y-1 text-sm text-blue-800">
                    <li>
                      <strong>Cooperation:</strong> Diplomatic collaboration and
                      partnership measures
                    </li>
                    <li>
                      <strong>Action:</strong> Specific, measurable steps with
                      clear timeframes
                    </li>
                    <li>
                      <strong>Peacebuilding:</strong> Long-term peace,
                      stability, or sustainability policies
                    </li>
                    <li>
                      <strong>Sustainability:</strong> Environmental, economic,
                      or social sustainability measures
                    </li>
                  </ul>
                </div>

                {showSuggestions && suggestions.length > 0 && (
                  <div className="mb-4 rounded-lg border border-purple-200 bg-purple-50 p-4">
                    <h4 className="mb-3 font-medium text-purple-900">
                      AI Suggestions:
                    </h4>
                    <div className="space-y-2">
                      {suggestions.map((suggestion, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <button
                            onClick={() => addSuggestion(suggestion)}
                            className="rounded bg-purple-500 px-2 py-1 text-sm text-white transition-colors hover:bg-purple-600"
                          >
                            Add
                          </button>
                          <p className="flex-1 text-sm text-purple-800">
                            {suggestion}
                          </p>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setShowSuggestions(false)}
                      className="mt-3 text-sm text-purple-600 hover:text-purple-800"
                    >
                      Close suggestions
                    </button>
                  </div>
                )}

                {content.operative.map((clause, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-gray-200 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        {clause.number}.
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => starClause(index, "operative")}
                          className="text-yellow-500 hover:text-yellow-600"
                        >
                          ⭐
                        </button>
                        <button
                          onClick={() => deleteOperativeClause(index)}
                          className="text-sm text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={clause.text}
                      onChange={(e) =>
                        updateOperativeClause(index, { text: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      rows={3}
                      placeholder="Enter operative clause text (consider C.A.P.S. format)..."
                    />
                  </div>
                ))}

                {content.operative.length === 0 && (
                  <div className="py-8 text-center text-gray-500">
                    <p>
                      No operative clauses yet. Click "Add Clause" or "Generate
                      with AI" to get started.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeSection === "alliances" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">
                  🤝 Alliance Suggestions for {resolution.country || "Unknown"}
                </h3>

                {allianceSuggestions && allianceSuggestions.length > 0 ? (
                  <div className="grid gap-4">
                    {allianceSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="rounded-lg border border-gray-200 p-4 transition-colors hover:border-blue-300"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">
                              {suggestion.countryName}
                            </h4>
                            <p className="mt-1 text-sm text-gray-600">
                              {suggestion.reason}
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                              <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700">
                                {suggestion.category}
                              </span>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-500">
                                  Strength:
                                </span>
                                <div className="flex">
                                  {[...Array(10)].map((_, i) => (
                                    <div
                                      key={i}
                                      className={`mr-1 h-2 w-2 rounded-full ${
                                        i < suggestion.strength
                                          ? "bg-green-500"
                                          : "bg-gray-200"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              toggleStar({
                                itemType: "alliance",
                                itemId: suggestion.countryName,
                                resolutionId,
                                notes: `Alliance partner - ${suggestion.reason}`,
                              })
                            }
                            className="text-yellow-500 hover:text-yellow-600"
                            title="Star this alliance suggestion"
                          >
                            ⭐
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-gray-500">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                      <svg
                        className="h-8 w-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </div>
                    <p>Generating alliance suggestions...</p>
                  </div>
                )}
              </div>
            )}

            {activeSection === "caucus" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">📋 Unmoderated Caucus</h3>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <h4 className="mb-3 font-medium text-gray-900">
                    Create New Proposal
                  </h4>
                  <form onSubmit={handleCreateProposal} className="space-y-3">
                    <input
                      type="text"
                      value={newProposal.title}
                      onChange={(e) =>
                        setNewProposal((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Proposal title..."
                    />
                    <textarea
                      value={newProposal.description}
                      onChange={(e) =>
                        setNewProposal((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      rows={3}
                      placeholder="Proposal description..."
                    />
                    <button
                      type="submit"
                      className="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
                    >
                      Submit Proposal
                    </button>
                  </form>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">
                    Active Proposals
                  </h4>
                  {caucusProposals?.map((proposal) => (
                    <div
                      key={proposal._id}
                      className="rounded-lg border border-gray-200 p-4"
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">
                            {proposal.title}
                          </h5>
                          <p className="mt-1 text-sm text-gray-600">
                            {proposal.description}
                          </p>
                          <p className="mt-2 text-xs text-gray-500">
                            By: {proposal.authorName}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              voteOnProposal({ proposalId: proposal._id })
                            }
                            className="flex items-center gap-1 rounded bg-green-100 px-3 py-1 text-green-700 transition-colors hover:bg-green-200"
                          >
                            👍 {proposal.votes}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {(!caucusProposals || caucusProposals.length === 0) && (
                    <div className="py-8 text-center text-gray-500">
                      <p>No proposals yet. Create the first one above!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSection === "actionplan" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">25-Year Action Plan</h3>

                {resolution.actionPlan ? (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-gray-200 p-4">
                      <h4 className="mb-2 font-medium text-gray-900">
                        Years 1-5: Foundation Phase
                      </h4>
                      <p className="text-gray-700">
                        {resolution.actionPlan.years1to5}
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-4">
                      <h4 className="mb-2 font-medium text-gray-900">
                        Years 6-10: Development Phase
                      </h4>
                      <p className="text-gray-700">
                        {resolution.actionPlan.years6to10}
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-4">
                      <h4 className="mb-2 font-medium text-gray-900">
                        Years 11-15: Consolidation Phase
                      </h4>
                      <p className="text-gray-700">
                        {resolution.actionPlan.years11to15}
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-4">
                      <h4 className="mb-2 font-medium text-gray-900">
                        Years 16-25: Sustainability Phase
                      </h4>
                      <p className="text-gray-700">
                        {resolution.actionPlan.years16to25}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-gray-500">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                      <svg
                        className="h-8 w-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                    </div>
                    <p>No action plan generated yet.</p>
                    <p className="mt-1 text-sm">
                      Use "Generate with AI" to create a comprehensive 25-year
                      action plan.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeSection === "citations" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Citations & Resources</h3>

                {resolution.citations && resolution.citations.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Sources:</h4>
                    {resolution.citations.map((citation, index) => (
                      <div
                        key={index}
                        className="rounded-lg border border-gray-200 p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900">
                              {citation.source}
                            </h5>
                            <p className="mt-1 text-sm text-gray-600">
                              Type: {citation.type}
                            </p>
                            {citation.date && (
                              <p className="text-sm text-gray-600">
                                Date: {citation.date}
                              </p>
                            )}
                            {citation.url && (
                              <a
                                href={citation.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1 inline-block text-sm text-blue-500 hover:text-blue-700"
                              >
                                View Source →
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {resolution.recommendedVideo && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <h4 className="mb-2 font-medium text-green-900">
                      🎥 Recommended Video
                    </h4>
                    <div className="space-y-2">
                      <h5 className="font-medium text-gray-900">
                        {resolution.recommendedVideo.title}
                      </h5>
                      <p className="text-sm text-gray-600">
                        Platform: {resolution.recommendedVideo.platform}
                      </p>
                      <p className="text-sm text-gray-700">
                        {resolution.recommendedVideo.justification}
                      </p>
                      <a
                        href={resolution.recommendedVideo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block text-sm text-blue-500 hover:text-blue-700"
                      >
                        Watch Video →
                      </a>
                    </div>
                  </div>
                )}

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <h4 className="mb-3 font-medium text-gray-900">
                    📝 Debate Notes
                  </h4>
                  <form onSubmit={handleCreateNote} className="mb-4 space-y-3">
                    <input
                      type="text"
                      value={newNote.title}
                      onChange={(e) =>
                        setNewNote((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Note title..."
                    />
                    <textarea
                      value={newNote.content}
                      onChange={(e) =>
                        setNewNote((prev) => ({
                          ...prev,
                          content: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      rows={3}
                      placeholder="Note content..."
                    />
                    <input
                      type="text"
                      value={newNote.tags}
                      onChange={(e) =>
                        setNewNote((prev) => ({
                          ...prev,
                          tags: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Tags (comma-separated)..."
                    />
                    <button
                      type="submit"
                      className="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
                    >
                      Add Note
                    </button>
                  </form>

                  <div className="space-y-2">
                    {debateNotes?.slice(0, 3).map((note) => (
                      <div
                        key={note._id}
                        className="rounded border border-gray-200 bg-white p-3"
                      >
                        <h5 className="text-sm font-medium text-gray-900">
                          {note.title}
                        </h5>
                        <p className="mt-1 text-xs text-gray-600">
                          {note.content}
                        </p>
                        {note.tags.length > 0 && (
                          <div className="mt-2 flex gap-1">
                            {note.tags.map((tag, i) => (
                              <span
                                key={i}
                                className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {(!resolution.citations || resolution.citations.length === 0) &&
                  !resolution.recommendedVideo && (
                    <div className="py-12 text-center text-gray-500">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                        <svg
                          className="h-8 w-8 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                          />
                        </svg>
                      </div>
                      <p>No citations or resources yet.</p>
                      <p className="mt-1 text-sm">
                        Use "Generate with AI" to add relevant sources and video
                        recommendations.
                      </p>
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
