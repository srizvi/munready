import { useState } from "react";

interface ThemeSelectorProps {
  currentTheme: string;
  onThemeChange: (theme: string) => void;
}

const themes = [
  {
    id: "diplomatic-dawn",
    name: "Diplomatic Dawn",
    color: "#F7E7DC",
    description: "Warm diplomatic beige",
  },
  {
    id: "peace-accord",
    name: "Peace Accord",
    color: "#DCE8F7",
    description: "Peaceful blue tones",
  },
  {
    id: "resolution-rose",
    name: "Resolution Rose",
    color: "#F7DCE7",
    description: "Gentle rose diplomacy",
  },
  {
    id: "summit-sage",
    name: "Summit Sage",
    color: "#E2F0E8",
    description: "Natural sage green",
  },
  {
    id: "consensus-coral",
    name: "Consensus Coral",
    color: "#FDE2DC",
    description: "Warm coral harmony",
  },
  {
    id: "classic",
    name: "Classic",
    color: "#f8fafc",
    description: "Traditional UN styling",
  },
  {
    id: "modern",
    name: "Modern",
    color: "#fefefe",
    description: "Clean contemporary",
  },
  {
    id: "academic",
    name: "Academic",
    color: "#fffbeb",
    description: "Scholarly format",
  },
  {
    id: "minimal",
    name: "Minimal",
    color: "#ffffff",
    description: "Simple layout",
  },
];

export function ThemeSelector({
  currentTheme,
  onThemeChange,
}: ThemeSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleThemeSelect = (themeId: string) => {
    // Apply theme immediately on single click
    onThemeChange(themeId);
    setIsExpanded(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900">Theme Selection</h4>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          {isExpanded ? "Show Less" : "Show All"}
        </button>
      </div>

      <div
        className={`grid gap-3 ${isExpanded ? "grid-cols-2" : "grid-cols-3"}`}
      >
        {(isExpanded ? themes : themes.slice(0, 6)).map((theme) => (
          <button
            key={theme.id}
            onClick={() => handleThemeSelect(theme.id)}
            className={`rounded-lg border-2 p-3 text-left transition-all ${
              currentTheme === theme.id
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className="h-6 w-6 rounded-full border border-gray-300"
                style={{ backgroundColor: theme.color }}
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {theme.name}
                </div>
                <div className="truncate text-xs text-gray-500">
                  {theme.description}
                </div>
              </div>
              {currentTheme === theme.id && (
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500">
                  <svg
                    className="h-2.5 w-2.5 text-white"
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
          </button>
        ))}
      </div>
    </div>
  );
}
