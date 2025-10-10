import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

import { api } from "../../convex/_generated/api";
import { useTheme } from "./ThemeProvider";
import { ThemeSelector } from "./ThemeSelector";

export function SettingsScreen() {
  const userProfile = useQuery(api.users.getUserProfile);
  const updateProfile = useMutation(api.users.updateUserProfile);
  const { theme, setTheme } = useTheme();

  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    school: "",
    delegation: "",
    nativeLanguage: "",
    timezone: "",
    experienceLevel: "Beginner" as "Beginner" | "Intermediate" | "Advanced",
    preferredCommittees: [] as string[],
    citationPreferences: {
      preferUNPrimaryDocs: true,
      autoUpdateCountryData: true,
    },
  });

  const [isLoading, setIsLoading] = useState(false);

  // Update form data when profile loads
  useEffect(() => {
    if (userProfile) {
      setFormData({
        username: userProfile.username || "",
        name: userProfile.name || "",
        email: userProfile.email || "",
        school: userProfile.school || "",
        delegation: userProfile.delegation || "",
        nativeLanguage: userProfile.nativeLanguage || "",
        timezone: userProfile.timezone || "",
        experienceLevel: userProfile.experienceLevel || "Beginner",
        preferredCommittees: userProfile.preferredCommittees || [],
        citationPreferences: userProfile.citationPreferences || {
          preferUNPrimaryDocs: true,
          autoUpdateCountryData: true,
        },
      });
    }
  }, [userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await updateProfile({
        username: formData.username,
        name: formData.name,
        email: formData.email,
        school: formData.school,
        delegation: formData.delegation,
        nativeLanguage: formData.nativeLanguage,
        timezone: formData.timezone,
        experienceLevel: formData.experienceLevel,
        preferredCommittees: formData.preferredCommittees,
        citationPreferences: formData.citationPreferences,
      });

      toast.success("Settings updated successfully!");
    } catch (error) {
      toast.error("Failed to update settings");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommitteeToggle = (committee: string) => {
    setFormData((prev) => ({
      ...prev,
      preferredCommittees: prev.preferredCommittees.includes(committee)
        ? prev.preferredCommittees.filter((c) => c !== committee)
        : [...prev.preferredCommittees, committee],
    }));
  };

  const committees = [
    "DISEC",
    "ECOFIN",
    "SOCHUM",
    "SPECPOL",
    "LEGAL",
    "HRC",
    "ECOSOC",
    "Security Council",
    "ICJ",
    "WHO",
    "UNESCO",
    "UNEP",
  ];

  return (
    <div className="min-h-full bg-white p-8">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Themes & Settings
            </h2>
            <p className="mt-1 text-gray-600">
              Customize your experience and manage your account
            </p>
          </div>

          <div className="space-y-8 p-6">
            {/* Theme Settings */}
            <div className="border-b border-gray-200 pb-8">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Appearance
              </h3>
              <ThemeSelector currentTheme={theme} onThemeChange={setTheme} />
            </div>

            {/* Profile Settings */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Profile Information
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Username
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          username: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Your username..."
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Your full name..."
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="your.email@example.com"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      School/Institution
                    </label>
                    <input
                      type="text"
                      value={formData.school}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          school: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Your school or institution..."
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Delegation
                    </label>
                    <input
                      type="text"
                      value={formData.delegation}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          delegation: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Your delegation name..."
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Native Language
                    </label>
                    <input
                      type="text"
                      value={formData.nativeLanguage}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          nativeLanguage: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Your native language..."
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Timezone
                    </label>
                    <select
                      value={formData.timezone}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          timezone: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Select timezone...</option>
                      <option value="UTC">UTC</option>
                      <option value="EST">Eastern Time</option>
                      <option value="PST">Pacific Time</option>
                      <option value="GMT">Greenwich Mean Time</option>
                      <option value="CET">Central European Time</option>
                      <option value="JST">Japan Standard Time</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Experience Level
                    </label>
                    <select
                      value={formData.experienceLevel}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          experienceLevel: e.target.value as any,
                        }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Preferred Committees */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Preferred Committees
                </h3>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                  {committees.map((committee) => (
                    <label
                      key={committee}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={formData.preferredCommittees.includes(
                          committee,
                        )}
                        onChange={() => handleCommitteeToggle(committee)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{committee}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Citation Preferences */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Citation Preferences
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.citationPreferences.preferUNPrimaryDocs}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          citationPreferences: {
                            ...prev.citationPreferences,
                            preferUNPrimaryDocs: e.target.checked,
                          },
                        }))
                      }
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        Prefer UN Primary Documents
                      </span>
                      <p className="text-xs text-gray-600">
                        Prioritize official UN documents in citations
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={
                        formData.citationPreferences.autoUpdateCountryData
                      }
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          citationPreferences: {
                            ...prev.citationPreferences,
                            autoUpdateCountryData: e.target.checked,
                          },
                        }))
                      }
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        Auto-update Country Data
                      </span>
                      <p className="text-xs text-gray-600">
                        Automatically refresh country statistics and positions
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-lg bg-blue-500 px-6 py-2 text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
                >
                  {isLoading ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
