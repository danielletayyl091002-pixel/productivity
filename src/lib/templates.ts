import { format, startOfWeek } from "date-fns";

export interface NoteTemplate {
  id: string;
  name: string;
  emoji: string;
  description: string;
  getTitle: () => string;
  getContent: () => string;
}

const today = () => format(new Date(), "MMMM d, yyyy");
const monday = () => format(startOfWeek(new Date(), { weekStartsOn: 1 }), "MMMM d");

export const NOTE_TEMPLATES: NoteTemplate[] = [
  {
    id: "daily-journal",
    name: "Daily Journal",
    emoji: "📓",
    description: "Morning + evening reflection",
    getTitle: () => `Daily Journal — ${today()}`,
    getContent: () => `<h2>🌅 Morning Intentions</h2><ul data-type="taskList"><li data-type="taskItem" data-checked="false"><p>One thing I'm grateful for</p></li><li data-type="taskItem" data-checked="false"><p>Today's focus</p></li><li data-type="taskItem" data-checked="false"><p>One thing I want to let go of</p></li></ul><h2>📋 Today's Plan</h2><ul><li><p>Priority 1</p></li><li><p>Priority 2</p></li><li><p>Priority 3</p></li></ul><h2>🌙 Evening Reflection</h2><ul data-type="taskList"><li data-type="taskItem" data-checked="false"><p>What went well?</p></li><li data-type="taskItem" data-checked="false"><p>What would I do differently?</p></li><li data-type="taskItem" data-checked="false"><p>Tomorrow's #1 priority</p></li></ul>`,
  },
  {
    id: "meeting-notes",
    name: "Meeting Notes",
    emoji: "🤝",
    description: "Agenda + action items",
    getTitle: () => `Meeting — ${today()}`,
    getContent: () => `<h2>📅 Meeting Details</h2><p><strong>Attendees:</strong> </p><p><strong>Date:</strong> ${today()}</p><p><strong>Duration:</strong> </p><h2>🎯 Agenda</h2><ol><li><p>Topic 1</p></li><li><p>Topic 2</p></li><li><p>Topic 3</p></li></ol><h2>✅ Action Items</h2><ul data-type="taskList"><li data-type="taskItem" data-checked="false"><p>Action item 1</p></li><li data-type="taskItem" data-checked="false"><p>Action item 2</p></li><li data-type="taskItem" data-checked="false"><p>Action item 3</p></li></ul><h2>📝 Notes</h2><p></p>`,
  },
  {
    id: "weekly-review",
    name: "Weekly Review",
    emoji: "📊",
    description: "Reflect + plan ahead",
    getTitle: () => `Week of ${monday()}`,
    getContent: () => `<h2>💪 What went well</h2><p></p><h2>🔧 What to improve</h2><p></p><h2>🎯 Next week's focus</h2><p></p><h2>📊 Goals check-in</h2><p></p>`,
  },
  {
    id: "brain-dump",
    name: "Brain Dump",
    emoji: "🧠",
    description: "Clear your mind",
    getTitle: () => `Brain Dump — ${today()}`,
    getContent: () => `<h2>🧠 Everything on my mind</h2><ul><li><p></p></li><li><p></p></li><li><p></p></li><li><p></p></li><li><p></p></li></ul><h2>⚡ Quick wins (&lt; 5 min)</h2><ul data-type="taskList"><li data-type="taskItem" data-checked="false"><p></p></li><li data-type="taskItem" data-checked="false"><p></p></li><li data-type="taskItem" data-checked="false"><p></p></li></ul><h2>🗑️ What I can let go of</h2><ul><li><p></p></li><li><p></p></li><li><p></p></li></ul>`,
  },
];
