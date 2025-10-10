import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { offlineStorage, OfflineTemplate } from "../lib/offlineStorage";
import { syncService } from "../lib/syncService";
import { useNetworkStatus } from "../lib/useNetworkStatus";

interface TemplatesScreenProps {
  onSelectTemplate?: (templateId: Id<"templates">) => void;
  onBack?: () => void;
}

interface Template {
  _id: Id<"templates">;
  name: string;
  description: string;
  type:
    | "resolution"
    | "position_paper"
    | "working_paper"
    | "gsl"
    | "moderated_caucus";
  committeeId?: Id<"committees">;
  committeeName?: string;
  content: {
    preamble: Array<{
      type: "clause" | "citation";
      text: string;
      citation?: string;
    }>;
    operative: Array<{
      number: number;
      text: string;
      subClauses: Array<{ letter: string; text: string }>;
    }>;
  };
  isPublic: boolean;
  createdBy: Id<"users">;
  creatorName?: string;
  usageCount: number;
}

export function TemplatesScreen({
  onSelectTemplate,
  onBack,
}: TemplatesScreenProps) {
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedCommittee, setSelectedCommittee] = useState<string>("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [offlineTemplates, setOfflineTemplates] = useState<OfflineTemplate[]>(
    [],
  );
  const { isOnline } = useNetworkStatus();
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    type: "resolution" as
      | "resolution"
      | "position_paper"
      | "working_paper"
      | "gsl"
      | "moderated_caucus",
    committeeId: "" as Id<"committees"> | "",
    isPublic: true,
    content: {
      preamble: [{ type: "clause" as const, text: "" }],
      operative: [
        {
          number: 1,
          text: "",
          subClauses: [] as Array<{ letter: string; text: string }>,
        },
      ],
    },
  });

  const templates = useQuery(api.templates.listTemplates, {
    type: selectedType === "all" ? undefined : (selectedType as any),
  });
  const committees = useQuery(api.committees.listCommittees);
  const useTemplate = useMutation(api.templates.useTemplate);
  const createTemplate = useMutation(api.templates.createTemplate);

  useEffect(() => {
    if (!isOnline) {
      offlineStorage.getTemplates().then(setOfflineTemplates);
    }
  }, [isOnline]);

  const handlePreviewTemplate = (template: Template) => {
    setPreviewTemplate(template);
  };

  const handleUseTemplate = async (templateId: Id<"templates">) => {
    try {
      await useTemplate({ templateId });
      onSelectTemplate?.(templateId);
      toast.success("Template loaded successfully!");
    } catch (error) {
      toast.error("Failed to load template");
      console.error(error);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplate.name.trim() || !newTemplate.description.trim()) {
      toast.error("Please fill in template name and description");
      return;
    }

    try {
      const tempId = `temp-${Date.now()}`;

      // Save using sync service (handles both online and offline)
      await syncService.saveTemplate(
        {
          id: tempId,
          title: newTemplate.name,
          content: newTemplate.content,
          type: newTemplate.type,
          lastModified: Date.now(),
        },
        isOnline ? createTemplate : undefined,
      );

      setNewTemplate({
        name: "",
        description: "",
        type: "resolution",
        committeeId: "",
        isPublic: true,
        content: {
          preamble: [{ type: "clause", text: "" }],
          operative: [{ number: 1, text: "", subClauses: [] }],
        },
      });
      setShowCreateForm(false);
      toast.success(
        isOnline ? "Template created successfully!" : "Template saved offline!",
      );
    } catch (error) {
      toast.error("Failed to create template");
      console.error(error);
    }
  };

  const addPreambleClause = () => {
    setNewTemplate((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        preamble: [
          ...prev.content.preamble,
          { type: "clause" as const, text: "" },
        ],
      },
    }));
  };

  const addOperativeClause = () => {
    const nextNumber = newTemplate.content.operative.length + 1;
    setNewTemplate((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        operative: [
          ...prev.content.operative,
          { number: nextNumber, text: "", subClauses: [] },
        ],
      },
    }));
  };

  const updatePreambleClause = (index: number, text: string) => {
    setNewTemplate((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        preamble: prev.content.preamble.map((clause, i) =>
          i === index ? { ...clause, text } : clause,
        ),
      },
    }));
  };

  const updateOperativeClause = (index: number, text: string) => {
    setNewTemplate((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        operative: prev.content.operative.map((clause, i) =>
          i === index ? { ...clause, text } : clause,
        ),
      },
    }));
  };

  const loadTemplateFormat = (format: string) => {
    const formats = {
      "security-council": {
        name: "Security Council Resolution",
        description:
          "Standard format for Security Council resolutions on peace and security matters",
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
      },
      "general-assembly": {
        name: "General Assembly Resolution",
        description:
          "Standard format for General Assembly resolutions on global issues",
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
      },
      "position-paper": {
        name: "Position Paper",
        description: "Standard format for country position papers",
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
      },
      "working-paper": {
        name: "Working Paper",
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
      },
    };

    const selectedFormat = formats[format as keyof typeof formats];
    if (selectedFormat) {
      setNewTemplate((prev) => ({
        ...prev,
        ...selectedFormat,
      }));
    }
  };

  // Use offline templates when offline, online templates when online
  const displayTemplates = isOnline
    ? templates
    : offlineTemplates.map((t) => ({
        _id: t.id as Id<"templates">,
        name: t.title,
        description: `Offline template - ${t.type}`,
        type: t.type,
        content: t.content,
        isPublic: false,
        createdBy: "offline" as Id<"users">,
        creatorName: "Offline User",
        usageCount: 0,
        _creationTime: t.lastModified,
        committeeId: undefined,
        committeeName: "Offline",
      }));

  const filteredTemplates = displayTemplates?.filter((template) => {
    if (selectedCommittee === "all") return true;
    return template.committeeId === selectedCommittee;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "resolution":
        return "📜";
      case "position_paper":
        return "📄";
      case "working_paper":
        return "📝";
      case "gsl":
        return "🎤";
      case "moderated_caucus":
        return "💬";
      default:
        return "📋";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "resolution":
        return "bg-blue-100 text-blue-800";
      case "position_paper":
        return "bg-green-100 text-green-800";
      case "working_paper":
        return "bg-yellow-100 text-yellow-800";
      case "gsl":
        return "bg-purple-100 text-purple-800";
      case "moderated_caucus":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Template Preview Modal
  if (previewTemplate) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-xl">
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {getTypeIcon(previewTemplate.type)}
                </span>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {previewTemplate.name}
                  </h2>
                  <p className="text-gray-600">{previewTemplate.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleUseTemplate(previewTemplate._id)}
                  className="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
                >
                  Use Template
                </button>
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Template Metadata */}
            <div className="mb-6 rounded-lg bg-gray-50 p-4">
              <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                <div>
                  <span className="font-medium text-gray-700">Type:</span>
                  <span
                    className={`ml-2 rounded-full px-2 py-1 text-xs ${getTypeColor(previewTemplate.type)}`}
                  >
                    {previewTemplate.type.replace("_", " ").toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Committee:</span>
                  <span className="ml-2 text-gray-600">
                    {previewTemplate.committeeName || "General"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Used:</span>
                  <span className="ml-2 text-gray-600">
                    {previewTemplate.usageCount} times
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Creator:</span>
                  <span className="ml-2 text-gray-600">
                    {previewTemplate.creatorName}
                  </span>
                </div>
              </div>
            </div>

            {/* Template Content */}
            <div className="space-y-6">
              {/* Preambular Clauses */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Preambular Clauses
                </h3>
                <div className="space-y-3">
                  {previewTemplate.content.preamble.map((clause, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-gray-200 p-4"
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <span className="text-sm font-medium text-gray-500">
                          Clause {index + 1}
                        </span>
                        {clause.type === "citation" && (
                          <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700">
                            Citation
                          </span>
                        )}
                      </div>
                      <p className="text-gray-800">{clause.text}</p>
                      {clause.citation && (
                        <p className="mt-2 text-sm text-blue-600">
                          Citation: {clause.citation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Operative Clauses */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Operative Clauses
                </h3>
                <div className="space-y-3">
                  {previewTemplate.content.operative.map((clause, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-gray-200 p-4"
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <span className="text-sm font-medium text-gray-500">
                          {clause.number}.
                        </span>
                      </div>
                      <p className="mb-2 text-gray-800">{clause.text}</p>
                      {clause.subClauses.length > 0 && (
                        <div className="ml-4 space-y-1">
                          {clause.subClauses.map((subClause, subIndex) => (
                            <div key={subIndex} className="flex gap-2">
                              <span className="text-sm font-medium text-gray-500">
                                {subClause.letter})
                              </span>
                              <p className="text-sm text-gray-700">
                                {subClause.text}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  ResoMate Document Templates
                </h1>
                {!isOnline && (
                  <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-800">
                    Offline Mode
                  </span>
                )}
              </div>
              <p className="mt-1 text-gray-600">
                {isOnline
                  ? "Professional templates for all your ResoMate document needs"
                  : "Viewing saved templates - Connect to internet for full template library"}
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
            >
              Create Template
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Document Type:
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="resolution">Resolutions</option>
                <option value="position_paper">Position Papers</option>
                <option value="working_paper">Working Papers</option>
                <option value="gsl">General Speakers List</option>
                <option value="moderated_caucus">Moderated Caucus</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Committee:
              </label>
              <select
                value={selectedCommittee}
                onChange={(e) => setSelectedCommittee(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Committees</option>
                {committees?.map((committee) => (
                  <option key={committee._id} value={committee._id}>
                    {committee.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="p-6">
          {filteredTemplates && filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates.map((template) => (
                <div
                  key={template._id}
                  className="rounded-lg border border-gray-200 p-6 transition-all hover:border-blue-300 hover:shadow-md"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {getTypeIcon(template.type)}
                      </span>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {template.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {template.committeeName}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${getTypeColor(template.type)}`}
                    >
                      {template.type.replace("_", " ").toUpperCase()}
                    </span>
                  </div>

                  <p className="mb-4 line-clamp-3 text-sm text-gray-700">
                    {template.description}
                  </p>

                  <div className="mb-4 flex items-center justify-between text-xs text-gray-500">
                    <span>Used {template.usageCount} times</span>
                    <span>By {template.creatorName}</span>
                  </div>

                  {/* Preview of content */}
                  <div className="mb-4 rounded-lg bg-gray-50 p-3">
                    <p className="mb-2 text-xs text-gray-600">Preview:</p>
                    <p className="line-clamp-2 text-xs text-gray-800">
                      {template.content.preamble[0]?.text ||
                        "No preview available"}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePreviewTemplate(template)}
                      className="flex-1 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-200"
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => handleUseTemplate(template._id)}
                      className="flex-1 rounded-lg bg-blue-500 px-3 py-2 text-sm text-white transition-colors hover:bg-blue-600"
                    >
                      Use Template
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="mb-2 text-lg font-medium text-gray-900">
                No templates found
              </h3>
              <p className="mb-4 text-gray-600">
                {selectedType !== "all" || selectedCommittee !== "all"
                  ? "Try adjusting your filters to see more templates."
                  : "Be the first to create a template for your committee!"}
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
              >
                Create First Template
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Template Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  Create New Template
                </h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateTemplate} className="space-y-6 p-6">
              {/* Quick Format Selection */}
              <div>
                <label className="mb-3 block text-sm font-medium text-gray-700">
                  Quick Start Formats:
                </label>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <button
                    type="button"
                    onClick={() => loadTemplateFormat("security-council")}
                    className="rounded-lg border border-gray-200 p-3 text-left transition-colors hover:border-blue-300 hover:bg-blue-50"
                  >
                    <div className="mb-1 text-lg">🛡️</div>
                    <div className="text-sm font-medium">Security Council</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => loadTemplateFormat("general-assembly")}
                    className="rounded-lg border border-gray-200 p-3 text-left transition-colors hover:border-blue-300 hover:bg-blue-50"
                  >
                    <div className="mb-1 text-lg">🌍</div>
                    <div className="text-sm font-medium">General Assembly</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => loadTemplateFormat("position-paper")}
                    className="rounded-lg border border-gray-200 p-3 text-left transition-colors hover:border-blue-300 hover:bg-blue-50"
                  >
                    <div className="mb-1 text-lg">📄</div>
                    <div className="text-sm font-medium">Position Paper</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => loadTemplateFormat("working-paper")}
                    className="rounded-lg border border-gray-200 p-3 text-left transition-colors hover:border-blue-300 hover:bg-blue-50"
                  >
                    <div className="mb-1 text-lg">📝</div>
                    <div className="text-sm font-medium">Working Paper</div>
                  </button>
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={newTemplate.name}
                    onChange={(e) =>
                      setNewTemplate((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g., Security Council Resolution Template"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Document Type *
                  </label>
                  <select
                    value={newTemplate.type}
                    onChange={(e) =>
                      setNewTemplate((prev) => ({
                        ...prev,
                        type: e.target.value as any,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="resolution">Resolution</option>
                    <option value="position_paper">Position Paper</option>
                    <option value="working_paper">Working Paper</option>
                    <option value="gsl">General Speakers List</option>
                    <option value="moderated_caucus">Moderated Caucus</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Description *
                </label>
                <textarea
                  value={newTemplate.description}
                  onChange={(e) =>
                    setNewTemplate((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe when and how this template should be used..."
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Committee (Optional)
                  </label>
                  <select
                    value={newTemplate.committeeId}
                    onChange={(e) =>
                      setNewTemplate((prev) => ({
                        ...prev,
                        committeeId: e.target.value as any,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">General Template</option>
                    {committees?.map((committee) => (
                      <option key={committee._id} value={committee._id}>
                        {committee.name} - {committee.fullName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newTemplate.isPublic}
                      onChange={(e) =>
                        setNewTemplate((prev) => ({
                          ...prev,
                          isPublic: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      Make template public
                    </span>
                  </label>
                </div>
              </div>

              {/* Content Editor */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Template Content
                </h3>

                {/* Preambular Clauses */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">
                      Preambular Clauses
                    </h4>
                    <button
                      type="button"
                      onClick={addPreambleClause}
                      className="rounded bg-blue-500 px-3 py-1 text-sm text-white transition-colors hover:bg-blue-600"
                    >
                      Add Clause
                    </button>
                  </div>
                  <div className="space-y-2">
                    {newTemplate.content.preamble.map((clause, index) => (
                      <textarea
                        key={index}
                        value={clause.text}
                        onChange={(e) =>
                          updatePreambleClause(index, e.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        rows={2}
                        placeholder={`Preambular clause ${index + 1}...`}
                      />
                    ))}
                  </div>
                </div>

                {/* Operative Clauses */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">
                      Operative Clauses
                    </h4>
                    <button
                      type="button"
                      onClick={addOperativeClause}
                      className="rounded bg-blue-500 px-3 py-1 text-sm text-white transition-colors hover:bg-blue-600"
                    >
                      Add Clause
                    </button>
                  </div>
                  <div className="space-y-2">
                    {newTemplate.content.operative.map((clause, index) => (
                      <div key={index} className="flex gap-3">
                        <span className="mt-2 text-sm font-medium text-gray-500">
                          {clause.number}.
                        </span>
                        <textarea
                          value={clause.text}
                          onChange={(e) =>
                            updateOperativeClause(index, e.target.value)
                          }
                          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          rows={2}
                          placeholder={`Operative clause ${clause.number}...`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
                >
                  Create Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Type Guide */}
      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-bold text-gray-900">
          📚 ResoMate Document Guide
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">📜</span>
              <h3 className="font-semibold text-gray-900">Resolutions</h3>
            </div>
            <p className="text-sm text-gray-600">
              Formal documents that express the will of the committee. Include
              preambular and operative clauses.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">📄</span>
              <h3 className="font-semibold text-gray-900">Position Papers</h3>
            </div>
            <p className="text-sm text-gray-600">
              Documents outlining a country's stance on committee topics,
              including policy recommendations.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">📝</span>
              <h3 className="font-semibold text-gray-900">Working Papers</h3>
            </div>
            <p className="text-sm text-gray-600">
              Collaborative documents developed during committee sessions to
              build consensus on solutions.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎤</span>
              <h3 className="font-semibold text-gray-900">
                General Speakers List
              </h3>
            </div>
            <p className="text-sm text-gray-600">
              Guidelines and structure for formal debate sessions where
              delegates present their positions.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">💬</span>
              <h3 className="font-semibold text-gray-900">Moderated Caucus</h3>
            </div>
            <p className="text-sm text-gray-600">
              Structured discussion format focusing on specific aspects of the
              topic with time limits.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚡</span>
              <h3 className="font-semibold text-gray-900">Quick Tips</h3>
            </div>
            <p className="text-sm text-gray-600">
              Use templates as starting points. Customize content to match your
              committee's specific needs and topics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
