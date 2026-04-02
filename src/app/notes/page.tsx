"use client";

import { useState, useMemo } from "react";
import { useItems } from "@/stores/items";
import { formatDisplayDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { Plus, Search, Trash2, Pin, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotesPage() {
  const { items, addItem, deleteItem, updateItem } = useItems();
  const [search, setSearch] = useState("");
  const router = useRouter();

  const notes = useMemo(() => {
    return items
      .filter(i => i.type === "note" && !i.archived)
      .filter(i => !search || i.title.toLowerCase().includes(search.toLowerCase()) || (i.content?.toLowerCase().includes(search.toLowerCase()) ?? false))
      .sort((a, b) => {
        // Pinned first, then by updated date
        const aPin = a.properties?.pinned ? 1 : 0;
        const bPin = b.properties?.pinned ? 1 : 0;
        if (aPin !== bPin) return bPin - aPin;
        return b.updatedAt.localeCompare(a.updatedAt);
      });
  }, [items, search]);

  const handleNew = async () => {
    const note = await addItem({ type: "note", title: "Untitled Note", content: "" });
    router.push(`/notes/${note.id}`);
  };

  const togglePin = (id: string, current: boolean) => {
    updateItem(id, { properties: { pinned: !current } });
  };

  const pinned = notes.filter(n => n.properties?.pinned);
  const unpinned = notes.filter(n => !n.properties?.pinned);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Notes</h2>
        <button onClick={handleNew}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white shadow-sm active:scale-95 transition-all"
          style={{ backgroundColor: "var(--color-primary)" }}>
          <Plus className="h-3.5 w-3.5" /> New Note
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-tertiary)]" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search notes..."
          className="w-full pl-9 pr-3 py-2.5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-card)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--color-primary)] transition-colors" />
      </div>

      {/* Notes list */}
      {notes.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-3">📝</p>
          <p className="text-base font-medium text-[var(--text-secondary)]">{search ? "No notes found" : "No notes yet"}</p>
          {!search && (
            <button onClick={handleNew} className="text-xs text-[var(--color-primary)] font-semibold mt-2 hover:underline">
              Create your first note
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Pinned */}
          {pinned.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-2 px-1 flex items-center gap-1">
                <Pin className="h-3 w-3" /> Pinned
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {pinned.map(note => (
                  <NoteCard key={note.id} note={note} onDelete={() => deleteItem(note.id)}
                    onTogglePin={() => togglePin(note.id, true)} />
                ))}
              </div>
            </div>
          )}

          {/* Regular */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {unpinned.map(note => (
              <NoteCard key={note.id} note={note} onDelete={() => deleteItem(note.id)}
                onTogglePin={() => togglePin(note.id, false)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NoteCard({ note, onDelete, onTogglePin }: {
  note: { id: string; title: string; content?: string; updatedAt: string; properties: Record<string, unknown> };
  onDelete: () => void;
  onTogglePin: () => void;
}) {
  const preview = (note.content || "").replace(/<[^>]*>/g, "").slice(0, 80);
  const isPinned = !!note.properties?.pinned;

  return (
    <Link href={`/notes/${note.id}`}
      className="group block rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-card)] p-4 transition-all card-hover relative">
      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{note.title || "Untitled"}</p>
      {preview && <p className="text-xs text-[var(--text-tertiary)] mt-1 line-clamp-2">{preview}</p>}
      <p className="text-[10px] text-[var(--text-tertiary)] mt-2">{formatDisplayDate(new Date(note.updatedAt))}</p>

      {/* Actions */}
      <div className="absolute top-2 right-2 hidden group-hover:flex gap-1">
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onTogglePin(); }}
          className={cn("p-1 rounded-full hover:bg-[var(--bg-hover)] transition-all",
            isPinned ? "text-[var(--color-primary)]" : "text-[var(--text-tertiary)]")}>
          <Pin className="h-3 w-3" />
        </button>
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
          className="p-1 rounded-full text-[var(--text-tertiary)] hover:text-red-400 hover:bg-[var(--bg-hover)] transition-all">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </Link>
  );
}
