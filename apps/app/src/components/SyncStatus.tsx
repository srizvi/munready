import { useEffect, useState } from "react";

import { offlineStorage } from "../lib/offlineStorage";
import { syncService } from "../lib/syncService";
import { useNetworkStatus } from "../lib/useNetworkStatus";

export function SyncStatus() {
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    const updateUnsyncedCount = async () => {
      const unsynced = await offlineStorage.getUnsyncedItems();
      const total =
        unsynced.templates.length +
        unsynced.notes.length +
        unsynced.speeches.length +
        unsynced.resolutions.length;
      setUnsyncedCount(total);
    };

    updateUnsyncedCount();

    // Update count periodically
    const interval = setInterval(updateUnsyncedCount, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleReconnect = async () => {
      if (isOnline && unsyncedCount > 0) {
        setIsSyncing(true);
        try {
          // Note: In a real implementation, you'd pass the actual Convex mutations
          // await syncService.syncToServer(convexMutations);
        } catch (error) {
          console.error("Sync failed:", error);
        } finally {
          setIsSyncing(false);
        }
      }
    };

    window.addEventListener("network-reconnected", handleReconnect);
    return () =>
      window.removeEventListener("network-reconnected", handleReconnect);
  }, [isOnline, unsyncedCount]);

  if (!isOnline && unsyncedCount === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOnline && unsyncedCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-white shadow-lg">
          <div className="h-2 w-2 rounded-full bg-white"></div>
          <span className="text-sm font-medium">
            {unsyncedCount} item{unsyncedCount !== 1 ? "s" : ""} pending sync
          </span>
        </div>
      )}

      {isSyncing && (
        <div className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white shadow-lg">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          <span className="text-sm font-medium">Syncing data...</span>
        </div>
      )}
    </div>
  );
}
