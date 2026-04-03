"use client";

import { useState, useEffect } from "react";
import { useNotes } from "@/stores/notes";
import { useSettings } from "@/stores/settings";
import NotesList from "@/components/notes/NotesList";
import NoteEditor from "@/components/notes/NoteEditor";
import { format } from "date-fns";

export default function NotesPage() {
  const { notes, loaded, load, addNote } = useNotes();
  const { get: getSetting } = useSettings();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => { load(); }, [load]);

  const handleNew = async () => {
    const note = await addNote("Untitled");
    setSelectedId(note.id);
  };

  const handleNewFromTemplate = async (content: string) => {
    const today = format(new Date(), "MMMM d, yyyy");
    const filled = content.replace(/\{\{date\}\}/g, today);
    const note = await addNote("Untitled", filled);
    setSelectedId(note.id);
    setShowTemplates(false);
  };

  // Parse templates from settings
  const templates: { name: string; content: string }[] = (() => {
    try { return JSON.parse(getSetting("noteTemplates", "[]")); } catch { return []; }
  })();

  if (!loaded) return <div className="flex items-center justify-center h-full"><p className="text-sm text-[var(--text-muted)]">Loading...</p></div>;

  return (
    <div className="flex h-[calc(100vh-56px)] -m-6">
      {/* List panel (30%) */}
      <div className="w-[280px] shrink-0">
        <NotesList selectedId={selectedId} onSelect={setSelectedId} onNew={handleNew} />
      </div>

      {/* Editor (70%) */}
      {selectedId ? (
        <NoteEditor noteId={selectedId} />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-[var(--text-muted)] text-sm">Select a note or create a new one</p>
          <div className="flex gap-2">
            <button onClick={handleNew}
              className="px-4 py-2 rounded-lg text-[12px] font-semibold text-white transition-all active:scale-[0.98]"
              style={{ backgroundColor: "var(--color-primary)" }}>
              + Blank Note
            </button>
            <div className="relative">
              <button onClick={() => setShowTemplates(!showTemplates)}
                className="px-4 py-2 rounded-lg text-[12px] font-medium text-[var(--text-secondary)] bg-[var(--bg-secondary)] border border-[var(--border)] hover:bg-[var(--bg-hover)]">
                From Template
              </button>
              {showTemplates && templates.length > 0 && (
                <div className="absolute top-full mt-1 left-0 w-48 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg shadow-[var(--shadow-lg)] py-1 z-10">
                  {templates.map((t, i) => (
                    <button key={i} onClick={() => handleNewFromTemplate(t.content)}
                      className="w-full text-left px-3 py-2 text-[12px] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]">
                      {t.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
