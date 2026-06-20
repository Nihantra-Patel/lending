import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../src/lib/auth";
import { theme } from "../src/lib/theme";

/** Entry gate: route to the app if signed in, otherwise to login. */
export default function Index() {
  const { loading, profile } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.bg }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return <Redirect href={profile ? "/(tabs)" : "/login"} />;
}
