import { ActivityIndicator, Pressable, Text } from "react-native";
export function PrimaryButton({ title, onPress, loading = false }: { title: string; onPress: () => void; loading?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={loading} onPress={onPress} className="h-[52px] flex-row items-center justify-center rounded-control bg-brand-coral active:opacity-80">{loading ? <ActivityIndicator color="#38202A" /> : <Text className="font-extrabold text-[#38202A]">{title}</Text>}</Pressable>;
}
