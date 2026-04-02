"use client";

import { useState, useMemo } from "react";
import { useItems } from "@/stores/items";
import TimelineItem from "@/components/timeline/TimelineItem";
import Tabs from "@/components/ui/Tabs";
import type { ItemType } from "@/db/schema";
import { Search } from "lucide-react";

const TYPE_TABS = [
  { id: "all", label: "All" },
  { id: "task", label: "Tasks" },
  { id: "event", label: "Events" },
  { id: "note", label: "Notes" },
  { id: "journal", label: "Journal" },
  { id: "habit", label: "Habits" },
  { id: "metric", label: "Metrics" },
];

export default function AllItemsPage() {
  const { items } = useItems();
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let result = items.filter(i => !i.archived);
    if (typeFilter !== "all") result = result.filter(i => i.type === typeFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.tags.some(t => t.toLowerCase().includes(q)) ||
        (i.content?.toLowerCase().includes(q) ?? false)
      );
    }
    return result.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [items, typeFilter, search]);

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-tertiary)]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter items..."
            className="w-full pl-9 pr-3 py-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--color-primary)]" />
        </div>
      </div>

      <Tabs tabs={TYPE_TABS} activeTab={typeFilter} onChange={setTypeFilter} />

      <p className="text-xs text-[var(--text-tertiary)]">{filtered.length} items</p>

      <div className="space-y-1">
        {filtered.slice(0, 100).map(item => (
          <TimelineItem key={item.id} item={item} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-[var(--text-tertiary)] text-center py-8">No items found</p>
      )}
    </div>
  );
}
