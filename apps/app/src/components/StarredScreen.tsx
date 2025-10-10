import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface StarredScreenProps {
  onBack: () => void;
}

export function StarredScreen({ onBack }: StarredScreenProps) {
  const [activeFilter, setActiveFilter] = useState<
    "all" | "clause" | "delegate" | "bloc"
  >("all");
  const starredItems = useQuery(api.starring.getStarredItems, {});
  const removeStar = useMutation(api.starring.toggleStar);

  const filteredItems =
    starredItems?.filter(
      (item) => activeFilter === "all" || item.itemType === activeFilter,
    ) || [];

  const handleRemoveStar = async (
    itemId: string,
    itemType: string,
    resolutionId?: Id<"resolutions">,
  ) => {
    try {
      await removeStar({
        itemType: itemType as "clause" | "delegate" | "bloc",
        itemId,
        resolutionId,
      });
      toast.success("Item removed from starred");
    } catch (error) {
      toast.error("Failed to remove star");
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case "clause":
        return "📝";
      case "delegate":
        return "👥";
      case "bloc":
        return "🤝";
      default:
        return "⭐";
    }
  };

  const getItemColor = (type: string) => {
    switch (type) {
      case "clause":
        return "bg-blue-50 border-blue-200 text-blue-800";
      case "delegate":
        return "bg-green-50 border-green-200 text-green-800";
      case "bloc":
        return "bg-purple-50 border-purple-200 text-purple-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  const getItemDisplayText = (item: any) => {
    switch (item.itemType) {
      case "clause":
        return `Clause ${item.itemId.split("-")[1] || item.itemId}`;
      case "delegate":
        return item.itemId; // Country/delegate name
      case "bloc":
        return item.itemId; // Bloc name
      default:
        return item.itemId;
    }
  };

  const getItemDescription = (item: any) => {
    switch (item.itemType) {
      case "clause":
        const clauseType = item.itemId.includes("preamble")
          ? "Preambular"
          : "Operative";
        return `${clauseType} clause from resolution`;
      case "delegate":
        return "Alliance partner or important delegate";
      case "bloc":
        return "Voting bloc or coalition";
      default:
        return "Starred item";
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="mb-3 text-3xl font-bold text-gray-900">
          ⭐ Starred Items
        </h2>
        <p className="text-lg text-gray-600">
          Your bookmarked clauses, delegates, and blocs for quick reference
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-3">
          {[
            { id: "all", name: "All Items", icon: "⭐" },
            { id: "clause", name: "Clauses", icon: "📝" },
            { id: "delegate", name: "Delegates", icon: "👥" },
            { id: "bloc", name: "Blocs", icon: "🤝" },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id as any)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
                activeFilter === filter.id
                  ? "bg-yellow-500 text-white"
                  : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span>{filter.icon}</span>
              {filter.name}
              <span className="text-sm opacity-75">
                (
                {starredItems?.filter(
                  (item) => filter.id === "all" || item.itemType === filter.id,
                ).length || 0}
                )
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Starred Items Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <div
              key={item._id}
              className={`rounded-xl border p-6 transition-shadow hover:shadow-md ${getItemColor(item.itemType)}`}
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getItemIcon(item.itemType)}</span>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {getItemDisplayText(item)}
                    </h3>
                    <p className="text-sm opacity-75">
                      {getItemDescription(item)}
                    </p>
                    <p className="mt-1 text-xs opacity-60">
                      {new Date(item._creationTime).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    handleRemoveStar(
                      item.itemId,
                      item.itemType,
                      item.resolutionId,
                    )
                  }
                  className="text-red-500 transition-colors hover:text-red-700"
                  title="Remove from starred"
                >
                  <svg
                    className="h-5 w-5"
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

              <div className="space-y-3">
                {item.notes && (
                  <div>
                    <h4 className="mb-1 text-sm font-medium opacity-75">
                      Notes:
                    </h4>
                    <p className="rounded bg-white bg-opacity-50 px-3 py-2 text-sm">
                      {item.notes}
                    </p>
                  </div>
                )}

                {item.resolutionId && (
                  <div>
                    <h4 className="mb-1 text-sm font-medium opacity-75">
                      From Resolution:
                    </h4>
                    <p className="rounded bg-white bg-opacity-50 px-2 py-1 font-mono text-xs">
                      {item.resolutionId}
                    </p>
                  </div>
                )}

                {/* Additional context for different item types */}
                {item.itemType === "clause" && (
                  <div className="rounded bg-white bg-opacity-50 px-3 py-2">
                    <p className="text-xs opacity-75">
                      {item.itemId.includes("preamble")
                        ? "This preambular clause sets context and background for the resolution."
                        : "This operative clause contains specific actions and measures."}
                    </p>
                  </div>
                )}

                {item.itemType === "delegate" && (
                  <div className="rounded bg-white bg-opacity-50 px-3 py-2">
                    <p className="text-xs opacity-75">
                      Potential alliance partner for diplomatic cooperation and
                      voting alignment.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 border-t border-current border-opacity-20 pt-4">
                <div className="flex items-center justify-between text-xs opacity-75">
                  <span>Starred Item</span>
                  <span className="capitalize">{item.itemType}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-yellow-100">
            <span className="text-4xl">⭐</span>
          </div>
          <h3 className="mb-3 text-2xl font-semibold text-gray-900">
            {activeFilter === "all"
              ? "No starred items yet"
              : `No starred ${activeFilter}s yet`}
          </h3>
          <p className="mx-auto mb-6 max-w-md text-gray-600">
            {activeFilter === "all"
              ? "Star clauses, delegates, or blocs while working on resolutions for quick reference later."
              : `Star ${activeFilter}s while working on resolutions to save them for quick reference.`}
          </p>
          <div className="mx-auto max-w-2xl rounded-xl border border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 p-6">
            <h4 className="mb-3 font-semibold text-gray-900">
              How to star items:
            </h4>
            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <span className="text-xl">📝</span>
                </div>
                <h5 className="mb-1 font-medium text-blue-800">Clauses</h5>
                <p className="text-blue-700">
                  Click the star icon next to any clause in generated
                  resolutions or the editor
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <span className="text-xl">👥</span>
                </div>
                <h5 className="mb-1 font-medium text-green-800">Delegates</h5>
                <p className="text-green-700">
                  Star alliance suggestions or important delegates from the
                  alliance section
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                  <span className="text-xl">🤝</span>
                </div>
                <h5 className="mb-1 font-medium text-purple-800">Blocs</h5>
                <p className="text-purple-700">
                  Save important voting blocs and coalitions for strategic
                  planning
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
