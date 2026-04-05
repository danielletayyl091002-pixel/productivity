"use client";

import { useState, useMemo, useEffect } from "react";
import { useNotes } from "@/stores/notes";
import { cn } from "@/lib/utils";
import { Search, Plus, Pin, Trash2, Folder, ChevronDown, ChevronRight, Tag } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
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
  const [sort, setSort] = useState<SortMode>("edited");
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [folders, setFolders] = useState<string[]>([]);
  const [foldersOpen, setFoldersOpen] = useState(true);
  const [newFolder, setNewFolder] = useState("");

  // Load folders from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("fluent_folders");
    if (saved) setFolders(JSON.parse(saved));
    else {
      const defaults = ["Personal", "Work"];
      setFolders(defaults);
      localStorage.setItem("fluent_folders", JSON.stringify(defaults));
    }
  }, []);

  const addFolder = () => {
    if (!newFolder.trim() || folders.includes(newFolder.trim())) return;
    const updated = [...folders, newFolder.trim()];
    setFolders(updated);
    localStorage.setItem("fluent_folders", JSON.stringify(updated));
    setNewFolder("");
  };

  // All unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    notes.forEach(n => n.tags?.forEach(t => tags.add(t)));
    return Array.from(tags);
  }, [notes]);

  // Filter and sort
  const filtered = useMemo(() => {
    let result = notes;
    if (activeFolder) result = result.filter(n => n.folderId === activeFolder);
    if (activeTag) result = result.filter(n => n.tags?.includes(activeTag));
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(n =>
        n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
      );
    }
    switch (sort) {
      case "edited": return result.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      case "created": return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      case "title": return result.sort((a, b) => a.title.localeCompare(b.title));
    }
  }, [notes, search, sort, activeFolder, activeTag]);

  const pinned = filtered.filter(n => n.isPinned);
  const unpinned = filtered.filter(n => !n.isPinned);

  return (
    <div className="flex flex-col h-full border-r border-[var(--border)] bg-[var(--bg-secondary)]">
      {/* Header */}
      <div className="p-3 border-b border-[var(--border)] space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-[13px] font-bold text-[var(--text-primary)]">Notes</h2>
          <button onClick={onNew}
            className="h-7 w-7 flex items-center justify-center rounded-md text-white"
            style={{ backgroundColor: "var(--color-primary)" }}>
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title & content..."
            className="w-full pl-8 pr-3 py-1.5 rounded-md border border-[var(--border)] bg-[var(--bg-card)] text-[11px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--color-primary)]" />
        </div>
        <div className="flex items-center justify-between">
          <select value={sort} onChange={e => setSort(e.target.value as SortMode)}
            className="text-[10px] bg-transparent text-[var(--text-muted)] outline-none">
            <option value="edited">Last edited</option>
            <option value="created">Created</option>
            <option value="title">Title A-Z</option>
          </select>
          {(activeFolder || activeTag) && (
            <button onClick={() => { setActiveFolder(null); setActiveTag(null); }}
              className="text-[10px] text-[var(--color-primary)] hover:underline">Clear filter</button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Folders */}
        <div className="px-3 pt-2">
          <button onClick={() => setFoldersOpen(!foldersOpen)}
            className="flex items-center gap-1 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider w-full mb-1">
            {foldersOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            <Folder className="h-3 w-3" /> Folders
          </button>
          {foldersOpen && (
            <div className="space-y-0.5 mb-2">
              <button onClick={() => setActiveFolder(null)}
                className={cn("w-full text-left text-[11px] px-2 py-1 rounded-md transition-colors",
                  !activeFolder ? "bg-[var(--color-primary-light)] text-[var(--color-primary)]" : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]")}>
                All Notes ({notes.length})
              </button>
              {folders.map(f => {
                const count = notes.filter(n => n.folderId === f).length;
                return (
                  <button key={f} onClick={() => setActiveFolder(activeFolder === f ? null : f)}
                    className={cn("w-full text-left text-[11px] px-2 py-1 rounded-md transition-colors flex justify-between",
                      activeFolder === f ? "bg-[var(--color-primary-light)] text-[var(--color-primary)]" : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]")}>
                    <span>{f}</span>
                    <span className="text-[var(--text-muted)]">{count}</span>
                  </button>
                );
              })}
              <div className="flex gap-1 mt-1">
                <input value={newFolder} onChange={e => setNewFolder(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") addFolder(); }}
                  placeholder="+ New folder"
                  className="flex-1 text-[10px] bg-transparent text-[var(--text-muted)] outline-none px-2 py-0.5" />
              </div>
            </div>
          )}
        </div>

        {/* Tags */}
        {allTags.length > 0 && (
          <div className="px-3 pb-2 border-b border-[var(--border)]">
            <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1 flex items-center gap-1">
              <Tag className="h-3 w-3" /> Tags
            </p>
            <div className="flex flex-wrap gap-1">
              {allTags.map(t => (
                <button key={t} onClick={() => setActiveTag(activeTag === t ? null : t)}
                  className={cn("text-[9px] px-1.5 py-0.5 rounded-full border transition-colors",
                    activeTag === t ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]" : "border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]")}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Pinned notes */}
        {pinned.length > 0 && (
          <div className="px-1 pt-2">
            <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider px-2 mb-1 flex items-center gap-1">
              <Pin className="h-3 w-3" /> Pinned
            </p>
            {pinned.map(note => (
              <NoteRow key={note.id} note={note} selected={selectedId === note.id} search={search}
                onSelect={() => onSelect(note.id)} onPin={() => updateNote(note.id, { isPinned: false })} onDelete={() => deleteNote(note.id)} />
            ))}
          </div>
        )}

        {/* All notes */}
        <div className="px-1 pt-1">
          {unpinned.length === 0 && pinned.length === 0 && (
            <div className="text-center py-8 px-4">
              <p className="text-2xl mb-2">📝</p>
              <p className="text-[11px] text-[var(--text-muted)]">{search ? "No matching notes" : "No notes yet"}</p>
            </div>
          )}
          {unpinned.map(note => (
            <NoteRow key={note.id} note={note} selected={selectedId === note.id} search={search}
              onSelect={() => onSelect(note.id)} onPin={() => updateNote(note.id, { isPinned: true })} onDelete={() => deleteNote(note.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function NoteRow({ note, selected, search, onSelect, onPin, onDelete }: {
  note: Note; selected: boolean; search: string; onSelect: () => void; onPin: () => void; onDelete: () => void;
}) {
  const preview = (note.content || "").replace(/<[^>]*>/g, "").slice(0, 60);
  const relTime = formatDistanceToNow(new Date(note.updatedAt), { addSuffix: false });

  return (
    <div onClick={onSelect}
      className={cn("group px-3 py-2.5 mx-1 rounded-lg cursor-pointer transition-colors",
        selected ? "bg-[var(--color-primary-light)]" : "hover:bg-[var(--bg-hover)]")}>
      <div className="flex items-start gap-2">
        <span className="text-sm mt-0.5 shrink-0">{note.coverEmoji || "📄"}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <p className={cn("text-[12px] font-semibold truncate", selected ? "text-[var(--color-primary)]" : "text-[var(--text-primary)]")}>
              {note.title || "Untitled"}
            </p>
            <span className="text-[10px] text-gray-300 shrink-0 whitespace-nowrap">{relTime}</span>
          </div>
          {preview && <p className="text-[10px] text-gray-400 truncate mt-0.5">{preview}</p>}
        </div>
        {/* Hover actions */}
        <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={e => { e.stopPropagation(); onPin(); }}
            className={cn("p-0.5 rounded", note.isPinned ? "text-[var(--color-primary)]" : "text-gray-400 hover:text-gray-600")}>
            <Pin className="h-3 w-3" />
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete(); }}
            className="p-0.5 rounded text-gray-400 hover:text-red-500">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
