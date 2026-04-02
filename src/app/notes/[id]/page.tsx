"use client";

import { useEffect, useState, useRef, useCallback, use } from "react";
import { useItems } from "@/stores/items";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bold, Italic, Underline, Strikethrough, Code, List, ListOrdered, Quote, Heading1, Heading2, Heading3 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import SlashMenu, { DEFAULT_SLASH_COMMANDS, type SlashCommand } from "@/components/notes/SlashMenu";

export default function NoteEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { items, updateItem, quickAddTask } = useItems();
  const router = useRouter();
  const note = items.find(i => i.id === id);

  const [title, setTitle] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  // Slash menu state
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashFilter, setSlashFilter] = useState("");
  const [slashPos, setSlashPos] = useState({ top: 0, left: 0 });
  const slashStartRef = useRef<number | null>(null);

  // Init
  useEffect(() => {
    if (note && !initialized.current) {
      setTitle(note.title);
      if (editorRef.current && note.content) {
        editorRef.current.innerHTML = note.content;
      }
      initialized.current = true;
    }
  }, [note]);

  // Auto-save
  const save = useCallback(() => {
    if (!note || !editorRef.current) return;
    updateItem(id, {
      title: title.trim() || "Untitled Note",
      content: editorRef.current.innerHTML,
    });
  }, [id, title, note, updateItem]);

  useEffect(() => {
    const timer = setInterval(save, 3000);
    return () => clearInterval(timer);
  }, [save]);

  // Exec command helper
  const execCmd = useCallback((cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
  }, []);

  // Slash commands
  const slashCommands = DEFAULT_SLASH_COMMANDS(execCmd, async () => {
    await quickAddTask("New task from note");
    setSlashOpen(false);
  });

  const handleSlashSelect = useCallback((cmd: SlashCommand) => {
    // Remove the slash text from the editor
    if (editorRef.current && slashStartRef.current !== null) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        // Delete the slash command text
        const node = range.startContainer;
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent || "";
          const before = text.slice(0, slashStartRef.current);
          const after = text.slice(range.startOffset);
          node.textContent = before + after;
          // Place cursor
          const newRange = document.createRange();
          newRange.setStart(node, before.length);
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);
        }
      }
    }
    cmd.action();
    setSlashOpen(false);
    slashStartRef.current = null;
  }, []);

  // Handle editor input for slash commands and markdown
  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const node = range.startContainer;

    if (node.nodeType !== Node.TEXT_NODE) return;
    const text = node.textContent || "";
    const cursorPos = range.startOffset;

    // Slash command detection
    if (slashOpen && slashStartRef.current !== null) {
      const slashText = text.slice(slashStartRef.current + 1, cursorPos);
      setSlashFilter(slashText);
      return;
    }

    // Check if user just typed /
    if (cursorPos > 0 && text[cursorPos - 1] === "/") {
      const rect = range.getBoundingClientRect();
      setSlashPos({ top: rect.bottom + 4, left: rect.left });
      setSlashFilter("");
      setSlashOpen(true);
      slashStartRef.current = cursorPos - 1;
      return;
    }

    // Markdown shortcuts (on space after pattern)
    if (text.endsWith(" ")) {
      const trimmed = text.slice(0, -1);

      // Headings
      if (trimmed === "#") { node.textContent = ""; execCmd("formatBlock", "h1"); return; }
      if (trimmed === "##") { node.textContent = ""; execCmd("formatBlock", "h2"); return; }
      if (trimmed === "###") { node.textContent = ""; execCmd("formatBlock", "h3"); return; }

      // Lists
      if (trimmed === "-" || trimmed === "*" || trimmed === "+") {
        node.textContent = ""; execCmd("insertUnorderedList"); return;
      }
      if (trimmed === "1.") {
        node.textContent = ""; execCmd("insertOrderedList"); return;
      }

      // Blockquote
      if (trimmed === ">") {
        node.textContent = ""; execCmd("formatBlock", "blockquote"); return;
      }

      // Checkbox
      if (trimmed === "[]") {
        node.textContent = "";
        document.execCommand("insertHTML", false, '<div><input type="checkbox" style="margin-right:8px" /><span>To-do</span></div>');
        return;
      }
    }

    // Inline markdown: **bold**, *italic*, `code`, ~strike~
    const inlinePatterns = [
      { regex: /\*\*(.+?)\*\*/, tag: "b" },
      { regex: /\*(.+?)\*/, tag: "i" },
      { regex: /`(.+?)`/, tag: "code" },
      { regex: /~(.+?)~/, tag: "s" },
    ];

    for (const { regex, tag } of inlinePatterns) {
      const match = text.match(regex);
      if (match && match.index !== undefined) {
        const before = text.slice(0, match.index);
        const inner = match[1];
        const after = text.slice(match.index + match[0].length);
        node.textContent = before;
        const el = document.createElement(tag);
        el.textContent = inner;
        const afterNode = document.createTextNode(after);
        node.parentNode?.insertBefore(el, node.nextSibling);
        node.parentNode?.insertBefore(afterNode, el.nextSibling);
        // Place cursor after
        const newRange = document.createRange();
        newRange.setStartAfter(afterNode);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);
        return;
      }
    }
  }, [slashOpen, execCmd]);

  // Keyboard shortcuts in editor
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const mod = e.metaKey || e.ctrlKey;

    if (mod && e.key === "b") { e.preventDefault(); execCmd("bold"); }
    else if (mod && e.key === "i") { e.preventDefault(); execCmd("italic"); }
    else if (mod && e.key === "u") { e.preventDefault(); execCmd("underline"); }
    else if (mod && e.shiftKey && e.key === "S") { e.preventDefault(); execCmd("strikeThrough"); }
    else if (mod && e.key === "e") { e.preventDefault(); execCmd("formatBlock", "pre"); }

    // Close slash menu on space/escape
    if (slashOpen && (e.key === " " || e.key === "Escape")) {
      setSlashOpen(false);
      slashStartRef.current = null;
    }
  }, [execCmd, slashOpen]);

  if (!note) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <p className="text-3xl mb-2">🔍</p>
        <p className="text-sm text-[var(--text-tertiary)]">Note not found</p>
        <Link href="/notes" className="text-xs text-[var(--color-primary)] hover:underline mt-2 inline-block">Back to notes</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-20">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/notes" className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Notes
        </Link>
        <button onClick={save}
          className="text-[10px] px-2.5 py-1 rounded-full bg-[var(--bg-secondary)] text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] transition-colors">
          Save
        </button>
      </div>

      {/* Formatting toolbar */}
      <div className="flex items-center gap-0.5 mb-4 pb-3 border-b border-[var(--border)] flex-wrap">
        {[
          { icon: <Bold className="h-3.5 w-3.5" />, cmd: "bold", title: "Bold (Cmd+B)" },
          { icon: <Italic className="h-3.5 w-3.5" />, cmd: "italic", title: "Italic (Cmd+I)" },
          { icon: <Underline className="h-3.5 w-3.5" />, cmd: "underline", title: "Underline (Cmd+U)" },
          { icon: <Strikethrough className="h-3.5 w-3.5" />, cmd: "strikeThrough", title: "Strikethrough" },
          { icon: <Code className="h-3.5 w-3.5" />, cmd: "formatBlock", val: "pre", title: "Code" },
        ].map(({ icon, cmd, val, title }) => (
          <button key={cmd + (val || "")} onClick={() => execCmd(cmd, val)} title={title}
            className="h-7 w-7 flex items-center justify-center rounded-[var(--radius-xs)] text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-all">
            {icon}
          </button>
        ))}
        <div className="w-px h-4 bg-[var(--border)] mx-1" />
        {[
          { icon: <Heading1 className="h-3.5 w-3.5" />, cmd: "formatBlock", val: "h1", title: "Heading 1" },
          { icon: <Heading2 className="h-3.5 w-3.5" />, cmd: "formatBlock", val: "h2", title: "Heading 2" },
          { icon: <Heading3 className="h-3.5 w-3.5" />, cmd: "formatBlock", val: "h3", title: "Heading 3" },
        ].map(({ icon, cmd, val, title }) => (
          <button key={val} onClick={() => execCmd(cmd, val)} title={title}
            className="h-7 w-7 flex items-center justify-center rounded-[var(--radius-xs)] text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-all">
            {icon}
          </button>
        ))}
        <div className="w-px h-4 bg-[var(--border)] mx-1" />
        {[
          { icon: <List className="h-3.5 w-3.5" />, cmd: "insertUnorderedList", title: "Bullet list" },
          { icon: <ListOrdered className="h-3.5 w-3.5" />, cmd: "insertOrderedList", title: "Numbered list" },
          { icon: <Quote className="h-3.5 w-3.5" />, cmd: "formatBlock", val: "blockquote", title: "Quote" },
        ].map(({ icon, cmd, val, title }) => (
          <button key={cmd + (val || "")} onClick={() => execCmd(cmd, val)} title={title}
            className="h-7 w-7 flex items-center justify-center rounded-[var(--radius-xs)] text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-all">
            {icon}
          </button>
        ))}
      </div>

      {/* Title */}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={save}
        className="w-full text-2xl font-bold text-[var(--text-primary)] bg-transparent outline-none placeholder:text-[var(--text-tertiary)] mb-4"
        placeholder="Untitled"
      />

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onBlur={save}
        className={cn(
          "min-h-[400px] outline-none text-[var(--text-primary)] leading-relaxed",
          // Prose styling for rich content
          "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-2 [&_h1]:text-[var(--text-primary)]",
          "[&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:text-[var(--text-primary)]",
          "[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-1 [&_h3]:text-[var(--text-primary)]",
          "[&_p]:mb-2",
          "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-2",
          "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-2",
          "[&_li]:mb-0.5",
          "[&_blockquote]:border-l-3 [&_blockquote]:border-[var(--color-primary)] [&_blockquote]:pl-4 [&_blockquote]:py-1 [&_blockquote]:text-[var(--text-secondary)] [&_blockquote]:italic [&_blockquote]:my-2",
          "[&_pre]:bg-[var(--bg-tertiary)] [&_pre]:rounded-[var(--radius-xs)] [&_pre]:p-3 [&_pre]:text-sm [&_pre]:font-mono [&_pre]:my-2 [&_pre]:overflow-x-auto",
          "[&_code]:bg-[var(--bg-tertiary)] [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[13px] [&_code]:font-mono [&_code]:text-[var(--color-primary)]",
          "[&_hr]:border-[var(--border)] [&_hr]:my-4",
          "[&_a]:text-[var(--color-primary)] [&_a]:underline",
          "[&_s]:line-through [&_s]:text-[var(--text-tertiary)]",
          "[&:empty]:before:content-['Type_/_for_commands...'] [&:empty]:before:text-[var(--text-tertiary)]",
        )}
      />

      {/* Slash menu */}
      <SlashMenu
        isOpen={slashOpen}
        filter={slashFilter}
        position={slashPos}
        commands={slashCommands}
        onSelect={handleSlashSelect}
        onClose={() => { setSlashOpen(false); slashStartRef.current = null; }}
      />
    </div>
  );
}
