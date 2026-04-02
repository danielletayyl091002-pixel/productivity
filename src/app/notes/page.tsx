"use client";

import { useState } from "react";
import { useNotes } from "@/contexts/NoteContext";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import EmptyState from "@/components/ui/EmptyState";
import { StickyNote, Plus, Trash2, Pin, Search } from "lucide-react";
import { formatDisplayDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function NotesPage() {
  const { notes, addNote, removeNote, updateNote } = useNotes();
  const [search, setSearch] = useState("");

  const handleNew = () => {
    const note = addNote({ title: "Untitled Note", content: "", isPinned: false });
    window.location.href = `/notes/${note.id}`;
  };

  const filtered = notes.filter((n) =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.content.toLowerCase().includes(search.toLowerCase())
  );

  const pinned = filtered.filter((n) => n.isPinned);
  const unpinned = filtered.filter((n) => !n.isPinned);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote className="h-5 w-5 text-slate-500" />
          <h2 className="text-lg font-semibold">Notes</h2>
        </div>
        <Button size="sm" onClick={handleNew}><Plus className="h-4 w-4" /> New Note</Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search notes..."
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {notes.length === 0 ? (
        <EmptyState icon={<StickyNote className="h-10 w-10" />} title="No notes yet" description="Create your first note" action={{ label: "New Note", onClick: handleNew }} />
      ) : (
        <div className="space-y-4">
          {pinned.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1"><Pin className="h-3 w-3" /> Pinned</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {pinned.map((note) => (
                  <NoteCard key={note.id} note={note} onDelete={() => removeNote(note.id)} onTogglePin={() => updateNote(note.id, { isPinned: !note.isPinned })} />
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {unpinned.map((note) => (
              <NoteCard key={note.id} note={note} onDelete={() => removeNote(note.id)} onTogglePin={() => updateNote(note.id, { isPinned: !note.isPinned })} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NoteCard({ note, onDelete, onTogglePin }: { note: { id: string; title: string; content: string; isPinned: boolean; updatedAt: string }; onDelete: () => void; onTogglePin: () => void }) {
  const preview = note.content.replace(/<[^>]*>/g, "").slice(0, 100);
  return (
    <Card className="group relative">
      <Link href={`/notes/${note.id}`} className="block">
        <p className="text-sm font-semibold text-gray-900 truncate">{note.title}</p>
        {preview && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{preview}</p>}
        <p className="text-[10px] text-gray-400 mt-2">{formatDisplayDate(new Date(note.updatedAt))}</p>
      </Link>
      <div className="absolute top-2 right-2 hidden group-hover:flex gap-1">
        <button onClick={(e) => { e.preventDefault(); onTogglePin(); }} className={cn("p-1 rounded hover:bg-gray-100", note.isPinned ? "text-blue-500" : "text-gray-400")}>
          <Pin className="h-3 w-3" />
        </button>
        <button onClick={(e) => { e.preventDefault(); onDelete(); }} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </Card>
  );
}
