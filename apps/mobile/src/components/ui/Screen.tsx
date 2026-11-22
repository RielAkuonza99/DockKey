import { PropsWithChildren } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function Screen({ children, scroll = true }: PropsWithChildren<{ scroll?: boolean }>) {
  return (
    <SafeAreaView className="flex-1 bg-light-background dark:bg-dark-background" edges={["top"]}>
      {scroll ? <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 112 }}>{children}</ScrollView> : <View className="flex-1 p-5">{children}</View>}
    </SafeAreaView>
  );
}
