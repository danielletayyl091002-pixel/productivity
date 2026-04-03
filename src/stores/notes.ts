import { create } from "zustand";
import { db, type Note } from "@/db/schema";
import { generateId } from "@/lib/id";

interface NotesState {
  notes: Note[];
  loaded: boolean;
  load: () => Promise<void>;
  addNote: (title: string, content?: string, tags?: string[]) => Promise<Note>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  getById: (id: string) => Note | undefined;
}

export const useNotes = create<NotesState>((set, get) => ({
  notes: [],
  loaded: false,

  load: async () => {
    const notes = await db.notes.toArray();
    set({ notes: notes.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), loaded: true });
  },

  addNote: async (title, content = "", tags = []) => {
    const now = new Date().toISOString();
    const note: Note = { id: generateId(), title, content, tags, isPinned: false, createdAt: now, updatedAt: now };
    await db.notes.add(note);
    set(s => ({ notes: [note, ...s.notes] }));
    return note;
  },

  updateNote: async (id, updates) => {
    const patched = { ...updates, updatedAt: new Date().toISOString() };
    await db.notes.update(id, patched);
    set(s => ({
      notes: s.notes.map(n => n.id === id ? { ...n, ...patched } : n)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    }));
  },

  deleteNote: async (id) => {
    await db.notes.delete(id);
    set(s => ({ notes: s.notes.filter(n => n.id !== id) }));
  },

  getById: (id) => get().notes.find(n => n.id === id),
}));
