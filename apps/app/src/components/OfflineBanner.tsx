import { useNetworkStatus } from "../lib/useNetworkStatus";

export function OfflineBanner() {
  const { isOnline } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div className="fixed left-0 right-0 top-0 z-50 bg-orange-500 px-4 py-2 text-center text-sm font-medium text-white shadow-lg">
      <div className="flex items-center justify-center gap-2">
        <div className="h-2 w-2 animate-pulse rounded-full bg-white"></div>
        <span>Offline Mode – Viewing Saved Data</span>
        <div className="h-2 w-2 animate-pulse rounded-full bg-white"></div>
      </div>
    </div>
  );
}
