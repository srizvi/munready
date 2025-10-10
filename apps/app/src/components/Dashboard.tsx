import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { ChallengesScreen } from "./ChallengesScreen";
import { CreateResolution } from "./CreateResolution";
import { ResolutionEditor } from "./ResolutionEditor";
import { ResolutionList } from "./ResolutionList";
import { StarredScreen } from "./StarredScreen";
import { TemplatesScreen } from "./TemplatesScreen";
import { TimerScreen } from "./TimerScreen";

type Screen =
  | "dashboard"
  | "create"
  | "edit"
  | "starred"
  | "templates"
  | "challenges"
  | "timer"
  | "settings";

interface DashboardProps {
  onCreateNew: () => void;
  onSelectResolution: (id: Id<"resolutions">) => void;
  onNavigate: (screen: Screen) => void;
}

export function Dashboard({
  onCreateNew,
  onSelectResolution,
  onNavigate,
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<
    "resolutions" | "create" | "templates" | "starred" | "timer" | "challenges"
  >("resolutions");
  const [selectedResolution, setSelectedResolution] =
    useState<Id<"resolutions"> | null>(null);
  const [selectedTheme, setSelectedTheme] = useState("classic");
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);

  const userProfile = useQuery(api.users.getUserProfile);
  const resolutions = useQuery(api.resolutions.listResolutions);
  const starredItems = useQuery(api.starring.getStarredItems, {});
  const updateProfile = useMutation(api.users.updateUserProfile);
  const createResolution = useMutation(api.resolutions.createResolution);
  const seedChallenges = useMutation(api.challenges.seedDefaultChallenges);
  const seedTemplates = useMutation(api.templates.seedDefaultTemplates);
  const seedCountries = useMutation(api.countries.seedDefaultCountries);
  const seedTopics = useMutation(api.topics.seedDefaultTopics);
  const seedCommittees = useMutation(api.committees.seedDefaultCommittees);

  // Seed default data on component mount
  useEffect(() => {
    seedChallenges();
    seedTemplates();
    seedCountries();
    seedTopics();
    seedCommittees();
  }, [
    seedChallenges,
    seedTemplates,
    seedCountries,
    seedTopics,
    seedCommittees,
  ]);

  if (selectedResolution) {
    return (
      <ResolutionEditor
        resolutionId={selectedResolution}
        onBack={() => setSelectedResolution(null)}
      />
    );
  }

  const themes = [
    {
      id: "classic",
      name: "Classic UN",
      description: "Traditional UN document styling",
    },
    {
      id: "modern",
      name: "Modern Diplomatic",
      description: "Clean, contemporary design",
    },
    { id: "academic", name: "Academic", description: "Scholarly paper format" },
    {
      id: "minimal",
      name: "Minimal",
      description: "Simple, distraction-free layout",
    },
    {
      id: "dark",
      name: "Dark Mode",
      description: "Dark theme for low-light environments",
    },
  ];

  const handleThemeChange = async (themeId: string) => {
    setSelectedTheme(themeId);
    setShowThemeDropdown(false);
    try {
      await updateProfile({ defaultTheme: themeId });
    } catch (error) {
      console.error("Failed to update theme:", error);
    }
  };

  const handleTemplateSelection = async (templateId: Id<"templates">) => {
    try {
      // For now, just navigate to create resolution tab
      // In the future, we can pre-populate with template content
      setActiveTab("create");
    } catch (error) {
      console.error("Failed to handle template selection:", error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="flex w-80 flex-col border-r border-gray-200 bg-white">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500">
              <span className="text-lg font-bold text-white">R</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">ResoMate</h1>
              <p className="text-sm text-gray-500">
                Resolution-ready solutions
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-blue-50 p-3">
              <div className="text-2xl font-bold text-blue-600">
                {resolutions?.length || 0}
              </div>
              <div className="text-sm text-blue-600">Resolutions</div>
            </div>
            <div className="rounded-lg bg-yellow-50 p-3">
              <div className="text-2xl font-bold text-yellow-600">
                {starredItems?.length || 0}
              </div>
              <div className="text-sm text-yellow-600">Starred Items</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4">
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab("resolutions")}
              className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
                activeTab === "resolutions"
                  ? "border border-blue-200 bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                <span className="text-lg text-blue-600">📜</span>
              </div>
              <div className="flex-1">
                <div className="font-medium">My Resolutions</div>
                <div className="text-sm text-gray-500">
                  View and edit documents
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("create")}
              className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
                activeTab === "create"
                  ? "border border-purple-200 bg-purple-50 text-purple-700"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
                <span className="text-lg text-purple-600">🤖</span>
              </div>
              <div className="flex-1">
                <div className="font-medium">Create with AI</div>
                <div className="text-sm text-gray-500">
                  Generate resolutions
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("templates")}
              className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
                activeTab === "templates"
                  ? "border border-green-200 bg-green-50 text-green-700"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                <span className="text-lg text-green-600">📋</span>
              </div>
              <div className="flex-1">
                <div className="font-medium">Templates</div>
                <div className="text-sm text-gray-500">Document templates</div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("starred")}
              className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
                activeTab === "starred"
                  ? "border border-yellow-200 bg-yellow-50 text-yellow-700"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-100">
                <span className="text-lg text-yellow-600">⭐</span>
              </div>
              <div className="flex-1">
                <div className="font-medium">Starred</div>
                <div className="text-sm text-gray-500">Saved items</div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("timer")}
              className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
                activeTab === "timer"
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                <span className="text-lg text-emerald-600">⏱️</span>
              </div>
              <div className="flex-1">
                <div className="font-medium">Speech Timer</div>
                <div className="text-sm text-gray-500">Time your speeches</div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("challenges")}
              className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
                activeTab === "challenges"
                  ? "border border-orange-200 bg-orange-50 text-orange-700"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100">
                <span className="text-lg text-orange-600">🎯</span>
              </div>
              <div className="flex-1">
                <div className="font-medium">Challenges</div>
                <div className="text-sm text-gray-500">
                  MUN skill challenges
                </div>
              </div>
            </button>

            {/* Theme Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowThemeDropdown(!showThemeDropdown)}
                onMouseEnter={() => setShowThemeDropdown(true)}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-gray-700 transition-colors hover:bg-gray-50"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
                  <svg
                    className="h-4 w-4 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-medium">Themes</div>
                  <div className="text-sm text-gray-500">
                    Customize appearance
                  </div>
                </div>
                <svg
                  className={`h-4 w-4 text-gray-400 transition-transform ${showThemeDropdown ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {showThemeDropdown && (
                <div
                  className="absolute left-0 right-0 z-10 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg"
                  onMouseLeave={() => setShowThemeDropdown(false)}
                >
                  <div className="space-y-1 p-2">
                    {themes.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => handleThemeChange(theme.id)}
                        className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                          selectedTheme === theme.id
                            ? "bg-indigo-100 text-indigo-800"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{theme.name}</span>
                          {selectedTheme === theme.id && (
                            <div className="flex h-3 w-3 items-center justify-center rounded-full bg-indigo-500">
                              <svg
                                className="h-2 w-2 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {theme.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* User Profile Section */}
          <div className="mt-8 border-t border-gray-200 pt-6">
            <div className="flex items-center gap-3 px-4 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
                <span className="text-sm font-medium text-white">
                  {userProfile?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-gray-900">
                  {userProfile?.username}
                </div>
                <div className="text-xs capitalize text-gray-500">
                  {userProfile?.experienceLevel}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "resolutions" && (
          <div className="p-8">
            <div className="mb-8">
              <h2 className="mb-3 text-3xl font-bold text-gray-900">
                My Resolutions
              </h2>
              <p className="text-lg text-gray-600">
                Manage and edit your resolution documents
              </p>
            </div>
            <ResolutionList
              resolutions={resolutions || []}
              onSelectResolution={setSelectedResolution}
            />
          </div>
        )}

        {activeTab === "create" && (
          <div className="p-8">
            <div className="mb-8">
              <h2 className="mb-3 text-3xl font-bold text-gray-900">
                🤖 Create with AI
              </h2>
              <p className="text-lg text-gray-600">
                Generate intelligent resolutions with AI assistance
              </p>
            </div>
            <CreateResolution onResolutionCreated={setSelectedResolution} />
          </div>
        )}

        {activeTab === "templates" && (
          <TemplatesScreen
            onSelectTemplate={handleTemplateSelection}
            onBack={() => setActiveTab("resolutions")}
          />
        )}

        {activeTab === "starred" && (
          <StarredScreen onBack={() => setActiveTab("resolutions")} />
        )}

        {activeTab === "timer" && (
          <TimerScreen onBack={() => setActiveTab("resolutions")} />
        )}

        {activeTab === "challenges" && (
          <ChallengesScreen onBack={() => setActiveTab("resolutions")} />
        )}
      </div>
    </div>
  );
}
