import { useEffect, useState } from "react";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { Toaster } from "sonner";

import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { ChallengesScreen } from "./components/ChallengesScreen";
import { CreateResolution } from "./components/CreateResolution";
import { NotesScreen } from "./components/NotesScreen";
import { OfflineBanner } from "./components/OfflineBanner";
import { ResolutionEditor } from "./components/ResolutionEditor";
import { ResolutionList } from "./components/ResolutionList";
import { SettingsScreen } from "./components/SettingsScreen";
import { SetupWizard } from "./components/SetupWizard";
import { StarredScreen } from "./components/StarredScreen";
import { SyncStatus } from "./components/SyncStatus";
import { TemplatesScreen } from "./components/TemplatesScreen";
import { ThemeProvider } from "./components/ThemeProvider";
import { TimerScreen } from "./components/TimerScreen";
import { syncService } from "./lib/syncService";
import { useNetworkStatus } from "./lib/useNetworkStatus";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";

type Screen =
  | "dashboard"
  | "create"
  | "edit"
  | "starred"
  | "templates"
  | "challenges"
  | "timer"
  | "settings"
  | "notes";

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("dashboard");
  const [selectedResolutionId, setSelectedResolutionId] =
    useState<Id<"resolutions"> | null>(null);

  const userProfile = useQuery(api.users.getUserProfile);
  const resolutions = useQuery(api.resolutions.listResolutions);
  const { isOnline } = useNetworkStatus();

  // Show setup wizard if user hasn't completed setup
  if (userProfile !== undefined && !userProfile?.setupCompleted) {
    return <SetupWizard />;
  }

  const handleResolutionSelect = (id: Id<"resolutions">) => {
    setSelectedResolutionId(id);
    setCurrentScreen("edit");
  };

  const handleResolutionCreated = (id: Id<"resolutions">) => {
    setSelectedResolutionId(id);
    setCurrentScreen("edit");
  };

  const handleBackToDashboard = () => {
    setCurrentScreen("dashboard");
    setSelectedResolutionId(null);
  };

  const renderMainContent = () => {
    switch (currentScreen) {
      case "create":
        return (
          <CreateResolution onResolutionCreated={handleResolutionCreated} />
        );
      case "edit":
        return selectedResolutionId ? (
          <ResolutionEditor
            resolutionId={selectedResolutionId}
            onBack={handleBackToDashboard}
          />
        ) : (
          <div className="bg-white p-8">
            <div className="mb-8">
              <h2 className="theme-text mb-3 text-3xl font-bold">
                My Resolutions
              </h2>
              <p className="theme-text text-lg opacity-75">
                Manage and edit your resolution documents
              </p>
            </div>
            <ResolutionList
              resolutions={resolutions || []}
              onSelectResolution={handleResolutionSelect}
            />
          </div>
        );
      case "starred":
        return <StarredScreen onBack={handleBackToDashboard} />;
      case "templates":
        return <TemplatesScreen onBack={handleBackToDashboard} />;
      case "challenges":
        return <ChallengesScreen onBack={handleBackToDashboard} />;
      case "timer":
        return <TimerScreen onBack={handleBackToDashboard} />;
      case "settings":
        return <SettingsScreen />;
      case "notes":
        return <NotesScreen />;
      default:
        return (
          <div className="bg-white p-8">
            <div className="mb-8">
              <h2 className="theme-text mb-3 text-3xl font-bold">
                My Resolutions
              </h2>
              <p className="theme-text text-lg opacity-75">
                Manage and edit your resolution documents
              </p>
            </div>
            <ResolutionList
              resolutions={resolutions || []}
              onSelectResolution={handleResolutionSelect}
            />
          </div>
        );
    }
  };

  return (
    <div className="theme-background flex h-screen">
      <OfflineBanner />
      {/* Welcome Back Header - Outside of sidebar */}
      <div className="absolute left-0 right-0 top-0 z-10 border-b border-gray-200 bg-white px-8 py-4 shadow-sm">
        <h1 className="theme-text text-4xl font-bold">
          Welcome Back{" "}
          {userProfile?.name || userProfile?.username || "Delegate"}!
        </h1>
      </div>

      {/* Left Sidebar Navigation */}
      <div className="theme-background mt-20 flex w-80 flex-col border-r border-gray-200 shadow-lg">
        {/* Header with App Info */}
        <div className="theme-background border-b border-gray-200 p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="text-2xl">🏛️</span>
            <div>
              <h2 className="theme-text text-xl font-bold">ResoMate</h2>
              <p className="theme-text text-sm opacity-75">
                Prepare Smarter, Negotiate Stronger
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="theme-background flex-1 space-y-2 p-4">
          <button
            onClick={() => setCurrentScreen("dashboard")}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
              currentScreen === "dashboard"
                ? "theme-button-active border border-gray-300"
                : "theme-text hover:bg-white hover:bg-opacity-50"
            }`}
          >
            <span className="text-lg">📊</span>
            <div className="flex-1">
              <div className="font-medium">My Resolutions</div>
              <div className="text-sm opacity-75">View and edit documents</div>
            </div>
          </button>

          <button
            onClick={() => setCurrentScreen("create")}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
              currentScreen === "create"
                ? "theme-button-active border border-gray-300"
                : "theme-text hover:bg-white hover:bg-opacity-50"
            }`}
          >
            <span className="text-lg">✨</span>
            <div className="flex-1">
              <div className="font-medium">Create with AI</div>
              <div className="text-sm opacity-75">Generate resolutions</div>
            </div>
          </button>

          <button
            onClick={() => setCurrentScreen("templates")}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
              currentScreen === "templates"
                ? "theme-button-active border border-gray-300"
                : "theme-text hover:bg-white hover:bg-opacity-50"
            }`}
          >
            <span className="text-lg">📋</span>
            <div className="flex-1">
              <div className="font-medium">Templates</div>
              <div className="text-sm opacity-75">Document templates</div>
            </div>
          </button>

          <button
            onClick={() => setCurrentScreen("starred")}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
              currentScreen === "starred"
                ? "theme-button-active border border-gray-300"
                : "theme-text hover:bg-white hover:bg-opacity-50"
            }`}
          >
            <span className="text-lg">⭐</span>
            <div className="flex-1">
              <div className="font-medium">Starred Drafts</div>
              <div className="text-sm opacity-75">Saved items</div>
            </div>
          </button>

          <button
            onClick={() => setCurrentScreen("challenges")}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
              currentScreen === "challenges"
                ? "theme-button-active border border-gray-300"
                : "theme-text hover:bg-white hover:bg-opacity-50"
            }`}
          >
            <span className="text-lg">🏆</span>
            <div className="flex-1">
              <div className="font-medium">MUN Challenges</div>
              <div className="text-sm opacity-75">Skill challenges</div>
            </div>
          </button>

          <button
            onClick={() => setCurrentScreen("timer")}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
              currentScreen === "timer"
                ? "theme-button-active border border-gray-300"
                : "theme-text hover:bg-white hover:bg-opacity-50"
            }`}
          >
            <span className="text-lg">⏱️</span>
            <div className="flex-1">
              <div className="font-medium">Timer</div>
              <div className="text-sm opacity-75">Speech timer</div>
            </div>
          </button>

          <button
            onClick={() => setCurrentScreen("notes")}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
              currentScreen === "notes"
                ? "theme-button-active border border-gray-300"
                : "theme-text hover:bg-white hover:bg-opacity-50"
            }`}
          >
            <span className="text-lg">📝</span>
            <div className="flex-1">
              <div className="font-medium">Notes</div>
              <div className="text-sm opacity-75">Offline notes</div>
            </div>
          </button>

          <button
            onClick={() => setCurrentScreen("settings")}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
              currentScreen === "settings"
                ? "theme-button-active border border-gray-300"
                : "theme-text hover:bg-white hover:bg-opacity-50"
            }`}
          >
            <span className="text-lg">⚙️</span>
            <div className="flex-1">
              <div className="font-medium">Themes & Settings</div>
              <div className="text-sm opacity-75">Customize appearance</div>
            </div>
          </button>
        </nav>

        {/* User Profile Section */}
        <div className="theme-background border-t border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
                <span className="text-sm font-medium text-white">
                  {userProfile?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="theme-text truncate text-sm font-medium">
                  {userProfile?.username}
                </div>
                <div className="theme-text text-xs capitalize opacity-75">
                  {userProfile?.experienceLevel}
                </div>
              </div>
            </div>
            <SignOutButton />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mt-20 flex-1 overflow-auto bg-white">
        {renderMainContent()}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <div className="App">
        <Unauthenticated>
          <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="w-full max-w-md">
              <div className="mb-8 text-center">
                <h1 className="mb-2 text-4xl font-bold text-gray-900">
                  🏛️ ResoMate
                </h1>
                <p className="text-lg text-gray-600">
                  Prepare Smarter, Negotiate Stronger
                </p>
              </div>
              <SignInForm />
            </div>
          </div>
        </Unauthenticated>

        <Authenticated>
          <AppContent />
        </Authenticated>

        <Toaster position="top-right" />
        <SyncStatus />
      </div>
    </ThemeProvider>
  );
}
