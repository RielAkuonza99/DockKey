import "../../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "nativewind";
import { useEffect } from "react";
import { useThemeStore, resolveTheme } from "../theme/theme-store";
import { useColorScheme as useSystemColorScheme } from "react-native";

export default function RootLayout() {
  const hydrate = useThemeStore((s) => s.hydrate);
  const mode = useThemeStore((s) => s.mode);
  const system = useSystemColorScheme();
  const { setColorScheme } = useColorScheme();
  useEffect(() => { void hydrate(); }, [hydrate]);
  useEffect(() => { setColorScheme(resolveTheme(mode, system)); }, [mode, system, setColorScheme]);
  return <><StatusBar style={resolveTheme(mode, system) === "dark" ? "light" : "dark"} /><Stack screenOptions={{ headerShown: false }}><Stack.Screen name="(tabs)" /><Stack.Screen name="generator/[slug]" options={{ presentation: "card" }} /></Stack></>;
}
