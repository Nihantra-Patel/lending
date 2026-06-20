import React from "react";
import { ScrollView, View, ViewStyle } from "react-native";
import { theme } from "../lib/theme";
import { useResponsive } from "../lib/responsive";

/**
 * Page wrapper that gives mobile a full-bleed single column and tablet/laptop a
 * centered column with a comfortable max width. Use `scroll` for content pages.
 */
export function Screen({
  children,
  scroll = false,
  contentStyle,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
}) {
  const { contentMaxWidth } = useResponsive();

  const inner = (
    <View style={[{ width: "100%", maxWidth: contentMaxWidth, alignSelf: "center", flex: 1 }, contentStyle]}>
      {children}
    </View>
  );

  if (scroll) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.bg }}
        contentContainerStyle={{ alignItems: "center", flexGrow: 1 }}
      >
        {inner}
      </ScrollView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: "center" }}>{inner}</View>
  );
}
