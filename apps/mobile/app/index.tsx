import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../src/lib/auth";
import { useTheme } from "../src/lib/ThemeContext";

/** Entry gate: route to the app if signed in, otherwise to login. */
export default function Index() {
  const { loading, profile } = useAuth();
  const { palette } = useTheme();

  if (loading) {
    return (
      <View
        style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: palette.bg }}
      >
        <ActivityIndicator size="large" color={palette.accent} />
      </View>
    );
  }

  return <Redirect href={profile ? "/(tabs)" : "/login"} />;
}
