"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useNotes } from "@/stores/notes";
import { useKanban } from "@/stores/kanban";
import { useSettings } from "@/stores/settings";
import { cn } from "@/lib/utils";
import { Bold, Italic, Strikethrough, Heading1, Heading2, Heading3, List, ListOrdered, CheckSquare, Code, Quote, Save, BookmarkPlus } from "lucide-react";
import SlashMenu from "./SlashMenu";
import { format } from "date-fns";

interface Props {
  noteId: string;
}

export default function NoteEditor({ noteId }: Props) {
  const { getById, updateNote } = useNotes();
  const { get: getSetting, set: setSetting } = useSettings();
  const note = getById(noteId);

  const [title, setTitle] = useState("");
  const [saved, setSaved] = useState(true);
  const editorRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Slash menu state
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashFilter, setSlashFilter] = useState("");
  const [slashPos, setSlashPos] = useState({ top: 0, left: 0 });
  const slashStart = useRef<number | null>(null);

  // Init
  useEffect(() => {
    if (note && !initialized.current) {
      setTitle(note.title);
      if (editorRef.current) editorRef.current.innerHTML = note.content;
      initialized.current = true;
    }
  }, [note]);

  // Reset when note changes
  useEffect(() => {
    initialized.current = false;
    if (note) {
      setTitle(note.title);
      if (editorRef.current) editorRef.current.innerHTML = note.content;
      initialized.current = true;
    }
  }, [noteId]);

  // Auto-save
  const save = useCallback(() => {
    if (!note || !editorRef.current) return;
    updateNote(noteId, { title: title.trim() || "Untitled", content: editorRef.current.innerHTML });
    setSaved(true);
  }, [noteId, title, note, updateNote]);

  const scheduleSave = useCallback(() => {
    setSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(save, 3000);
  }, [save]);

  // Save as template
  const saveAsTemplate = async () => {
    if (!editorRef.current) return;
    const raw = getSetting("noteTemplates", "[]");
    const templates = JSON.parse(raw);
    templates.push({ name: title || "Untitled Template", content: editorRef.current.innerHTML });
    await setSetting("noteTemplates", JSON.stringify(templates));
    alert("Saved as template!");
  };

  // Exec command
  const exec = useCallback((cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    scheduleSave();
  }, [scheduleSave]);

  const insertHTML = useCallback((html: string) => {
    document.execCommand("insertHTML", false, html);
    editorRef.current?.focus();
    scheduleSave();
  }, [scheduleSave]);

  // Slash commands
  const handleInput = useCallback(() => {
    scheduleSave();
    if (!editorRef.current) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) return;
    const text = node.textContent || "";
    const pos = range.startOffset;

    // Track slash filter
    if (slashOpen && slashStart.current !== null) {
      setSlashFilter(text.slice(slashStart.current + 1, pos));
      return;
    }

    // Detect /
    if (pos > 0 && text[pos - 1] === "/") {
      const rect = range.getBoundingClientRect();
      setSlashPos({ top: rect.bottom + 4, left: rect.left });
      setSlashFilter("");
      setSlashOpen(true);
      slashStart.current = pos - 1;
      return;
    }

    // Markdown shortcuts
    if (text.endsWith(" ")) {
      const t = text.slice(0, -1);
      if (t === "#") { node.textContent = ""; exec("formatBlock", "h1"); return; }
      if (t === "##") { node.textContent = ""; exec("formatBlock", "h2"); return; }
      if (t === "###") { node.textContent = ""; exec("formatBlock", "h3"); return; }
      if (t === "-" || t === "*") { node.textContent = ""; exec("insertUnorderedList"); return; }
      if (t === "1.") { node.textContent = ""; exec("insertOrderedList"); return; }
      if (t === ">") { node.textContent = ""; exec("formatBlock", "blockquote"); return; }
      if (t === "[]") { node.textContent = ""; insertHTML('<div class="todo-item"><input type="checkbox" style="margin-right:8px" /><span>To-do</span></div>'); return; }
    }
  }, [slashOpen, exec, insertHTML, scheduleSave]);

  const handleSlashSelect = useCallback((action: () => void) => {
    // Remove slash text
    if (editorRef.current && slashStart.current !== null) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const node = range.startContainer;
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent || "";
          node.textContent = text.slice(0, slashStart.current) + text.slice(range.startOffset);
          const nr = document.createRange();
          nr.setStart(node, slashStart.current);
          nr.collapse(true);
          sel.removeAllRanges();
          sel.addRange(nr);
        }
      }
    }
    action();
    setSlashOpen(false);
    slashStart.current = null;
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key === "b") { e.preventDefault(); exec("bold"); }
    else if (mod && e.key === "i") { e.preventDefault(); exec("italic"); }
    else if (mod && e.key === "u") { e.preventDefault(); exec("underline"); }
    else if (mod && e.key === "s") { e.preventDefault(); save(); }
    if (slashOpen && (e.key === " " || e.key === "Escape")) { setSlashOpen(false); slashStart.current = null; }
  }, [exec, save, slashOpen]);

  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[var(--text-muted)] text-sm">Select a note or create a new one</p>
      </div>
    );
  }

  const TOOLBAR = [
    { icon: <Bold className="h-3.5 w-3.5" />, cmd: "bold", title: "Bold (⌘B)" },
    { icon: <Italic className="h-3.5 w-3.5" />, cmd: "italic", title: "Italic (⌘I)" },
    { icon: <Strikethrough className="h-3.5 w-3.5" />, cmd: "strikeThrough", title: "Strikethrough" },
    null,
    { icon: <Heading1 className="h-3.5 w-3.5" />, cmd: "formatBlock", val: "h1", title: "Heading 1" },
    { icon: <Heading2 className="h-3.5 w-3.5" />, cmd: "formatBlock", val: "h2", title: "Heading 2" },
    { icon: <Heading3 className="h-3.5 w-3.5" />, cmd: "formatBlock", val: "h3", title: "Heading 3" },
    null,
    { icon: <List className="h-3.5 w-3.5" />, cmd: "insertUnorderedList", title: "Bullet list" },
    { icon: <ListOrdered className="h-3.5 w-3.5" />, cmd: "insertOrderedList", title: "Numbered list" },
    { icon: <CheckSquare className="h-3.5 w-3.5" />, cmd: "insertHTML", val: '<div class="todo-item"><input type="checkbox" style="margin-right:8px" /><span>To-do</span></div>', title: "Checkbox" },
    null,
    { icon: <Code className="h-3.5 w-3.5" />, cmd: "formatBlock", val: "pre", title: "Code block" },
    { icon: <Quote className="h-3.5 w-3.5" />, cmd: "formatBlock", val: "blockquote", title: "Quote" },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-card)] flex-wrap">
        {TOOLBAR.map((item, i) => item === null ? (
          <div key={i} className="w-px h-4 bg-[var(--border)] mx-1" />
        ) : (
          <button key={i} onClick={() => item.cmd === "insertHTML" ? insertHTML(item.val!) : exec(item.cmd, item.val)} title={item.title}
            className="h-7 w-7 flex items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors">
            {item.icon}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-[10px] text-[var(--text-muted)]">{saved ? "Saved" : "Saving..."}</span>
          <button onClick={saveAsTemplate} title="Save as template"
            className="h-7 w-7 flex items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]">
            <BookmarkPlus className="h-3.5 w-3.5" />
          </button>
          <button onClick={save} title="Save now (⌘S)"
            className="h-7 w-7 flex items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]">
            <Save className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="px-6 pt-5">
        <input value={title} onChange={e => { setTitle(e.target.value); scheduleSave(); }}
          onBlur={save} placeholder="Untitled"
          className="w-full text-2xl font-bold text-[var(--text-primary)] bg-transparent outline-none placeholder:text-[var(--text-muted)]" />
        <p className="text-[10px] text-[var(--text-muted)] mt-1">
          Last edited {format(new Date(note.updatedAt), "MMM d, yyyy 'at' h:mm a")}
        </p>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div ref={editorRef} contentEditable suppressContentEditableWarning
          onInput={handleInput} onKeyDown={handleKeyDown} onBlur={save}
          className={cn(
            "min-h-[300px] outline-none text-[var(--text-primary)] leading-relaxed text-[14px]",
            "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-2",
            "[&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-2",
            "[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-1",
            "[&_p]:mb-2",
            "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-2",
            "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-2",
            "[&_li]:mb-0.5",
            "[&_blockquote]:border-l-[3px] [&_blockquote]:border-[var(--color-primary)] [&_blockquote]:pl-4 [&_blockquote]:py-1 [&_blockquote]:text-[var(--text-secondary)] [&_blockquote]:italic [&_blockquote]:my-2",
            "[&_pre]:bg-[var(--bg-secondary)] [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:text-sm [&_pre]:font-mono [&_pre]:my-2 [&_pre]:overflow-x-auto",
            "[&_code]:bg-[var(--bg-secondary)] [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[13px] [&_code]:font-mono",
            "[&_hr]:border-[var(--border)] [&_hr]:my-4",
            "[&_.todo-item]:flex [&_.todo-item]:items-center [&_.todo-item]:gap-2 [&_.todo-item]:my-1",
            "[&:empty]:before:content-['Type_/_for_commands...'] [&:empty]:before:text-[var(--text-muted)]",
          )}
        />
      </div>

      {/* Slash menu */}
      <SlashMenu isOpen={slashOpen} filter={slashFilter} position={slashPos}
        onSelect={handleSlashSelect} onClose={() => { setSlashOpen(false); slashStart.current = null; }}
        exec={exec} insertHTML={insertHTML} />
    </div>
  );
}
