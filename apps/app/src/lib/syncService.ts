import { toast } from "sonner";

import {
  OfflineResolution,
  offlineStorage,
  OfflineTemplate,
} from "./offlineStorage";

export class SyncService {
  private static instance: SyncService;
  private syncInProgress = false;

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  async syncToServer(convexMutations: any) {
    if (this.syncInProgress) return;

    this.syncInProgress = true;

    try {
      const unsyncedItems = await offlineStorage.getUnsyncedItems();
      let syncCount = 0;

      // Sync resolutions
      for (const resolution of unsyncedItems.resolutions) {
        try {
          // Find country, committee, and topic IDs (simplified for demo)
          // In real implementation, you'd need to handle ID mapping
          await convexMutations.createResolution({
            title: resolution.title,
            country: resolution.country,
            topic: resolution.topic,
            committee: resolution.committee,
            countryId: "temp-id", // Would need proper ID mapping
            topicId: "temp-id",
            committeeId: "temp-id",
          });

          await offlineStorage.markAsSynced("resolutions", resolution.id);
          syncCount++;
        } catch (error) {
          console.error("Failed to sync resolution:", error);
        }
      }

      // Sync templates
      for (const template of unsyncedItems.templates) {
        try {
          await convexMutations.createTemplate({
            name: template.title,
            type: template.type,
            content: template.content,
            isPublic: false,
          });

          await offlineStorage.markAsSynced("templates", template.id);
          syncCount++;
        } catch (error) {
          console.error("Failed to sync template:", error);
        }
      }

      if (syncCount > 0) {
        toast.success(`Synced ${syncCount} items to server`);
      }
    } catch (error) {
      console.error("Sync failed:", error);
      toast.error("Failed to sync some items");
    } finally {
      this.syncInProgress = false;
    }
  }

  async syncFromServer(convexQueries: any) {
    try {
      // Fetch latest data from server and update local storage
      const [resolutions, templates] = await Promise.all([
        convexQueries.listResolutions(),
        convexQueries.listTemplates(),
      ]);

      // Update local storage with server data
      for (const resolution of resolutions || []) {
        await offlineStorage.saveResolution({
          id: resolution._id,
          title: resolution.title,
          content: resolution.content,
          country: resolution.country,
          topic: resolution.topic,
          committee: resolution.committee,
          lastModified: resolution._creationTime,
          synced: true,
        });
      }

      for (const template of templates || []) {
        await offlineStorage.saveTemplate({
          id: template._id,
          title: template.name,
          content: template.content,
          type: template.type,
          lastModified: template._creationTime,
          synced: true,
        });
      }
    } catch (error) {
      console.error("Failed to sync from server:", error);
    }
  }

  // Save data both locally and to server
  async saveResolution(
    resolution: Omit<OfflineResolution, "synced">,
    convexMutation?: any,
  ) {
    // Always save locally first
    await offlineStorage.saveResolution({
      ...resolution,
      synced: false,
    });

    // Try to save to server if online
    if (navigator.onLine && convexMutation) {
      try {
        await convexMutation({
          title: resolution.title,
          country: resolution.country,
          topic: resolution.topic,
          committee: resolution.committee,
          // Add proper ID mapping here
        });

        // Mark as synced if server save successful
        await offlineStorage.markAsSynced("resolutions", resolution.id);
      } catch (error) {
        console.error(
          "Failed to save to server, keeping in offline queue:",
          error,
        );
      }
    }
  }

  async saveTemplate(
    template: Omit<OfflineTemplate, "synced">,
    convexMutation?: any,
  ) {
    // Always save locally first
    await offlineStorage.saveTemplate({
      ...template,
      synced: false,
    });

    // Try to save to server if online
    if (navigator.onLine && convexMutation) {
      try {
        await convexMutation({
          name: template.title,
          type: template.type,
          content: template.content,
          isPublic: false,
        });

        // Mark as synced if server save successful
        await offlineStorage.markAsSynced("templates", template.id);
      } catch (error) {
        console.error(
          "Failed to save to server, keeping in offline queue:",
          error,
        );
      }
    }
  }
}

export const syncService = SyncService.getInstance();
