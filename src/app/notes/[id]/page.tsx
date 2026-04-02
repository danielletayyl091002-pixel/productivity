"use client";

import { useEffect, useState, useRef, use } from "react";
import { useNotes } from "@/contexts/NoteContext";
import Button from "@/components/ui/Button";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

export default function NoteEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getById, updateNote } = useNotes();
  const note = getById(id);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (note && !initialized.current) {
      setTitle(note.title);
      setContent(note.content);
      if (contentRef.current) {
        contentRef.current.innerHTML = note.content;
      }
      initialized.current = true;
    }
  }, [note]);

  const handleSave = () => {
    if (!note) return;
    updateNote(id, {
      title: title.trim() || "Untitled Note",
      content: contentRef.current?.innerHTML || "",
    });
  };

  useEffect(() => {
    const timer = setInterval(handleSave, 5000);
    return () => clearInterval(timer);
  });

  if (!note) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Note not found</p>
        <Link href="/notes" className="text-blue-500 text-sm hover:underline">Back to notes</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <Link href="/notes" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" /> Notes
        </Link>
        <Button size="sm" variant="secondary" onClick={handleSave}><Save className="h-4 w-4" /> Save</Button>
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleSave}
        className="w-full text-2xl font-bold text-gray-900 border-none outline-none placeholder:text-gray-300"
        placeholder="Note title..."
      />

      <div
        ref={contentRef}
        contentEditable
        suppressContentEditableWarning
        className="min-h-[400px] prose prose-sm max-w-none focus:outline-none text-gray-700 [&:empty]:before:content-['Start_writing...'] [&:empty]:before:text-gray-300"
        onBlur={handleSave}
      />
    </div>
  );
}
