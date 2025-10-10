import { useEffect, useState } from "react";
import { toast } from "sonner";

import { OfflineNote, offlineStorage } from "../lib/offlineStorage";
import { useNetworkStatus } from "../lib/useNetworkStatus";

export function NotesScreen() {
  const [notes, setNotes] = useState<OfflineNote[]>([]);
  const [newNote, setNewNote] = useState({ title: "", content: "" });
  const [editingNote, setEditingNote] = useState<OfflineNote | null>(null);
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    const savedNotes = await offlineStorage.getNotes();
    setNotes(savedNotes);
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.title.trim() || !newNote.content.trim()) {
      toast.error("Please fill in both title and content");
      return;
    }

    const note: OfflineNote = {
      id: `note-${Date.now()}`,
      title: newNote.title,
      content: newNote.content,
      lastModified: Date.now(),
      synced: false,
    };

    await offlineStorage.saveNote(note);
    setNewNote({ title: "", content: "" });
    loadNotes();
    toast.success(isOnline ? "Note saved!" : "Note saved offline!");
  };

  const handleEditNote = async (note: OfflineNote) => {
    if (!editingNote) return;

    const updatedNote = {
      ...editingNote,
      lastModified: Date.now(),
      synced: false,
    };

    await offlineStorage.saveNote(updatedNote);
    setEditingNote(null);
    loadNotes();
    toast.success("Note updated!");
  };

  const handleDeleteNote = async (id: string) => {
    await offlineStorage.deleteNote(id);
    loadNotes();
    toast.success("Note deleted!");
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">My Notes</h1>
            {!isOnline && (
              <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-800">
                Offline Mode
              </span>
            )}
          </div>
          <p className="mt-1 text-gray-600">
            {isOnline
              ? "Create and manage your ResoMate notes"
              : "Working offline - Notes will sync when you reconnect"}
          </p>
        </div>

        <div className="p-6">
          {/* Create New Note Form */}
          <form
            onSubmit={handleSaveNote}
            className="mb-8 rounded-lg bg-gray-50 p-4"
          >
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Create New Note
            </h3>
            <div className="space-y-4">
              <input
                type="text"
                value={newNote.title}
                onChange={(e) =>
                  setNewNote((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Note title..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <textarea
                value={newNote.content}
                onChange={(e) =>
                  setNewNote((prev) => ({ ...prev, content: e.target.value }))
                }
                placeholder="Write your note content here..."
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
              >
                Save Note
              </button>
            </div>
          </form>

          {/* Notes List */}
          <div className="space-y-4">
            {notes.length === 0 ? (
              <div className="py-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <span className="text-2xl">📝</span>
                </div>
                <h3 className="mb-2 text-lg font-medium text-gray-900">
                  No notes yet
                </h3>
                <p className="text-gray-600">
                  Create your first note above to get started.
                </p>
              </div>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-lg border border-gray-200 p-4"
                >
                  {editingNote?.id === note.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editingNote.title}
                        onChange={(e) =>
                          setEditingNote((prev) =>
                            prev ? { ...prev, title: e.target.value } : null,
                          )
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                      <textarea
                        value={editingNote.content}
                        onChange={(e) =>
                          setEditingNote((prev) =>
                            prev ? { ...prev, content: e.target.value } : null,
                          )
                        }
                        rows={4}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditNote(note)}
                          className="rounded bg-green-500 px-3 py-1 text-sm text-white transition-colors hover:bg-green-600"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingNote(null)}
                          className="rounded bg-gray-500 px-3 py-1 text-sm text-white transition-colors hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="mb-2 flex items-start justify-between">
                        <h3 className="font-semibold text-gray-900">
                          {note.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          {!note.synced && (
                            <span className="rounded-full bg-orange-100 px-2 py-1 text-xs text-orange-800">
                              Unsynced
                            </span>
                          )}
                          <div className="flex gap-1">
                            <button
                              onClick={() => setEditingNote(note)}
                              className="rounded bg-blue-500 px-2 py-1 text-xs text-white transition-colors hover:bg-blue-600"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="rounded bg-red-500 px-2 py-1 text-xs text-white transition-colors hover:bg-red-600"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                      <p className="whitespace-pre-wrap text-gray-700">
                        {note.content}
                      </p>
                      <div className="mt-2 text-xs text-gray-500">
                        Last modified:{" "}
                        {new Date(note.lastModified).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
