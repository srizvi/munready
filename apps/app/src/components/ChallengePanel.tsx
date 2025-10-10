import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

import { api } from "../../convex/_generated/api";

interface ChallengePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChallengePanel({ isOpen, onClose }: ChallengePanelProps) {
  const userChallenges = useQuery(api.challenges.getUserChallenges);
  const activeChallenges = useQuery(api.challenges.getActiveChallenges);
  const completeChallenge = useMutation(api.challenges.completeChallenge);

  const handleCompleteChallenge = async (challengeId: string) => {
    try {
      await completeChallenge({ challengeId: challengeId as any });
      toast.success("Challenge completed! 🎉");
    } catch (error) {
      toast.error("Failed to complete challenge");
    }
  };

  const completedChallenges =
    userChallenges?.filter((uc) => uc.completed) || [];
  const totalPoints = completedChallenges.reduce(
    (sum, uc) => sum + (uc.challenge?.points || 0),
    0,
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black bg-opacity-50">
      <div className="h-full w-80 overflow-y-auto bg-white">
        <div className="sticky top-0 border-b border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">🎯 MUN Challenges</h3>
              <p className="text-sm text-gray-600">
                {totalPoints} points earned
              </p>
            </div>
            <button
              onClick={onClose}
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

        <div className="space-y-4 p-4">
          {activeChallenges?.map((challenge) => {
            const userChallenge = userChallenges?.find(
              (uc) => uc.challengeId === challenge._id,
            );
            const isCompleted = userChallenge?.completed || false;

            return (
              <div
                key={challenge._id}
                className={`rounded-lg border p-4 ${
                  isCompleted
                    ? "border-green-200 bg-green-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {challenge.title}
                    </h4>
                    <p className="mt-1 text-sm text-gray-600">
                      {challenge.description}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">
                        {challenge.category}
                      </span>
                      <span className="text-xs font-medium text-blue-600">
                        {challenge.points} pts
                      </span>
                    </div>
                  </div>
                  {isCompleted ? (
                    <div className="text-green-600">
                      <svg
                        className="h-6 w-6"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleCompleteChallenge(challenge._id)}
                      className="rounded bg-blue-500 px-3 py-1 text-xs text-white transition-colors hover:bg-blue-600"
                    >
                      Complete
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {(!activeChallenges || activeChallenges.length === 0) && (
            <div className="py-8 text-center text-gray-500">
              <p>No challenges available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
