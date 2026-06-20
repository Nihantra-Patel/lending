import React from "react";
import { ScrollView, View, ViewStyle } from "react-native";
import { useTheme } from "../lib/ThemeContext";
import { useResponsive } from "../lib/responsive";

/**
 * Page wrapper: full-bleed single column on mobile, centered max-width column on
 * tablet/laptop. Use `scroll` for content pages.
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
  const { palette } = useTheme();

  const inner = (
    <View style={[{ width: "100%", maxWidth: contentMaxWidth, alignSelf: "center", flex: 1 }, contentStyle]}>
      {children}
    </View>
  );

  if (scroll) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: palette.bg }}
        contentContainerStyle={{ alignItems: "center", flexGrow: 1 }}
      >
        {inner}
      </ScrollView>
    );
  }

  return <View style={{ flex: 1, backgroundColor: palette.bg, alignItems: "center" }}>{inner}</View>;
}
