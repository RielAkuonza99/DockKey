import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type HistoryItem = {
  id: string;
  email: string;
  action: "send" | "verify";
  status: "success" | "failed";
  verification?: "accepted" | "pending" | "completed";
  message: string;
  createdAt: string;
};

type HistoryState = {
  items: HistoryItem[];
  addItem: (item: HistoryItem) => void;
  clear: () => void;
};

export const useHistoryStore = create<HistoryState>()(persist((set) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [item, ...state.items].slice(0, 100) })),
  clear: () => set({ items: [] })
}), { name: "dockkey-history-v1", storage: createJSONStorage(() => AsyncStorage) }));
