"use client";

import { useState } from "react";
import { useReading } from "@/contexts/ReadingContext";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";
import { BookOpen, Plus, Trash2, Star } from "lucide-react";
import { toDateString } from "@/lib/dates";
import { ReadingStatus } from "@/types/reading";

const STATUS_OPTIONS: { value: ReadingStatus; label: string }[] = [
  { value: "to-read", label: "To Read" }, { value: "reading", label: "Reading" },
  { value: "finished", label: "Finished" }, { value: "abandoned", label: "Abandoned" },
];

const STATUS_BADGE: Record<ReadingStatus, "default" | "info" | "success" | "danger"> = {
  "to-read": "default", "reading": "info", "finished": "success", "abandoned": "danger",
};

export default function ReadingPage() {
  const { books, addBook, updateBook, removeBook } = useReading();
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [totalPages, setTotalPages] = useState("");
  const [status, setStatus] = useState<ReadingStatus>("to-read");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addBook({
      title: title.trim(), author: author.trim(), totalPages: parseInt(totalPages) || 0,
      currentPage: 0, status, startDate: status === "reading" ? toDateString(new Date()) : undefined,
    });
    setTitle(""); setAuthor(""); setTotalPages(""); setShowModal(false);
  };

  const updateProgress = (bookId: string, currentPage: number, total: number) => {
    const updates: Record<string, unknown> = { currentPage };
    if (currentPage >= total) {
      updates.status = "finished";
      updates.finishDate = toDateString(new Date());
    }
    updateBook(bookId, updates);
  };

  const reading = books.filter((b) => b.status === "reading");
  const toRead = books.filter((b) => b.status === "to-read");
  const finished = books.filter((b) => b.status === "finished");

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-violet-500" />
          <h2 className="text-lg font-semibold">Reading Tracker</h2>
        </div>
        <Button size="sm" onClick={() => setShowModal(true)}><Plus className="h-4 w-4" /> Add Book</Button>
      </div>

      {books.length === 0 ? (
        <EmptyState icon={<BookOpen className="h-10 w-10" />} title="No books yet" description="Start building your reading list" action={{ label: "Add Book", onClick: () => setShowModal(true) }} />
      ) : (
        <>
          {reading.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Currently Reading</h3>
              {reading.map((book) => (
                <Card key={book.id}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{book.title}</p>
                      <p className="text-xs text-gray-500">{book.author}</p>
                    </div>
                    <button onClick={() => removeBook(book.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  <ProgressBar value={book.currentPage} max={book.totalPages} color="bg-violet-500" showLabel />
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      id={`page-${book.id}`}
                      type="number"
                      min={0}
                      max={book.totalPages}
                      value={book.currentPage}
                      onChange={(e) => updateProgress(book.id, parseInt(e.target.value) || 0, book.totalPages)}
                      className="w-20 text-xs"
                    />
                    <span className="text-xs text-gray-500">/ {book.totalPages} pages</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
          {toRead.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">To Read</h3>
              {toRead.map((book) => (
                <Card key={book.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{book.title}</p>
                    <p className="text-xs text-gray-500">{book.author} &middot; {book.totalPages} pages</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => updateBook(book.id, { status: "reading", startDate: toDateString(new Date()) })}>Start</Button>
                    <button onClick={() => removeBook(book.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </Card>
              ))}
            </div>
          )}
          {finished.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Finished ({finished.length})</h3>
              {finished.map((book) => (
                <Card key={book.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{book.title}</p>
                    <p className="text-xs text-gray-500">{book.author}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="success">Finished</Badge>
                    <button onClick={() => removeBook(book.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Book">
        <form onSubmit={handleAdd} className="space-y-4">
          <Input id="book-title" label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <Input id="book-author" label="Author" value={author} onChange={(e) => setAuthor(e.target.value)} />
          <Input id="book-pages" label="Total Pages" type="number" value={totalPages} onChange={(e) => setTotalPages(e.target.value)} />
          <Select id="book-status" label="Status" value={status} onChange={(e) => setStatus(e.target.value as ReadingStatus)} options={STATUS_OPTIONS} />
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" size="sm" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" size="sm">Add</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
