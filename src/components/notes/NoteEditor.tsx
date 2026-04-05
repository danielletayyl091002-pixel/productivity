"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useNotes } from "@/stores/notes";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Highlight from "@tiptap/extension-highlight";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ArrowLeft, ImageIcon, Smile, Bold, Italic, Highlighter, Heading1, Heading2, Code, List, ListOrdered, CheckSquare, Quote, Minus } from "lucide-react";

const COVER_GRADIENTS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
  "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
  "linear-gradient(to right, #1e3c72, #2a5298)",
];

const SLASH_COMMANDS = [
  { label: "Text", icon: "📝", desc: "Plain paragraph", group: "Basic", command: (e: any) => e?.chain().focus().setParagraph().run() },
  { label: "Heading 1", icon: "#", desc: "Large heading", group: "Basic", command: (e: any) => e?.chain().focus().toggleHeading({ level: 1 }).run() },
  { label: "Heading 2", icon: "##", desc: "Medium heading", group: "Basic", command: (e: any) => e?.chain().focus().toggleHeading({ level: 2 }).run() },
  { label: "Heading 3", icon: "###", desc: "Small heading", group: "Basic", command: (e: any) => e?.chain().focus().toggleHeading({ level: 3 }).run() },
  { label: "Bullet list", icon: "•", desc: "Unordered list", group: "Lists", command: (e: any) => e?.chain().focus().toggleBulletList().run() },
  { label: "Numbered", icon: "1.", desc: "Ordered list", group: "Lists", command: (e: any) => e?.chain().focus().toggleOrderedList().run() },
  { label: "To-do", icon: "☐", desc: "Task list", group: "Lists", command: (e: any) => e?.chain().focus().toggleTaskList().run() },
  { label: "Code block", icon: "`", desc: "Fenced code", group: "Media", command: (e: any) => e?.chain().focus().toggleCodeBlock().run() },
  { label: "Quote", icon: "\"", desc: "Blockquote", group: "Media", command: (e: any) => e?.chain().focus().toggleBlockquote().run() },
  { label: "Divider", icon: "─", desc: "Horizontal rule", group: "Media", command: (e: any) => e?.chain().focus().setHorizontalRule().run() },
];

interface Props { noteId: string; onBack?: () => void; }

export default function NoteEditor({ noteId, onBack }: Props) {
  const { getById, updateNote } = useNotes();
  const note = getById(noteId);
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("");
  const [cover, setCover] = useState<string | null>(null);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashFilter, setSlashFilter] = useState("");
  const [slashIdx, setSlashIdx] = useState(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialized = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Placeholder.configure({ placeholder: "Start writing, or type '/' for commands..." }),
      TaskList, TaskItem.configure({ nested: true }), Highlight,
    ],
    editorProps: {
      attributes: { class: "outline-none min-h-[400px]" },
      handleKeyDown: (_view, event) => {
        if (slashOpen) {
          const filtered = SLASH_COMMANDS.filter(c => c.label.toLowerCase().includes(slashFilter.toLowerCase()));
          if (event.key === "ArrowDown") { event.preventDefault(); setSlashIdx(i => Math.min(i + 1, filtered.length - 1)); return true; }
          if (event.key === "ArrowUp") { event.preventDefault(); setSlashIdx(i => Math.max(i - 1, 0)); return true; }
          if (event.key === "Enter") {
            event.preventDefault();
            if (filtered[slashIdx]) {
              editor?.commands.deleteRange({ from: editor.state.selection.from - slashFilter.length - 1, to: editor.state.selection.from });
              filtered[slashIdx].command(editor);
            }
            setSlashOpen(false); setSlashFilter(""); return true;
          }
          if (event.key === "Escape" || event.key === " ") { setSlashOpen(false); setSlashFilter(""); return event.key === "Escape"; }
        }
        return false;
      },
    },
    onUpdate: ({ editor: e }) => {
      const text = e.getText();
      setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
      const { from } = e.state.selection;
      const textBefore = e.state.doc.textBetween(Math.max(0, from - 20), from, " ");
      const match = textBefore.match(/\/(\w*)$/);
      if (match) { setSlashOpen(true); setSlashFilter(match[1]); setSlashIdx(0); }
      else if (slashOpen) { setSlashOpen(false); setSlashFilter(""); }
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => { updateNote(noteId, { content: e.getHTML() }); setLastSaved(new Date()); }, 500);
    },
  });

  useEffect(() => {
    if (note && editor && !initialized.current) {
      setTitle(note.title); setEmoji(note.coverEmoji || ""); setCover(note.color || null);
      if (note.content) editor.commands.setContent(note.content);
      initialized.current = true;
    }
  }, [note, editor]);

  useEffect(() => {
    initialized.current = false;
    if (note && editor) {
      setTitle(note.title); setEmoji(note.coverEmoji || ""); setCover(note.color || null);
      editor.commands.setContent(note.content || "");
      initialized.current = true;
    }
  }, [noteId]);

  const saveTitle = useCallback(() => {
    if (note) { updateNote(noteId, { title: title.trim() || "Untitled" }); setLastSaved(new Date()); }
  }, [noteId, title, note, updateNote]);

  const saveCover = (gradient: string | null) => {
    setCover(gradient); setShowCoverPicker(false);
    updateNote(noteId, { color: gradient });
  };

  const saveEmoji = (e: string) => { setEmoji(e); updateNote(noteId, { coverEmoji: e || null }); };

  if (!note) return <div className="flex-1 flex items-center justify-center"><p className="text-gray-400 text-sm">Select a note</p></div>;

  const relTime = lastSaved ? (Date.now() - lastSaved.getTime() < 5000 ? "just now" : Date.now() - lastSaved.getTime() < 60000 ? `${Math.floor((Date.now() - lastSaved.getTime()) / 1000)}s ago` : `${Math.floor((Date.now() - lastSaved.getTime()) / 60000)}m ago`) : "—";
  const filteredSlash = SLASH_COMMANDS.filter(c => c.label.toLowerCase().includes(slashFilter.toLowerCase()));
  const slashGroups = [...new Set(filteredSlash.map(c => c.group))];

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#F7F8FC] h-full overflow-y-auto">
      {/* Fixed minimal toolbar */}
      <div className="sticky top-0 z-10 bg-[#F7F8FC] h-10 flex items-center gap-2 px-4 shrink-0">
        {onBack && <button onClick={onBack} className="p-1 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-200"><ArrowLeft className="h-4 w-4" /></button>}
        <span className="text-sm font-medium text-gray-600 truncate max-w-[200px]">{title || "Untitled"}</span>
        <div className="flex-1" />
        <button onClick={() => setShowCoverPicker(!showCoverPicker)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded px-2 py-1"><ImageIcon className="h-3 w-3" /> Cover</button>
        <span className="text-xs text-gray-400">{wordCount} words</span>
      </div>

      {/* Cover area */}
      {cover && (
        <div className="relative h-[180px] shrink-0 group" style={{ background: cover }}>
          <button onClick={() => setShowCoverPicker(!showCoverPicker)}
            className="absolute bottom-2 right-3 text-xs text-white/70 bg-black/20 rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
            Change cover
          </button>
        </div>
      )}
      {!cover && (
        <div className="relative h-8 shrink-0 group">
          <button onClick={() => saveCover(COVER_GRADIENTS[0])}
            className="absolute bottom-1 right-3 text-xs text-gray-400 bg-gray-100 rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
            + Add cover
          </button>
        </div>
      )}

      {/* Cover picker popover */}
      {showCoverPicker && (
        <div className="flex gap-1.5 px-8 py-2 bg-[#F7F8FC] shrink-0">
          {COVER_GRADIENTS.map((g, i) => (
            <button key={i} onClick={() => saveCover(g)} className={cn("h-8 w-10 rounded-lg transition-all hover:scale-110", cover === g && "ring-2 ring-blue-500 ring-offset-2")} style={{ background: g }} />
          ))}
          <button onClick={() => saveCover(null)} className="h-8 px-2 rounded-lg text-[10px] text-gray-500 bg-gray-100 hover:bg-gray-200">None</button>
        </div>
      )}

      {/* White content card */}
      <div className="max-w-[900px] w-full mx-auto bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] px-16 py-12 my-4 min-h-[calc(100vh-280px)] relative">
        {/* Emoji */}
        <div className="mb-4">
          <input value={emoji} onChange={e => saveEmoji(e.target.value)} placeholder="+"
            className={cn("text-5xl bg-transparent outline-none cursor-pointer w-16 text-center", !emoji && "text-gray-200 border-2 border-dashed border-gray-200 rounded-xl h-14")}
            title="Add emoji" />
        </div>

        {/* Title */}
        <input value={title} onChange={e => setTitle(e.target.value)} onBlur={saveTitle}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); editor?.commands.focus(); } }}
          placeholder="Untitled" autoFocus
          className="w-full text-4xl font-bold text-gray-900 bg-transparent outline-none placeholder:text-gray-300 mb-1" />

        {/* Metadata */}
        <p className="text-xs text-gray-400 mb-6">Created {format(new Date(note.createdAt), "MMM d, yyyy")} · {wordCount} words</p>
        <hr className="border-gray-100 mb-6" />

        {/* TipTap editor */}
        <EditorContent editor={editor} />

        {/* Slash command menu */}
        {slashOpen && filteredSlash.length > 0 && (
          <div className="absolute z-50 bg-white rounded-xl shadow-2xl border border-gray-100 w-[260px] max-h-[320px] overflow-y-auto p-2">
            {slashGroups.map(group => {
              let groupIdx = 0;
              return (
                <div key={group}>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 px-2 py-1 mt-1 first:mt-0">{group}</p>
                  {filteredSlash.filter(c => c.group === group).map(cmd => {
                    const thisIdx = filteredSlash.indexOf(cmd);
                    return (
                      <button key={cmd.label} onMouseEnter={() => setSlashIdx(thisIdx)}
                        onClick={() => {
                          editor?.commands.deleteRange({ from: editor.state.selection.from - slashFilter.length - 1, to: editor.state.selection.from });
                          cmd.command(editor); setSlashOpen(false); setSlashFilter("");
                        }}
                        className={cn("w-full flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer transition-colors",
                          slashIdx === thisIdx ? "bg-blue-50 border border-blue-100" : "hover:bg-gray-50")}>
                        <div className="h-8 w-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-base shrink-0">{cmd.icon}</div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{cmd.label}</p>
                          <p className="text-xs text-gray-400">{cmd.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="sticky bottom-0 h-8 flex items-center justify-between px-8 bg-white border-t border-[#F1F5F9] text-[10px] text-gray-400 shrink-0">
        <span>{wordCount} words</span>
        <span>Last saved {relTime}</span>
      </div>
    </div>
  );
}
