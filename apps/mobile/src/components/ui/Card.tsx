import { PropsWithChildren } from "react";
import { View, ViewProps } from "react-native";
export function Card({ children, className = "", ...props }: PropsWithChildren<ViewProps & { className?: string }>) {
  return <View className={`rounded-card border border-[#EEE9DF] bg-white p-4 dark:border-[#3B3D4A] dark:bg-dark-surface ${className}`} {...props}>{children}</View>;
}
