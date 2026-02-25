import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, StyleSheet, Text } from "react-native";
import "react-native-reanimated";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import { useColorScheme } from "@/hooks/use-color-scheme";

function HeaderAuthAction() {
  const router = useRouter();
  const { isAuthenticated, logout } = useAuth();

  const onPress = () => {
    if (isAuthenticated) {
      logout();
      return;
    }

    router.push("/login");
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isAuthenticated ? "Log out" : "Log in"}
      hitSlop={12}
      onPress={onPress}
      style={styles.headerButton}
    >
      <Text style={styles.headerButtonText}>
        {isAuthenticated ? "Logout" : "Login"}
      </Text>
    </Pressable>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerBackTitle: "Back" }}>
          <Stack.Screen
            name="index"
            options={{
              title: "Super App",
              headerRight: HeaderAuthAction,
            }}
          />
          <Stack.Screen name="login" options={{ title: "Login" }} />
          <Stack.Screen name="feature/[key]" options={{ title: "Feature" }} />
          <Stack.Screen
            name="modal"
            options={{ presentation: "modal", title: "Modal" }}
          />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    borderRadius: 999,
    backgroundColor: "#EFF3FF",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  headerButtonText: {
    color: "#2B4FB8",
    fontSize: 13,
    fontWeight: "600",
  },
});
