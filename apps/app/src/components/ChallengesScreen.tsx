import { useState } from "react";
import confetti from "canvas-confetti";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

import { api } from "../../convex/_generated/api";

interface ChallengesScreenProps {
  onBack: () => void;
}

export function ChallengesScreen({ onBack }: ChallengesScreenProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const userChallenges = useQuery(api.challenges.getUserChallenges);
  const activeChallenges = useQuery(api.challenges.getActiveChallenges);
  const userStats = useQuery(api.challenges.getUserStats);
  const completeChallenge = useMutation(api.challenges.completeChallenge);

  if (!activeChallenges || !userStats) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Create enriched challenges with completion status
  const enrichedChallenges = activeChallenges.map((challenge) => {
    const userChallenge = userChallenges?.find(
      (uc) => uc.challengeId === challenge._id,
    );
    return {
      ...challenge,
      completed: userChallenge?.completed || false,
      completedAt: userChallenge?.completedAt,
      difficulty: getDifficultyFromCategory(challenge.category),
      requirements: getRequirementsForChallenge(challenge.title),
      reward: getRewardForChallenge(challenge.title),
    };
  });

  const categories = [
    "all",
    "Easy",
    "Medium",
    "Difficult",
    "Wildcard",
    "Getting Started",
    "Research",
    "Strategy",
    "Advanced",
  ];

  const filteredChallenges =
    activeCategory === "all"
      ? enrichedChallenges
      : enrichedChallenges.filter(
          (challenge) => challenge.category === activeCategory,
        );

  function getDifficultyFromCategory(category: string): string {
    switch (category) {
      case "Easy":
        return "Beginner";
      case "Medium":
        return "Intermediate";
      case "Difficult":
        return "Advanced";
      case "Wildcard":
        return "Fun";
      case "Getting Started":
        return "Beginner";
      case "Research":
        return "Intermediate";
      case "Strategy":
        return "Intermediate";
      case "Advanced":
        return "Advanced";
      default:
        return "Intermediate";
    }
  }

  function getRequirementsForChallenge(title: string): string[] {
    const requirements: Record<string, string[]> = {
      "Official Name Master": [
        "Give a speech",
        "Use full official country name",
        "Record the speech",
      ],
      "Clause Bank Explorer": [
        "Access clause bank",
        "Star 3 different clauses",
        "Complete before first unmod",
      ],
      "Networking Novice": [
        "Meet new delegates",
        "Learn 3 delegate names",
        "Record their countries",
      ],
      "Regional Bloc Builder": [
        "Identify different regions",
        "Form bloc with 3+ countries",
        "Document the alliance",
      ],
      "Amendment Advocate": [
        "Draft an amendment",
        "Present to committee",
        "Get amendment accepted",
      ],
      "Statistical Speaker": [
        "Research UN agency data",
        "Include statistic in speech",
        "Cite the source",
      ],
      "Vote Changer": [
        "Identify abstaining delegate",
        "Present compelling argument",
        "Secure yes vote",
      ],
      "Bloc Unifier": [
        "Identify two separate blocs",
        "Negotiate joint resolution",
        "Finalize merger",
      ],
      "Amendment Winner": [
        "Propose amendment",
        "Campaign for support",
        "Win the vote",
      ],
      "Coffee Break Diplomat": [
        "Engage during break",
        "Avoid key MUN terms",
        "Secure bloc support",
      ],
      "First Resolution": [
        "Create a resolution",
        "Use AI generation",
        "Save the resolution",
      ],
      "Citation Master": [
        "Add citations to resolutions",
        "Use different source types",
        "Verify citation accuracy",
      ],
      "Alliance Architect": [
        "Review alliance suggestions",
        "Star 10 delegates",
        "Add notes to starred items",
      ],
      "C.A.P.S. Expert": [
        "Use C.A.P.S. format",
        "Include all elements",
        "Complete resolution",
      ],
    };
    return (
      requirements[title] || [
        "Complete the challenge",
        "Follow MUN procedures",
        "Document your progress",
      ]
    );
  }

  function getRewardForChallenge(title: string): string {
    const rewards: Record<string, string> = {
      "Official Name Master": "Unlock country name database",
      "Clause Bank Explorer": "Access to premium clause templates",
      "Networking Novice": "Delegate contact management tools",
      "Regional Bloc Builder": "Advanced bloc formation analytics",
      "Amendment Advocate": "Amendment drafting templates",
      "Statistical Speaker": "UN statistics quick-access panel",
      "Vote Changer": "Persuasion technique guides",
      "Bloc Unifier": "Master diplomat badge",
      "Amendment Winner": "Amendment champion recognition",
      "Coffee Break Diplomat": "Informal diplomacy achievement",
      "First Resolution": "Unlock advanced templates",
      "Citation Master": "Citation formatting tools",
      "Alliance Architect": "Advanced alliance analytics",
      "C.A.P.S. Expert": "Expert badge and priority support",
    };
    return rewards[title] || "Special recognition and points";
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-100 text-green-800 border-green-200";
      case "Intermediate":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Advanced":
        return "bg-red-100 text-red-800 border-red-200";
      case "Fun":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Easy":
        return "🟢";
      case "Medium":
        return "🟡";
      case "Difficult":
        return "🔴";
      case "Wildcard":
        return "🎯";
      case "Getting Started":
        return "🚀";
      case "Research":
        return "📚";
      case "Strategy":
        return "🤝";
      case "Advanced":
        return "✍️";
      default:
        return "🎯";
    }
  };

  const triggerConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: Math.random() * 0.6 + 0.2, y: Math.random() - 0.2 },
      });
    }, 250);
  };

  const triggerAchievementConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#FFD700", "#FFA500", "#FF6347", "#32CD32", "#1E90FF"],
    });

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#FFD700", "#FFA500"],
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#FFD700", "#FFA500"],
      });
    }, 250);
  };

  const handleCompleteChallenge = async (challengeId: any) => {
    try {
      const previousCompleted = userStats?.completedChallenges || 0;
      await completeChallenge({ challengeId });

      // Trigger confetti animation
      triggerConfetti();

      // Check for achievement unlocks
      const newCompleted = previousCompleted + 1;

      // Special celebration for first challenge
      if (newCompleted === 1) {
        setTimeout(() => {
          triggerAchievementConfetti();
          toast.success(
            "🎊 Welcome to ResoMate Challenges! Your journey begins!",
            {
              duration: 5000,
              style: {
                background: "linear-gradient(135deg, #8B5CF6, #A855F7)",
                color: "white",
                border: "none",
              },
            },
          );
        }, 1000);
      }

      if ([5, 15, 30].includes(newCompleted)) {
        setTimeout(() => {
          triggerAchievementConfetti();
          const names = {
            5: "Bronze Delegate",
            15: "Silver Diplomat",
            30: "Gold Ambassador",
          };
          toast.success(
            `🏆 Achievement Unlocked: ${names[newCompleted as keyof typeof names]}!`,
            {
              duration: 5000,
              style: {
                background: "linear-gradient(135deg, #FFD700, #FFA500)",
                color: "white",
                border: "none",
              },
            },
          );
        }, 1000);
      }

      toast.success("🎉 Challenge completed! Points awarded.");
    } catch (error) {
      toast.error("Failed to complete challenge");
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="mb-3 text-3xl font-bold text-gray-900">
          🎯 ResoMate Challenges
        </h2>
        <p className="text-lg text-gray-600">
          Complete challenges to improve your diplomatic skills and earn rewards
        </p>
      </div>

      {/* Stats Overview */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-100">Total Points</p>
              <p className="text-2xl font-bold">{userStats.totalPoints}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-400">
              <span className="text-xl">🏆</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-100">Completed</p>
              <p className="text-2xl font-bold">
                {userStats.completedChallenges}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-400">
              <span className="text-xl">✅</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-100">In Progress</p>
              <p className="text-2xl font-bold">{userStats.inProgress}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-400">
              <span className="text-xl">⏳</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-100">Success Rate</p>
              <p className="text-2xl font-bold">{userStats.successRate}%</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-400">
              <span className="text-xl">📊</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
                activeCategory === category
                  ? "bg-orange-500 text-white"
                  : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span>
                {category === "all" ? "🎯" : getCategoryIcon(category)}
              </span>
              {category === "all" ? "All Challenges" : category}
              <span className="text-sm opacity-75">
                (
                {category === "all"
                  ? enrichedChallenges.length
                  : enrichedChallenges.filter((c) => c.category === category)
                      .length}
                )
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Challenges Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {filteredChallenges.map((challenge) => (
          <div
            key={challenge._id}
            className={`rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md ${
              challenge.completed
                ? "border-green-200 bg-green-50"
                : "border-gray-200"
            }`}
          >
            <div className="p-6">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full ${
                      challenge.completed ? "bg-green-100" : "bg-orange-100"
                    }`}
                  >
                    <span className="text-xl">
                      {getCategoryIcon(challenge.category)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {challenge.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {challenge.category}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`rounded-full border px-2 py-1 text-xs font-medium ${getDifficultyColor(challenge.difficulty)}`}
                  >
                    {challenge.difficulty}
                  </span>
                  <span className="text-sm font-semibold text-orange-600">
                    {challenge.points} pts
                  </span>
                  {challenge.completed && (
                    <span className="text-xs font-medium text-green-600">
                      ✓ Completed
                    </span>
                  )}
                </div>
              </div>

              <p className="mb-4 text-gray-600">{challenge.description}</p>

              {/* Requirements */}
              <div className="mb-4">
                <h4 className="mb-2 font-medium text-gray-900">
                  Requirements:
                </h4>
                <ul className="space-y-1">
                  {challenge.requirements.map((req, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-2 text-sm text-gray-600"
                    >
                      <div
                        className={`flex h-4 w-4 items-center justify-center rounded border ${
                          challenge.completed
                            ? "border-green-300 bg-green-100"
                            : "border-gray-300"
                        }`}
                      >
                        {challenge.completed && (
                          <div className="h-2 w-2 rounded bg-green-500"></div>
                        )}
                        {!challenge.completed && (
                          <div className="h-2 w-2 rounded bg-gray-300"></div>
                        )}
                      </div>
                      {req}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Reward */}
              <div className="mb-4 rounded-lg border border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50 p-3">
                <h4 className="mb-1 font-medium text-orange-900">🎁 Reward:</h4>
                <p className="text-sm text-orange-800">{challenge.reward}</p>
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Status:{" "}
                  <span
                    className={`font-medium ${
                      challenge.completed ? "text-green-600" : "text-yellow-600"
                    }`}
                  >
                    {challenge.completed ? "Completed" : "In Progress"}
                  </span>
                  {challenge.completed && challenge.completedAt && (
                    <span className="block text-xs text-gray-400">
                      {new Date(challenge.completedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {!challenge.completed && (
                  <button
                    onClick={() => handleCompleteChallenge(challenge._id)}
                    className="rounded-lg bg-orange-500 px-4 py-2 font-medium text-white transition-colors hover:bg-orange-600"
                  >
                    Complete Challenge
                  </button>
                )}
                {challenge.completed && (
                  <div className="rounded-lg bg-green-100 px-4 py-2 font-medium text-green-800">
                    ✓ Completed
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Achievement Showcase */}
      <div className="mt-12 rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
            <span className="text-2xl">🏅</span>
          </div>
          <h3 className="mb-2 text-xl font-semibold text-gray-900">
            Achievement System
          </h3>
          <p className="mb-4 text-gray-600">
            Unlock badges, certificates, and special recognition for your MUN
            achievements.
          </p>
          <div className="mx-auto grid max-w-2xl grid-cols-2 gap-4 md:grid-cols-4">
            <div
              className={`rounded-lg border border-gray-200 bg-white p-3 ${
                userStats.completedChallenges >= 5
                  ? "opacity-100"
                  : "opacity-75"
              }`}
            >
              <div className="mb-1 text-2xl">🥉</div>
              <h4 className="text-sm font-medium text-gray-700">
                Bronze Delegate
              </h4>
              <p className="text-xs text-gray-500">Complete 5 challenges</p>
              {userStats.completedChallenges >= 5 && (
                <p className="mt-1 text-xs font-medium text-green-600">
                  ✓ Unlocked
                </p>
              )}
            </div>
            <div
              className={`rounded-lg border border-gray-200 bg-white p-3 ${
                userStats.completedChallenges >= 15
                  ? "opacity-100"
                  : "opacity-75"
              }`}
            >
              <div className="mb-1 text-2xl">🥈</div>
              <h4 className="text-sm font-medium text-gray-700">
                Silver Diplomat
              </h4>
              <p className="text-xs text-gray-500">Complete 15 challenges</p>
              {userStats.completedChallenges >= 15 && (
                <p className="mt-1 text-xs font-medium text-green-600">
                  ✓ Unlocked
                </p>
              )}
            </div>
            <div
              className={`rounded-lg border border-gray-200 bg-white p-3 ${
                userStats.completedChallenges >= 30
                  ? "opacity-100"
                  : "opacity-75"
              }`}
            >
              <div className="mb-1 text-2xl">🥇</div>
              <h4 className="text-sm font-medium text-gray-700">
                Gold Ambassador
              </h4>
              <p className="text-xs text-gray-500">Complete 30 challenges</p>
              {userStats.completedChallenges >= 30 && (
                <p className="mt-1 text-xs font-medium text-green-600">
                  ✓ Unlocked
                </p>
              )}
            </div>
            <div
              className={`rounded-lg border border-gray-200 bg-white p-3 ${
                userStats.completedChallenges >= activeChallenges.length
                  ? "opacity-100"
                  : "opacity-75"
              }`}
            >
              <div className="mb-1 text-2xl">💎</div>
              <h4 className="text-sm font-medium text-gray-700">MUN Master</h4>
              <p className="text-xs text-gray-500">Complete all challenges</p>
              {userStats.completedChallenges >= activeChallenges.length && (
                <p className="mt-1 text-xs font-medium text-green-600">
                  ✓ Unlocked
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
