import { Text, View } from "react-native";
import { Sparkles, Code2, Image, Wrench } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
const iconMap: Record<string, LucideIcon> = { sparkles: Sparkles, code: Code2, image: Image, wrench: Wrench };
export function CategoryCard({ title, subtitle, color, icon }: { title: string; subtitle: string; color: string; icon: string }) {
  const Icon = iconMap[icon] ?? Sparkles;
  return <View style={{ backgroundColor: color }} className="min-h-[142px] flex-1 justify-between rounded-[22px] p-4"><View className="h-10 w-10 items-center justify-center rounded-2xl bg-white/40"><Icon size={23} color="#292630" /></View><View><Text className="text-base font-extrabold text-[#292630]">{title}</Text><Text className="mt-1 text-xs font-medium text-[#49434D]">{subtitle}</Text></View></View>;
}
