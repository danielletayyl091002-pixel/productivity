"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { CalendarEvent } from "@/types/calendar";
import { EventColor, EVENT_COLORS } from "@/lib/colors";
import { cn } from "@/lib/utils";
import { toDateString } from "@/lib/dates";

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">) => void;
  onDelete?: () => void;
  event?: CalendarEvent | null;
  defaultDate?: string;
}

export default function EventModal({ isOpen, onClose, onSave, onDelete, event, defaultDate }: EventModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(defaultDate || toDateString(new Date()));
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isAllDay, setIsAllDay] = useState(true);
  const [color, setColor] = useState<EventColor>("blue");

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || "");
      setDate(event.date);
      setStartTime(event.startTime || "");
      setEndTime(event.endTime || "");
      setIsAllDay(event.isAllDay);
      setColor(event.color);
    } else {
      setTitle("");
      setDescription("");
      setDate(defaultDate || toDateString(new Date()));
      setStartTime("09:00");
      setEndTime("10:00");
      setIsAllDay(true);
      setColor("blue");
    }
  }, [event, defaultDate, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      date,
      startTime: isAllDay ? undefined : startTime,
      endTime: isAllDay ? undefined : endTime,
      isAllDay,
      color,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={event ? "Edit Event" : "New Event"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input id="event-title" label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" required />
        <Input id="event-desc" label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
        <Input id="event-date" label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isAllDay} onChange={(e) => setIsAllDay(e.target.checked)} className="rounded border-gray-300" />
          All day
        </label>

        {!isAllDay && (
          <div className="grid grid-cols-2 gap-3">
            <Input id="event-start" label="Start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            <Input id="event-end" label="End" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
        )}

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Color</label>
          <div className="flex gap-2">
            {(Object.keys(EVENT_COLORS) as EventColor[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn("h-6 w-6 rounded-full transition-transform", EVENT_COLORS[c].dot, color === c && "ring-2 ring-offset-2 ring-blue-500 scale-110")}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-between pt-2">
          {onDelete && event && (
            <Button type="button" variant="danger" size="sm" onClick={onDelete}>Delete</Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" size="sm">{event ? "Update" : "Create"}</Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
