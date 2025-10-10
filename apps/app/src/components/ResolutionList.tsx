import { useEffect, useState } from "react";

import { Id } from "../../convex/_generated/dataModel";
import { OfflineResolution, offlineStorage } from "../lib/offlineStorage";
import { useNetworkStatus } from "../lib/useNetworkStatus";

interface Resolution {
  _id: Id<"resolutions">;
  _creationTime: number;
  title: string;
  country?: string;
  topic?: string;
  committee?: string;
  status: "draft" | "in_progress" | "completed";
  wordCount: number;
}

interface ResolutionListProps {
  resolutions: Resolution[];
  onSelectResolution: (id: Id<"resolutions">) => void;
}

export function ResolutionList({
  resolutions,
  onSelectResolution,
}: ResolutionListProps) {
  const [offlineResolutions, setOfflineResolutions] = useState<
    OfflineResolution[]
  >([]);
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    if (!isOnline) {
      // Load offline resolutions when offline
      offlineStorage.getResolutions().then(setOfflineResolutions);
    }
  }, [isOnline]);

  // Use offline data when offline, online data when online
  const displayResolutions = isOnline
    ? resolutions
    : offlineResolutions.map((r) => ({
        _id: r.id as Id<"resolutions">,
        _creationTime: r.lastModified,
        title: r.title,
        country: r.country,
        topic: r.topic,
        committee: r.committee,
        status: "draft" as const,
        wordCount: 0,
      }));
  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "archived":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (displayResolutions.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
          <svg
            className="h-8 w-8 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="mb-2 text-lg font-medium text-gray-900">
          {isOnline ? "No resolutions yet" : "No offline resolutions"}
        </h3>
        <p className="mb-4 text-gray-600">
          {isOnline
            ? "Create your first resolution to get started."
            : "No saved resolutions available offline. Connect to internet to access your resolutions."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {displayResolutions.map((resolution) => (
        <div
          key={resolution._id}
          onClick={() => onSelectResolution(resolution._id)}
          className="cursor-pointer rounded-lg border border-gray-200 p-4 transition-all hover:border-blue-300 hover:shadow-sm"
        >
          <div className="mb-2 flex items-start justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {resolution.title}
            </h3>
            <div className="flex items-center gap-2">
              {!isOnline && (
                <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800">
                  Offline
                </span>
              )}
              <span
                className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(resolution.status)}`}
              >
                {resolution.status}
              </span>
            </div>
          </div>

          <div className="mb-3 grid grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Country:</span>{" "}
              {resolution.country || "Unknown"}
            </div>
            <div>
              <span className="font-medium">Topic:</span>{" "}
              {resolution.topic || "Unknown"}
            </div>
            <div>
              <span className="font-medium">Committee:</span>{" "}
              {resolution.committee || "Unknown"}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{resolution.wordCount} words</span>
            <span>
              Created {new Date(resolution._creationTime).toLocaleDateString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
