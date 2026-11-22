import { Pressable, Text, View } from "react-native";
import { ArrowUpRight, Sparkles } from "lucide-react-native";
import { useRouter } from "expo-router";
import { Screen } from "../../components/ui/Screen";
import { Card } from "../../components/ui/Card";
export default function ToolsScreen() {
  const router = useRouter();
  return <Screen><Text className="text-xs font-bold uppercase tracking-widest text-light-muted dark:text-dark-muted">DOCKKEY CATALOG</Text><Text className="mt-1 text-3xl font-extrabold text-light-text dark:text-dark-text">Tools</Text><Text className="mt-2 text-sm text-light-muted dark:text-dark-muted">Pilih tool yang ingin digunakan.</Text><Pressable onPress={() => router.push("/generator/am-generator")}><Card className="mt-6"><View className="flex-row items-center"><View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#FCE7EF] dark:bg-[#49303F]"><Sparkles color="#D95F7C" size={24}/></View><View className="ml-3 flex-1"><Text className="text-base font-extrabold text-light-text dark:text-dark-text">Alight Motion Generator</Text><Text className="mt-1 text-xs text-light-muted dark:text-dark-muted">Email verification workflow</Text></View><ArrowUpRight color="#278F7D" size={20}/></View></Card></Pressable></Screen>;
}
