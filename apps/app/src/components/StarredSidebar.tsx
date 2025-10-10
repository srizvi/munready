import { useMutation, useQuery } from "convex/react";

import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface StarredSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  resolutionId?: Id<"resolutions">;
}

export function StarredSidebar({
  isOpen,
  onClose,
  resolutionId,
}: StarredSidebarProps) {
  const starredItems = useQuery(api.starring.getStarredItems, { resolutionId });
  const toggleStar = useMutation(api.starring.toggleStar);

  const groupedItems = {
    clauses: starredItems?.filter((item) => item.itemType === "clause") || [],
    delegates:
      starredItems?.filter((item) => item.itemType === "delegate") || [],
    blocs: starredItems?.filter((item) => item.itemType === "bloc") || [],
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black bg-opacity-50">
      <div className="h-full w-80 overflow-y-auto bg-white">
        <div className="sticky top-0 border-b border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">⭐ Starred Items</h3>
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

        <div className="space-y-6 p-4">
          {groupedItems.clauses.length > 0 && (
            <div>
              <h4 className="mb-3 font-medium text-gray-900">📝 Clauses</h4>
              <div className="space-y-2">
                {groupedItems.clauses.map((item) => (
                  <div
                    key={item._id}
                    className="rounded-lg border border-blue-200 bg-blue-50 p-3"
                  >
                    <p className="text-sm text-blue-800">
                      Clause {item.itemId}
                    </p>
                    {item.notes && (
                      <p className="mt-1 text-xs text-blue-600">{item.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {groupedItems.delegates.length > 0 && (
            <div>
              <h4 className="mb-3 font-medium text-gray-900">👥 Delegates</h4>
              <div className="space-y-2">
                {groupedItems.delegates.map((item) => (
                  <div
                    key={item._id}
                    className="rounded-lg border border-green-200 bg-green-50 p-3"
                  >
                    <p className="text-sm font-medium text-green-800">
                      {item.itemId}
                    </p>
                    {item.notes && (
                      <p className="mt-1 text-xs text-green-600">
                        {item.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {groupedItems.blocs.length > 0 && (
            <div>
              <h4 className="mb-3 font-medium text-gray-900">🤝 Blocs</h4>
              <div className="space-y-2">
                {groupedItems.blocs.map((item) => (
                  <div
                    key={item._id}
                    className="rounded-lg border border-purple-200 bg-purple-50 p-3"
                  >
                    <p className="text-sm font-medium text-purple-800">
                      {item.itemId}
                    </p>
                    {item.notes && (
                      <p className="mt-1 text-xs text-purple-600">
                        {item.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {starredItems?.length === 0 && (
            <div className="py-8 text-center text-gray-500">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <svg
                  className="h-8 w-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              </div>
              <p>No starred items yet</p>
              <p className="mt-1 text-sm">
                Star clauses, delegates, or blocs for quick reference
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
