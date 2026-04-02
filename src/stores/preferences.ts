import { create } from "zustand";
import { db, type UserPreferences } from "@/db/schema";

const DEFAULTS: UserPreferences = {
  id: "user",
  theme: "light",
  primaryColor: "#5B7FE8",
  fontFamily: "system",
  cornerRadius: 12,
  density: "comfortable",
  sidebarCollapsed: false,
  hiddenFeatures: [],
  morningStart: "06:00",
  eveningStart: "18:00",
  focusPeakHours: [],
};

interface PreferencesState {
  prefs: UserPreferences;
  loaded: boolean;
  load: () => Promise<void>;
  update: (updates: Partial<UserPreferences>) => Promise<void>;
  toggleSidebar: () => Promise<void>;
}

export const usePreferences = create<PreferencesState>((set, get) => ({
  prefs: DEFAULTS,
  loaded: false,

  load: async () => {
    const stored = await db.preferences.get("user");
    if (stored) {
      set({ prefs: stored, loaded: true });
    } else {
      await db.preferences.add(DEFAULTS);
      set({ prefs: DEFAULTS, loaded: true });
    }
  },

  update: async (updates) => {
    const newPrefs = { ...get().prefs, ...updates };
    await db.preferences.put(newPrefs);
    set({ prefs: newPrefs });
  },

  toggleSidebar: async () => {
    const current = get().prefs.sidebarCollapsed;
    await get().update({ sidebarCollapsed: !current });
  },
}));
