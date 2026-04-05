"use client";

import { useState, useEffect } from "react";
import { useNotes } from "@/stores/notes";
import NotesList from "@/components/notes/NotesList";
import NoteEditor from "@/components/notes/NoteEditor";
import { NOTE_TEMPLATES } from "@/lib/templates";
import { X } from "lucide-react";

export default function NotesPage() {
  const { notes, loaded, load, addNote } = useNotes();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => { load(); }, [load]);

  const handleNew = async () => {
    const note = await addNote("Untitled");
    setSelectedId(note.id);
  };

  const handleTemplate = async (templateId: string) => {
    const template = NOTE_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    const note = await addNote(template.getTitle(), template.getContent());
    setSelectedId(note.id);
    setShowTemplates(false);
  };

  if (!loaded) return <div className="flex items-center justify-center h-full"><p className="text-sm text-[var(--text-muted)]">Loading...</p></div>;

  return (
    <div className="flex h-[calc(100vh-56px)] -m-6">
      {/* List panel */}
      <div className="w-[280px] shrink-0">
        <NotesList selectedId={selectedId} onSelect={setSelectedId} onNew={handleNew} />
      </div>

      {/* Editor */}
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
            <button onClick={() => setShowTemplates(true)}
              className="px-4 py-2 rounded-lg text-[12px] font-medium text-[var(--text-secondary)] bg-[var(--bg-secondary)] border border-[var(--border)] hover:bg-[var(--bg-hover)]">
              From Template
            </button>
          </div>
        </div>
      )}

      {/* Template modal */}
      {showTemplates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowTemplates(false)} />
          <div className="relative z-10 w-full max-w-md bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-lg)] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Choose a template</h3>
              <button onClick={() => setShowTemplates(false)} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-md hover:bg-[var(--bg-hover)]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {NOTE_TEMPLATES.map(t => (
                <button key={t.id} onClick={() => handleTemplate(t.id)}
                  className="text-left p-4 rounded-xl border border-[var(--border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-all">
                  <span className="text-2xl">{t.emoji}</span>
                  <p className="text-[13px] font-bold text-[var(--text-primary)] mt-2">{t.name}</p>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{t.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
