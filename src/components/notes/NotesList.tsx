"use client";

import { useState, useMemo } from "react";
import { useNotes } from "@/stores/notes";
import { cn } from "@/lib/utils";
import { Search, Plus, Pin, Trash2, FileText } from "lucide-react";
import { format } from "date-fns";
import type { Note } from "@/db/schema";

interface Props {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}

type SortMode = "edited" | "created" | "title";

export default function NotesList({ selectedId, onSelect, onNew }: Props) {
  const { notes, updateNote, deleteNote } = useNotes();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pinned">("all");
  const [sort, setSort] = useState<SortMode>("edited");

  const filtered = useMemo(() => {
    let result = notes;
    if (filter === "pinned") result = result.filter(n => n.isPinned);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
    }
    switch (sort) {
      case "edited": return result.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      case "created": return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      case "title": return result.sort((a, b) => a.title.localeCompare(b.title));
    }
  }, [notes, search, filter, sort]);

  return (
    <div className="flex flex-col h-full border-r border-[var(--border)] bg-[var(--bg-secondary)]">
      {/* Header */}
      <div className="p-3 border-b border-[var(--border)] space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-[13px] font-bold text-[var(--text-primary)]">Notes</h2>
          <button onClick={onNew}
            className="h-7 w-7 flex items-center justify-center rounded-md text-white transition-all active:scale-95"
            style={{ backgroundColor: "var(--color-primary)" }}>
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes..."
            className="w-full pl-8 pr-3 py-1.5 rounded-md border border-[var(--border)] bg-[var(--bg-card)] text-[11px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--color-primary)]" />
        </div>
        {/* Filters + Sort */}
        <div className="flex items-center gap-1.5">
          <button onClick={() => setFilter(filter === "all" ? "pinned" : "all")}
            className={cn("px-2 py-0.5 rounded-md text-[10px] font-medium transition-all",
              filter === "pinned" ? "bg-[var(--color-primary-light)] text-[var(--color-primary)]" : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)]")}>
            <Pin className="h-2.5 w-2.5 inline mr-0.5" /> Pinned
          </button>
          <select value={sort} onChange={e => setSort(e.target.value as SortMode)}
            className="ml-auto text-[10px] bg-transparent text-[var(--text-muted)] outline-none cursor-pointer">
            <option value="edited">Last edited</option>
            <option value="created">Created</option>
            <option value="title">Title A-Z</option>
          </select>
        </div>
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="text-center py-10">
            <FileText className="h-8 w-8 text-[var(--text-muted)] mx-auto mb-2 opacity-40" />
            <p className="text-[11px] text-[var(--text-muted)]">{search ? "No matching notes" : "No notes yet"}</p>
          </div>
        )}
        {filtered.map(note => (
          <NoteRow key={note.id} note={note} selected={selectedId === note.id}
            onSelect={() => onSelect(note.id)}
            onPin={() => updateNote(note.id, { isPinned: !note.isPinned })}
            onDelete={() => deleteNote(note.id)} />
        ))}
      </div>
    </div>
  );
}

function NoteRow({ note, selected, onSelect, onPin, onDelete }: {
  note: Note; selected: boolean; onSelect: () => void; onPin: () => void; onDelete: () => void;
}) {
  const preview = note.content.replace(/<[^>]*>/g, "").slice(0, 60);
  return (
    <div onClick={onSelect}
      className={cn("group px-3 py-2.5 border-b border-[var(--border)] cursor-pointer transition-colors",
        selected ? "bg-[var(--color-primary-light)]" : "hover:bg-[var(--bg-hover)]")}>
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0 flex-1">
          <p className={cn("text-[12px] font-semibold truncate", selected ? "text-[var(--color-primary)]" : "text-[var(--text-primary)]")}>
            {note.isPinned && <Pin className="h-2.5 w-2.5 inline mr-1 text-[var(--color-primary)]" />}
            {note.title || "Untitled"}
          </p>
          <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{format(new Date(note.updatedAt), "MMM d, h:mm a")}</p>
          {preview && <p className="text-[10px] text-[var(--text-muted)] mt-0.5 truncate">{preview}</p>}
        </div>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 shrink-0">
          <button onClick={(e) => { e.stopPropagation(); onPin(); }}
            className={cn("p-0.5 rounded", note.isPinned ? "text-[var(--color-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]")}>
            <Pin className="h-3 w-3" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-0.5 rounded text-[var(--text-muted)] hover:text-red-500">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
      {note.tags.length > 0 && (
        <div className="flex gap-1 mt-1">
          {note.tags.slice(0, 3).map(t => (
            <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border)]">{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}
