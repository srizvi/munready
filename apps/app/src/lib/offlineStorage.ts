import Dexie, { Table } from "dexie";

export interface OfflineTemplate {
  id: string;
  title: string;
  content: any;
  lastModified: number;
  type:
    | "resolution"
    | "position_paper"
    | "working_paper"
    | "gsl"
    | "moderated_caucus";
  synced: boolean;
}

export interface OfflineNote {
  id: string;
  title: string;
  content: string;
  lastModified: number;
  synced: boolean;
}

export interface OfflineSpeech {
  id: string;
  title: string;
  content: string;
  lastModified: number;
  synced: boolean;
}

export interface OfflineResolution {
  id: string;
  title: string;
  content: any;
  country: string;
  topic: string;
  committee: string;
  lastModified: number;
  synced: boolean;
}

export class OfflineDatabase extends Dexie {
  templates!: Table<OfflineTemplate>;
  notes!: Table<OfflineNote>;
  speeches!: Table<OfflineSpeech>;
  resolutions!: Table<OfflineResolution>;

  constructor() {
    super("ResoMateOffline");
    this.version(1).stores({
      templates: "id, title, type, lastModified, synced",
      notes: "id, title, lastModified, synced",
      speeches: "id, title, lastModified, synced",
      resolutions: "id, title, country, topic, committee, lastModified, synced",
    });
  }
}

export const offlineDb = new OfflineDatabase();

// Utility functions for offline operations
export const offlineStorage = {
  // Templates
  async saveTemplate(template: OfflineTemplate) {
    await offlineDb.templates.put(template);
  },

  async getTemplates(): Promise<OfflineTemplate[]> {
    return await offlineDb.templates
      .orderBy("lastModified")
      .reverse()
      .toArray();
  },

  async getTemplate(id: string): Promise<OfflineTemplate | undefined> {
    return await offlineDb.templates.get(id);
  },

  async deleteTemplate(id: string) {
    await offlineDb.templates.delete(id);
  },

  // Notes
  async saveNote(note: OfflineNote) {
    await offlineDb.notes.put(note);
  },

  async getNotes(): Promise<OfflineNote[]> {
    return await offlineDb.notes.orderBy("lastModified").reverse().toArray();
  },

  async getNote(id: string): Promise<OfflineNote | undefined> {
    return await offlineDb.notes.get(id);
  },

  async deleteNote(id: string) {
    await offlineDb.notes.delete(id);
  },

  // Speeches
  async saveSpeech(speech: OfflineSpeech) {
    await offlineDb.speeches.put(speech);
  },

  async getSpeeches(): Promise<OfflineSpeech[]> {
    return await offlineDb.speeches.orderBy("lastModified").reverse().toArray();
  },

  async getSpeech(id: string): Promise<OfflineSpeech | undefined> {
    return await offlineDb.speeches.get(id);
  },

  async deleteSpeech(id: string) {
    await offlineDb.speeches.delete(id);
  },

  // Resolutions
  async saveResolution(resolution: OfflineResolution) {
    await offlineDb.resolutions.put(resolution);
  },

  async getResolutions(): Promise<OfflineResolution[]> {
    return await offlineDb.resolutions
      .orderBy("lastModified")
      .reverse()
      .toArray();
  },

  async getResolution(id: string): Promise<OfflineResolution | undefined> {
    return await offlineDb.resolutions.get(id);
  },

  async deleteResolution(id: string) {
    await offlineDb.resolutions.delete(id);
  },

  // Sync operations
  async getUnsyncedItems() {
    const [templates, notes, speeches, resolutions] = await Promise.all([
      offlineDb.templates.where("synced").equals(0).toArray(),
      offlineDb.notes.where("synced").equals(0).toArray(),
      offlineDb.speeches.where("synced").equals(0).toArray(),
      offlineDb.resolutions.where("synced").equals(0).toArray(),
    ]);

    return { templates, notes, speeches, resolutions };
  },

  async markAsSynced(
    type: "templates" | "notes" | "speeches" | "resolutions",
    id: string,
  ) {
    if (type === "templates") {
      await offlineDb.templates.update(id, { synced: true });
    } else if (type === "notes") {
      await offlineDb.notes.update(id, { synced: true });
    } else if (type === "speeches") {
      await offlineDb.speeches.update(id, { synced: true });
    } else if (type === "resolutions") {
      await offlineDb.resolutions.update(id, { synced: true });
    }
  },

  // Clear all data
  async clearAll() {
    await Promise.all([
      offlineDb.templates.clear(),
      offlineDb.notes.clear(),
      offlineDb.speeches.clear(),
      offlineDb.resolutions.clear(),
    ]);
  },
};
