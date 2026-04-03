import { db } from "@/db/schema";

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportJSON() {
  const items = await db.items.toArray();
  const sessions = await db.focusSessions.toArray();
  const templates = await db.metricTemplates.toArray();
  const cards = await db.dashboardCards.toArray();
  const prefs = await db.preferences.get("user");

  const data = { items, focusSessions: sessions, metricTemplates: templates, dashboardCards: cards, preferences: prefs, exportedAt: new Date().toISOString() };
  downloadFile(JSON.stringify(data, null, 2), `productiv-backup-${new Date().toISOString().slice(0, 10)}.json`, "application/json");
}

export async function exportCSV() {
  const items = await db.items.toArray();
  const headers = ["id", "type", "title", "date", "startTime", "endTime", "status", "priority", "tags", "createdAt"];
  const rows = items.map(i => headers.map(h => {
    const val = (i as unknown as Record<string, unknown>)[h];
    if (Array.isArray(val)) return val.join("; ");
    return String(val ?? "");
  }).join(","));
  downloadFile([headers.join(","), ...rows].join("\n"), `productiv-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv");
}

export async function exportMarkdown() {
  const items = await db.items.toArray();
  const tasks = items.filter(i => i.type === "task");
  const events = items.filter(i => i.type === "event");
  const notes = items.filter(i => i.type === "note" || i.type === "journal");

  let md = `# Productiv Export\n\n_Exported ${new Date().toLocaleDateString()}_\n\n`;
  md += `## Tasks (${tasks.length})\n\n`;
  tasks.forEach(t => { md += `- [${t.status === "done" ? "x" : " "}] ${t.title}${t.date ? ` (${t.date})` : ""}\n`; });
  md += `\n## Events (${events.length})\n\n`;
  events.forEach(e => { md += `- ${e.title}${e.date ? ` — ${e.date}` : ""}${e.startTime ? ` ${e.startTime}` : ""}\n`; });
  md += `\n## Notes (${notes.length})\n\n`;
  notes.forEach(n => { md += `### ${n.title}\n${n.content?.replace(/<[^>]*>/g, "") || ""}\n\n`; });

  downloadFile(md, `productiv-${new Date().toISOString().slice(0, 10)}.md`, "text/markdown");
}

export async function importJSON(file: File) {
  const text = await file.text();
  const data = JSON.parse(text);
  if (data.items) await db.items.bulkPut(data.items);
  if (data.focusSessions) await db.focusSessions.bulkPut(data.focusSessions);
  if (data.metricTemplates) await db.metricTemplates.bulkPut(data.metricTemplates);
  if (data.dashboardCards) await db.dashboardCards.bulkPut(data.dashboardCards);
  if (data.preferences) await db.preferences.put(data.preferences);
}
