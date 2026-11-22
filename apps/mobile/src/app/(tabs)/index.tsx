import { Text, View, Pressable } from "react-native";
import { ArrowUpRight, Activity, Sparkles, ShieldCheck } from "lucide-react-native";
import { Screen } from "../../components/ui/Screen";
import { Card } from "../../components/ui/Card";
import { SectionTitle } from "../../components/ui/SectionTitle";
import { useRouter } from "expo-router";
import { useHistoryStore } from "../../features/history/history-store";

export default function HomeScreen() {
  const router = useRouter();
  const items = useHistoryStore(s => s.items);
  const successful = items.filter(x => x.status === "success").length;
  return <Screen>
    <View className="mb-5"><Text className="text-xs font-bold uppercase tracking-widest text-light-muted dark:text-dark-muted">DOCKKEY WORKSPACE</Text><Text className="mt-1 text-3xl font-extrabold text-light-text dark:text-dark-text">Tools, made simple.</Text><Text className="mt-2 text-sm text-light-muted dark:text-dark-muted">Generator praktis dengan koneksi provider yang aman.</Text></View>
    <View className="rounded-[28px] bg-[#FCE7EF] p-5 dark:bg-[#49303F]"><View className="mb-3 h-10 w-10 items-center justify-center rounded-2xl bg-[#F47791]"><Sparkles color="#38202A" size={22}/></View><Text className="text-[27px] font-extrabold leading-8 text-[#30232A]">Alight Motion{`\n`}Generator</Text><Text className="mt-2 text-sm leading-5 text-[#725A64]">Kirim email verifikasi dan lanjutkan proses aktivasi.</Text><Pressable onPress={() => router.push("/generator/am-generator")} className="mt-4 h-12 flex-row items-center justify-center rounded-2xl bg-white px-4"><Text className="mr-2 font-extrabold text-[#30232A]">Buka generator</Text><ArrowUpRight size={18} color="#278F7D"/></Pressable></View>
    <SectionTitle title="Ringkasan aktivitas" />
    <View className="flex-row gap-3"><Card className="flex-1"><Activity color="#278F7D" size={22}/><Text className="mt-3 text-2xl font-extrabold text-light-text dark:text-dark-text">{items.length}</Text><Text className="mt-1 text-xs text-light-muted dark:text-dark-muted">Total request</Text></Card><Card className="flex-1"><ShieldCheck color="#278F7D" size={22}/><Text className="mt-3 text-2xl font-extrabold text-light-text dark:text-dark-text">{successful}</Text><Text className="mt-1 text-xs text-light-muted dark:text-dark-muted">Request berhasil</Text></Card></View>
    <SectionTitle title="Informasi" />
    <Card><Text className="text-sm font-bold text-light-text dark:text-dark-text">Kredensial provider terlindungi</Text><Text className="mt-2 text-sm leading-6 text-light-muted dark:text-dark-muted">API Key GenCipta disimpan di backend deployment. Aplikasi tidak meminta atau menyimpan API Key provider.</Text></Card>
    <Text className="mt-5 text-center text-xs text-light-muted dark:text-dark-muted">DockKey 1.0.0 • Central / Self-host</Text>
  </Screen>;
}
