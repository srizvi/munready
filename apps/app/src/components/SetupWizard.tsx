import { useState } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";

import { api } from "../../convex/_generated/api";

const themes = [
  {
    id: "classic",
    name: "Classic UN",
    description: "Traditional blue and white",
  },
  {
    id: "modern",
    name: "Modern Diplomatic",
    description: "Clean and contemporary",
  },
  {
    id: "academic",
    name: "Academic",
    description: "Professional and scholarly",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Simple and distraction-free",
  },
  { id: "dark", name: "Dark Mode", description: "Easy on the eyes" },
];

const experienceLevels = ["Beginner", "Intermediate", "Advanced"] as const;

const defaultCommittees = [
  "DISEC",
  "ECOFIN",
  "SOCHUM",
  "SPECPOL",
  "GA Plenary",
  "ECOSOC",
  "UNSC",
  "WHO",
  "UNESCO",
  "UNICEF",
  "UNHCR",
  "UNEP",
];

export function SetupWizard() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: "",
    school: "",
    delegation: "",
    nativeLanguage: "",
    experienceLevel: "Beginner" as "Beginner" | "Intermediate" | "Advanced",
    preferredCommittees: [] as string[],
    timezone: "Asia/Karachi",
    defaultTheme: "classic",
    citationPreferences: {
      preferUNPrimaryDocs: true,
      autoUpdateCountryData: true,
    },
  });

  const createProfile = useMutation(api.users.createUserProfile);
  const seedCountries = useMutation(api.countries.seedDefaultCountries);
  const seedTopics = useMutation(api.topics.seedDefaultTopics);
  const seedCommittees = useMutation(api.committees.seedDefaultCommittees);
  const seedTemplates = useMutation(api.templates.seedDefaultTemplates);

  const handleSubmit = async () => {
    try {
      // Seed default data
      await Promise.all([
        seedCountries(),
        seedTopics(),
        seedCommittees(),
        seedTemplates(),
      ]);

      // Create user profile
      await createProfile(formData);
      toast.success("Profile created successfully!");
    } catch (error) {
      toast.error("Failed to create profile. Please try again.");
      console.error(error);
    }
  };

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const toggleCommittee = (committee: string) => {
    const current = formData.preferredCommittees;
    if (current.includes(committee)) {
      updateFormData({
        preferredCommittees: current.filter((c) => c !== committee),
      });
    } else {
      updateFormData({ preferredCommittees: [...current, committee] });
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="rounded-lg border bg-white p-8 shadow-sm">
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              Setup Your Profile
            </h2>
            <span className="text-sm text-gray-500">Step {step} of 4</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Username *
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => updateFormData({ username: e.target.value })}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 outline-none transition-shadow focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="How should we address you?"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                School/Institution
              </label>
              <input
                type="text"
                value={formData.school}
                onChange={(e) => updateFormData({ school: e.target.value })}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 outline-none transition-shadow focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Your school or institution"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Delegation
              </label>
              <input
                type="text"
                value={formData.delegation}
                onChange={(e) => updateFormData({ delegation: e.target.value })}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 outline-none transition-shadow focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Your delegation name"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Native Language
              </label>
              <input
                type="text"
                value={formData.nativeLanguage}
                onChange={(e) =>
                  updateFormData({ nativeLanguage: e.target.value })
                }
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 outline-none transition-shadow focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Your native language"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Experience & Preferences</h3>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Experience Level *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {experienceLevels.map((level) => (
                  <button
                    key={level}
                    onClick={() => updateFormData({ experienceLevel: level })}
                    className={`rounded-lg border p-3 text-center transition-colors ${
                      formData.experienceLevel === level
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Timezone
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => updateFormData({ timezone: e.target.value })}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 outline-none transition-shadow focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="Asia/Karachi">Asia/Karachi (PKT)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                <option value="Australia/Sydney">
                  Australia/Sydney (AEDT)
                </option>
              </select>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Preferred Committees</h3>
            <p className="text-sm text-gray-600">
              Select the committees you're most interested in:
            </p>
            <div className="grid grid-cols-2 gap-3">
              {defaultCommittees.map((committee) => (
                <button
                  key={committee}
                  onClick={() => toggleCommittee(committee)}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    formData.preferredCommittees.includes(committee)
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {committee}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Theme & Citations</h3>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Default Theme
              </label>
              <div className="space-y-3">
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => updateFormData({ defaultTheme: theme.id })}
                    className={`w-full rounded-lg border p-4 text-left transition-colors ${
                      formData.defaultTheme === theme.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="font-medium">{theme.name}</div>
                    <div className="text-sm text-gray-600">
                      {theme.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium">Citation Preferences</h4>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.citationPreferences.preferUNPrimaryDocs}
                  onChange={(e) =>
                    updateFormData({
                      citationPreferences: {
                        ...formData.citationPreferences,
                        preferUNPrimaryDocs: e.target.checked,
                      },
                    })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">
                  Prefer UN primary documents in citations
                </span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.citationPreferences.autoUpdateCountryData}
                  onChange={(e) =>
                    updateFormData({
                      citationPreferences: {
                        ...formData.citationPreferences,
                        autoUpdateCountryData: e.target.checked,
                      },
                    })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">
                  Automatically update country data
                </span>
              </label>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-between">
          <button
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
            className="rounded-lg border border-gray-300 px-6 py-2 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>

          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && !formData.username.trim()}
              className="rounded-lg bg-blue-500 px-6 py-2 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!formData.username.trim()}
              className="rounded-lg bg-blue-500 px-6 py-2 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Complete Setup
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
