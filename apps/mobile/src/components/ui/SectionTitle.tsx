import { Text, View } from "react-native";
export function SectionTitle({ title, action }: { title: string; action?: string }) {
  return <View className="mb-3 mt-6 flex-row items-center justify-between"><Text className="text-lg font-extrabold text-light-text dark:text-dark-text">{title}</Text>{action ? <Text className="text-xs font-bold text-brand-teal">{action}</Text> : null}</View>;
}
