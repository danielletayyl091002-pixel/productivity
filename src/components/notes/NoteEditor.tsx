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
import { Bold, Italic, Highlighter, Heading1, Heading2, Code, List, ListOrdered, CheckSquare, Quote, Minus } from "lucide-react";

interface Props {
  noteId: string;
}

// Slash command suggestions
const SLASH_COMMANDS = [
  { label: "Text", icon: "📝", desc: "Plain paragraph", command: (editor: ReturnType<typeof useEditor>) => editor?.chain().focus().setParagraph().run() },
  { label: "Heading 1", icon: "#", desc: "Large heading", command: (editor: ReturnType<typeof useEditor>) => editor?.chain().focus().toggleHeading({ level: 1 }).run() },
  { label: "Heading 2", icon: "##", desc: "Medium heading", command: (editor: ReturnType<typeof useEditor>) => editor?.chain().focus().toggleHeading({ level: 2 }).run() },
  { label: "Heading 3", icon: "###", desc: "Small heading", command: (editor: ReturnType<typeof useEditor>) => editor?.chain().focus().toggleHeading({ level: 3 }).run() },
  { label: "Bullet list", icon: "•", desc: "Unordered list", command: (editor: ReturnType<typeof useEditor>) => editor?.chain().focus().toggleBulletList().run() },
  { label: "Numbered", icon: "1.", desc: "Ordered list", command: (editor: ReturnType<typeof useEditor>) => editor?.chain().focus().toggleOrderedList().run() },
  { label: "To-do", icon: "☐", desc: "Task list", command: (editor: ReturnType<typeof useEditor>) => editor?.chain().focus().toggleTaskList().run() },
  { label: "Quote", icon: "\"", desc: "Blockquote", command: (editor: ReturnType<typeof useEditor>) => editor?.chain().focus().toggleBlockquote().run() },
  { label: "Divider", icon: "─", desc: "Horizontal rule", command: (editor: ReturnType<typeof useEditor>) => editor?.chain().focus().setHorizontalRule().run() },
  { label: "Code", icon: "`", desc: "Code block", command: (editor: ReturnType<typeof useEditor>) => editor?.chain().focus().toggleCodeBlock().run() },
];

export default function NoteEditor({ noteId }: Props) {
  const { getById, updateNote } = useNotes();
  const note = getById(noteId);
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashFilter, setSlashFilter] = useState("");
  const [slashIdx, setSlashIdx] = useState(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialized = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: { HTMLAttributes: { class: "bg-[var(--bg-secondary)] rounded-lg p-3 text-sm font-mono my-2" } } }),
      Placeholder.configure({ placeholder: "Start writing, or type '/' for commands..." }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: false }),
    ],
    editorProps: {
      attributes: { class: "outline-none min-h-[400px] prose prose-sm max-w-none" },
      handleKeyDown: (_view, event) => {
        if (event.key === "/" && !slashOpen) {
          // Will be detected in onUpdate
        }
        if (slashOpen) {
          const filtered = SLASH_COMMANDS.filter(c => c.label.toLowerCase().includes(slashFilter.toLowerCase()));
          if (event.key === "ArrowDown") { event.preventDefault(); setSlashIdx(i => Math.min(i + 1, filtered.length - 1)); return true; }
          if (event.key === "ArrowUp") { event.preventDefault(); setSlashIdx(i => Math.max(i - 1, 0)); return true; }
          if (event.key === "Enter") {
            event.preventDefault();
            if (filtered[slashIdx]) {
              // Delete the slash text
              editor?.commands.deleteRange({ from: editor.state.selection.from - slashFilter.length - 1, to: editor.state.selection.from });
              filtered[slashIdx].command(editor);
            }
            setSlashOpen(false);
            setSlashFilter("");
            return true;
          }
          if (event.key === "Escape") { setSlashOpen(false); setSlashFilter(""); return true; }
          if (event.key === " ") { setSlashOpen(false); setSlashFilter(""); return false; }
        }
        return false;
      },
    },
    onUpdate: ({ editor: e }) => {
      // Word count
      const text = e.getText();
      setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);

      // Slash command detection
      const { from } = e.state.selection;
      const textBefore = e.state.doc.textBetween(Math.max(0, from - 20), from, " ");
      const slashMatch = textBefore.match(/\/(\w*)$/);
      if (slashMatch) {
        setSlashOpen(true);
        setSlashFilter(slashMatch[1]);
        setSlashIdx(0);
      } else if (slashOpen) {
        setSlashOpen(false);
        setSlashFilter("");
      }

      // Debounced save
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        updateNote(noteId, { content: e.getHTML() });
        setLastSaved(new Date());
      }, 500);
    },
  });

  // Init editor content
  useEffect(() => {
    if (note && editor && !initialized.current) {
      setTitle(note.title);
      setEmoji(note.coverEmoji || "");
      if (note.content) editor.commands.setContent(note.content);
      initialized.current = true;
    }
  }, [note, editor]);

  // Reset on note change
  useEffect(() => {
    initialized.current = false;
    if (note && editor) {
      setTitle(note.title);
      setEmoji(note.coverEmoji || "");
      editor.commands.setContent(note.content || "");
      initialized.current = true;
    }
  }, [noteId]);

  const saveTitle = useCallback(() => {
    if (note) {
      updateNote(noteId, { title: title.trim() || "Untitled" });
      setLastSaved(new Date());
    }
  }, [noteId, title, note, updateNote]);

  const saveEmoji = (e: string) => {
    setEmoji(e);
    updateNote(noteId, { coverEmoji: e || null });
  };

  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[var(--text-muted)] text-sm">Select a note</p>
      </div>
    );
  }

  const relativeTime = lastSaved ? (
    Date.now() - lastSaved.getTime() < 5000 ? "just now" :
    Date.now() - lastSaved.getTime() < 60000 ? `${Math.floor((Date.now() - lastSaved.getTime()) / 1000)}s ago` :
    `${Math.floor((Date.now() - lastSaved.getTime()) / 60000)}m ago`
  ) : "—";

  const filteredSlash = SLASH_COMMANDS.filter(c => c.label.toLowerCase().includes(slashFilter.toLowerCase()));

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full">
      {/* Top area — not scrollable */}
      <div className="px-8 pt-6 shrink-0">
        {/* Cover emoji */}
        <div className="flex justify-start mb-2">
          <input value={emoji} onChange={e => saveEmoji(e.target.value)} placeholder="+"
            className="text-5xl w-16 text-center bg-transparent outline-none cursor-pointer" title="Add cover emoji" />
        </div>

        {/* Title */}
        <input value={title} onChange={e => setTitle(e.target.value)} onBlur={saveTitle}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); editor?.commands.focus(); } }}
          placeholder="Untitled" autoFocus
          className="w-full text-3xl font-bold text-[var(--text-primary)] bg-transparent outline-none placeholder:text-gray-300" />

        {/* Metadata */}
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
          <span>Created {format(new Date(note.createdAt), "MMM d, yyyy")}</span>
          <span>·</span>
          <span>{wordCount} words</span>
          {note.tags.length > 0 && (
            <>
              <span>·</span>
              {note.tags.map(t => <span key={t} className="px-1.5 py-0.5 bg-[var(--bg-secondary)] rounded text-[10px]">{t}</span>)}
            </>
          )}
        </div>

        <hr className="mt-4 border-[var(--border)]" />
      </div>

      {/* Toolbar */}
      {editor && (
        <div className="flex items-center gap-0.5 px-8 py-1.5 border-b border-[var(--border)] shrink-0 flex-wrap">
          {[
            { icon: <Bold className="h-3.5 w-3.5" />, action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold"), title: "Bold" },
            { icon: <Italic className="h-3.5 w-3.5" />, action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic"), title: "Italic" },
            { icon: <Highlighter className="h-3.5 w-3.5" />, action: () => editor.chain().focus().toggleHighlight().run(), active: editor.isActive("highlight"), title: "Highlight" },
            null,
            { icon: <Heading1 className="h-3.5 w-3.5" />, action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: editor.isActive("heading", { level: 1 }), title: "H1" },
            { icon: <Heading2 className="h-3.5 w-3.5" />, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive("heading", { level: 2 }), title: "H2" },
            null,
            { icon: <List className="h-3.5 w-3.5" />, action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive("bulletList"), title: "Bullet list" },
            { icon: <ListOrdered className="h-3.5 w-3.5" />, action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive("orderedList"), title: "Numbered list" },
            { icon: <CheckSquare className="h-3.5 w-3.5" />, action: () => editor.chain().focus().toggleTaskList().run(), active: editor.isActive("taskList"), title: "To-do" },
            null,
            { icon: <Quote className="h-3.5 w-3.5" />, action: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive("blockquote"), title: "Quote" },
            { icon: <Code className="h-3.5 w-3.5" />, action: () => editor.chain().focus().toggleCodeBlock().run(), active: editor.isActive("codeBlock"), title: "Code block" },
            { icon: <Minus className="h-3.5 w-3.5" />, action: () => editor.chain().focus().setHorizontalRule().run(), active: false, title: "Divider" },
          ].map((btn, i) => btn === null ? (
            <div key={i} className="w-px h-4 bg-[var(--border)] mx-0.5" />
          ) : (
            <button key={i} onClick={btn.action} title={btn.title}
              className={cn("h-7 w-7 flex items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors",
                btn.active && "bg-[var(--color-primary-light)] text-[var(--color-primary)]")}>
              {btn.icon}
            </button>
          ))}
        </div>
      )}

      {/* Editor area — scrollable */}
      <div className="flex-1 overflow-y-auto px-8 py-4 relative">
        <EditorContent editor={editor} />

        {/* Slash command menu */}
        {slashOpen && filteredSlash.length > 0 && (
          <div className="absolute z-50 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg shadow-[var(--shadow-lg)] py-1 w-56">
            {filteredSlash.map((cmd, i) => (
              <button key={cmd.label}
                onMouseEnter={() => setSlashIdx(i)}
                onClick={() => {
                  editor?.commands.deleteRange({ from: editor.state.selection.from - slashFilter.length - 1, to: editor.state.selection.from });
                  cmd.command(editor);
                  setSlashOpen(false);
                  setSlashFilter("");
                }}
                className={cn("w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                  slashIdx === i ? "bg-[var(--color-primary-light)]" : "hover:bg-[var(--bg-hover)]")}>
                <span className="w-6 text-center text-sm font-mono text-[var(--text-muted)]">{cmd.icon}</span>
                <div>
                  <p className="text-[12px] font-medium text-[var(--text-primary)]">{cmd.label}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{cmd.desc}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom status bar */}
      <div className="h-8 flex items-center justify-between px-8 bg-white border-t border-[#F1F5F9] text-[10px] text-gray-400 shrink-0">
        <span>{wordCount} words</span>
        <span>Last saved {relativeTime}</span>
      </div>
    </div>
  );
}
