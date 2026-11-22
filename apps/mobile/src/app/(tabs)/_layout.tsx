import { Tabs } from "expo-router";
import { House, Grid2X2, History, UserRound } from "lucide-react-native";
export default function TabLayout() {
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: "#F47791", tabBarInactiveTintColor: "#AAA7B0", tabBarStyle: { position: "absolute", left: 16, right: 16, bottom: 10, height: 68, paddingTop: 8, paddingBottom: 8, borderRadius: 24, backgroundColor: "#24232B", borderTopWidth: 0, elevation: 10 }, tabBarLabelStyle: { fontSize: 10, fontWeight: "700" } }}>
    <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ color, size }) => <House color={color} size={size} /> }} />
    <Tabs.Screen name="tools" options={{ title: "Tools", tabBarIcon: ({ color, size }) => <Grid2X2 color={color} size={size} /> }} />
    <Tabs.Screen name="history" options={{ title: "History", tabBarIcon: ({ color, size }) => <History color={color} size={size} /> }} />
    <Tabs.Screen name="profile" options={{ title: "Settings", tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} /> }} />
  </Tabs>;
}
