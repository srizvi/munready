import { useEffect, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { syncService } from "../lib/syncService";
import { useNetworkStatus } from "../lib/useNetworkStatus";
import { RhetoricEnhancer } from "./RhetoricEnhancer";

interface CreateResolutionProps {
  onResolutionCreated: (id: Id<"resolutions">) => void;
}

export function CreateResolution({
  onResolutionCreated,
}: CreateResolutionProps) {
  const [activeTab, setActiveTab] = useState<"resolution" | "rhetoric">(
    "resolution",
  );
  const [formData, setFormData] = useState({
    title: "",
    committee: "",
    topic: "",
    country: "",
    urgency: "medium" as "low" | "medium" | "high",
    focus: "general" as
      | "general"
      | "economic"
      | "security"
      | "humanitarian"
      | "environmental",
    tone: "diplomatic" as "diplomatic" | "assertive" | "collaborative",
    length: "medium" as "short" | "medium" | "long",
    includeStatistics: true,
    includeCitations: true,
    customInstructions: "",
  });

  const [showCustomCountry, setShowCustomCountry] = useState(false);
  const [showCustomCommittee, setShowCustomCommittee] = useState(false);
  const [showCustomTopic, setShowCustomTopic] = useState(false);
  const [customCountry, setCustomCountry] = useState("");
  const [customCommittee, setCustomCommittee] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { isOnline } = useNetworkStatus();

  const countries = useQuery(api.countries.listCountries);
  const committees = useQuery(api.committees.listCommittees);
  const topics = useQuery(api.topics.listTopics);
  const createResolution = useMutation(api.resolutions.createResolution);
  const generateResolutionContent = useAction(api.ai.generateResolutionContent);
  const addCountry = useMutation(api.countries.addCustomCountry);
  const addCommittee = useMutation(api.committees.addCustomCommittee);
  const addTopic = useMutation(api.topics.addCustomTopic);

  const handleCustomCountryAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!customCountry.trim()) return;

    try {
      await addCountry({
        name: customCountry.trim(),
        region: "Custom",
      });
      setFormData((prev) => ({ ...prev, country: customCountry.trim() }));
      setCustomCountry("");
      setShowCustomCountry(false);
      toast.success("Country added successfully!");
    } catch (error) {
      toast.error("Failed to add country");
      console.error(error);
    }
  };

  const handleCustomCommitteeAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!customCommittee.trim()) return;

    try {
      await addCommittee({
        name: customCommittee.trim(),
        fullName: customCommittee.trim(),
      });
      setFormData((prev) => ({ ...prev, committee: customCommittee.trim() }));
      setCustomCommittee("");
      setShowCustomCommittee(false);
      toast.success("Committee added successfully!");
    } catch (error) {
      toast.error("Failed to add committee");
      console.error(error);
    }
  };

  const handleCustomTopicAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!customTopic.trim()) return;

    try {
      await addTopic({
        name: customTopic.trim(),
        category: "General",
      });
      setFormData((prev) => ({ ...prev, topic: customTopic.trim() }));
      setCustomTopic("");
      setShowCustomTopic(false);
      toast.success("Topic added successfully!");
    } catch (error) {
      toast.error("Failed to add topic");
      console.error(error);
    }
  };

  const handleCustomCountryKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCustomCountryAdd(e as any);
    }
  };

  const handleCustomCommitteeKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCustomCommitteeAdd(e as any);
    }
  };

  const handleCustomTopicKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCustomTopicAdd(e as any);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.title.trim() ||
      !formData.committee ||
      !formData.topic ||
      !formData.country
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsGenerating(true);

    try {
      if (isOnline) {
        // Online: Create resolution normally
        const selectedCountry = countries?.find(
          (c) => c.name === formData.country,
        );
        const selectedCommittee = committees?.find(
          (c) => c.name === formData.committee,
        );
        const selectedTopic = topics?.find((t) => t.name === formData.topic);

        if (!selectedCountry || !selectedCommittee || !selectedTopic) {
          toast.error("Please ensure all selections are valid");
          return;
        }

        const resolutionId = await createResolution({
          title: formData.title,
          countryId: selectedCountry._id,
          topicId: selectedTopic._id,
          committeeId: selectedCommittee._id,
          country: formData.country,
          topic: formData.topic,
          committee: formData.committee,
        });

        toast.success("Resolution created successfully!");
        onResolutionCreated(resolutionId);
      } else {
        // Offline: Show message and don't create resolution
        toast.error(
          "You need to be online to create new resolutions. Please check your internet connection and try again.",
        );
      }
    } catch (error) {
      toast.error("Failed to create resolution");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* Offline Warning */}
      {!isOnline && (
        <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 text-yellow-600"
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
            <span className="font-medium text-yellow-800">
              You're currently offline
            </span>
          </div>
          <p className="mt-1 text-sm text-yellow-700">
            You need an internet connection to create new resolutions. Please
            connect to the internet and try again.
          </p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("resolution")}
              className={`border-b-2 px-1 py-2 text-sm font-medium ${
                activeTab === "resolution"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">🤖</span>
                Resolution Generator
              </div>
            </button>
            <button
              onClick={() => setActiveTab("rhetoric")}
              className={`border-b-2 px-1 py-2 text-sm font-medium ${
                activeTab === "rhetoric"
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">🎭</span>
                Rhetoric Enhancer
              </div>
            </button>
          </nav>
        </div>
      </div>

      {activeTab === "rhetoric" ? (
        <RhetoricEnhancer />
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900">
              🤖 AI Resolution Generator
            </h2>
            <p className="mt-1 text-gray-600">
              Create professional resolutions with AI assistance
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Basic Information
              </h3>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Resolution Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g., Strengthening International Cooperation on Climate Change"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* Committee Selection */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Committee *
                  </label>
                  <div className="space-y-2">
                    <select
                      value={formData.committee}
                      onChange={(e) => {
                        if (e.target.value === "custom") {
                          setShowCustomCommittee(true);
                        } else {
                          setFormData((prev) => ({
                            ...prev,
                            committee: e.target.value,
                          }));
                        }
                      }}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Committee</option>
                      {committees?.map((committee) => (
                        <option key={committee._id} value={committee.name}>
                          {committee.name} - {committee.fullName}
                        </option>
                      ))}
                      <option value="custom">+ Add Custom Committee</option>
                    </select>

                    {showCustomCommittee && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customCommittee}
                          onChange={(e) => setCustomCommittee(e.target.value)}
                          onKeyPress={handleCustomCommitteeKeyPress}
                          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          placeholder="Enter committee name..."
                        />
                        <button
                          type="button"
                          onClick={handleCustomCommitteeAdd}
                          className="rounded-lg bg-blue-500 px-3 py-2 text-white transition-colors hover:bg-blue-600"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCustomCommittee(false)}
                          className="rounded-lg bg-gray-300 px-3 py-2 text-gray-700 transition-colors hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Topic Selection */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Topic *
                  </label>
                  <div className="space-y-2">
                    <select
                      value={formData.topic}
                      onChange={(e) => {
                        if (e.target.value === "custom") {
                          setShowCustomTopic(true);
                        } else {
                          setFormData((prev) => ({
                            ...prev,
                            topic: e.target.value,
                          }));
                        }
                      }}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Topic</option>
                      {topics?.map((topic) => (
                        <option key={topic._id} value={topic.name}>
                          {topic.name}
                        </option>
                      ))}
                      <option value="custom">+ Add Custom Topic</option>
                    </select>

                    {showCustomTopic && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customTopic}
                          onChange={(e) => setCustomTopic(e.target.value)}
                          onKeyPress={handleCustomTopicKeyPress}
                          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          placeholder="Enter topic name..."
                        />
                        <button
                          type="button"
                          onClick={handleCustomTopicAdd}
                          className="rounded-lg bg-blue-500 px-3 py-2 text-white transition-colors hover:bg-blue-600"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCustomTopic(false)}
                          className="rounded-lg bg-gray-300 px-3 py-2 text-gray-700 transition-colors hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Country Selection */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Country/Delegation *
                  </label>
                  <div className="space-y-2">
                    <select
                      value={formData.country}
                      onChange={(e) => {
                        if (e.target.value === "custom") {
                          setShowCustomCountry(true);
                        } else {
                          setFormData((prev) => ({
                            ...prev,
                            country: e.target.value,
                          }));
                        }
                      }}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Country</option>
                      {countries?.map((country) => (
                        <option key={country._id} value={country.name}>
                          {country.name}
                        </option>
                      ))}
                      <option value="custom">+ Add Custom Country</option>
                    </select>

                    {showCustomCountry && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customCountry}
                          onChange={(e) => setCustomCountry(e.target.value)}
                          onKeyPress={handleCustomCountryKeyPress}
                          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          placeholder="Enter country name..."
                        />
                        <button
                          type="button"
                          onClick={handleCustomCountryAdd}
                          className="rounded-lg bg-blue-500 px-3 py-2 text-white transition-colors hover:bg-blue-600"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCustomCountry(false)}
                          className="rounded-lg bg-gray-300 px-3 py-2 text-gray-700 transition-colors hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                AI Configuration
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Urgency Level
                  </label>
                  <select
                    value={formData.urgency}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        urgency: e.target.value as any,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Focus Area
                  </label>
                  <select
                    value={formData.focus}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        focus: e.target.value as any,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="general">General</option>
                    <option value="economic">Economic</option>
                    <option value="security">Security</option>
                    <option value="humanitarian">Humanitarian</option>
                    <option value="environmental">Environmental</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Tone
                  </label>
                  <select
                    value={formData.tone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        tone: e.target.value as any,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="diplomatic">Diplomatic</option>
                    <option value="assertive">Assertive</option>
                    <option value="collaborative">Collaborative</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Length
                  </label>
                  <select
                    value={formData.length}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        length: e.target.value as any,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="short">Short (3-5 clauses)</option>
                    <option value="medium">Medium (6-10 clauses)</option>
                    <option value="long">Long (11+ clauses)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.includeStatistics}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        includeStatistics: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Include Statistics
                  </span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.includeCitations}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        includeCitations: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Include Citations
                  </span>
                </label>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Custom Instructions (Optional)
                </label>
                <textarea
                  value={formData.customInstructions}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      customInstructions: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  rows={3}
                  placeholder="Any specific requirements or focus areas for the AI to consider..."
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end border-t border-gray-200 pt-4">
              <button
                type="submit"
                disabled={isGenerating || !isOnline}
                className="flex items-center gap-2 rounded-lg bg-blue-500 px-6 py-3 text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Generating Resolution...
                  </>
                ) : (
                  <>
                    <span className="text-lg">🤖</span>
                    Generate Resolution
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* AI Tips */}
      <div className="mt-6 rounded-xl bg-blue-50 p-6">
        <h3 className="mb-3 text-lg font-semibold text-blue-900">
          💡 AI Generation Tips
        </h3>
        <div className="grid grid-cols-1 gap-4 text-sm text-blue-800 md:grid-cols-2">
          <div>
            <h4 className="mb-2 font-medium">For Better Results:</h4>
            <ul className="space-y-1">
              <li>• Be specific in your title</li>
              <li>• Choose appropriate urgency level</li>
              <li>• Select relevant focus area</li>
              <li>• Use custom instructions for specific needs</li>
            </ul>
          </div>
          <div>
            <h4 className="mb-2 font-medium">AI Will Generate:</h4>
            <ul className="space-y-1">
              <li>• Preambular clauses with context</li>
              <li>• Operative clauses with actions</li>
              <li>• Appropriate diplomatic language</li>
              <li>• Citations and statistics (if enabled)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
