import { create } from "zustand";
import type { ColorSchemeName } from "react-native";
import * as SecureStore from "expo-secure-store";

export type ThemeMode = "light" | "dark" | "system";
interface ThemeState { mode: ThemeMode; hydrated: boolean; hydrate: () => Promise<void>; setMode: (mode: ThemeMode) => Promise<void>; }
export const useThemeStore = create<ThemeState>((set) => ({
  mode: "system", hydrated: false,
  hydrate: async () => {
    const saved = await SecureStore.getItemAsync("dockkey-theme");
    const mode: ThemeMode = saved === "light" || saved === "dark" ? saved : "system";
    set({ mode, hydrated: true });
  },
  setMode: async (mode) => { await SecureStore.setItemAsync("dockkey-theme", mode); set({ mode }); }
}));
export function resolveTheme(mode: ThemeMode, system: ColorSchemeName): "light" | "dark" {
  return mode === "system" ? (system === "dark" ? "dark" : "light") : mode;
}
