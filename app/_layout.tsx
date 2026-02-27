import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, StyleSheet, Text, View } from "react-native";
import "react-native-reanimated";

import DrawerMenu from "@/components/DrawerMenu";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { DrawerProvider, useDrawer } from "@/context/DrawerContext";
import { useColorScheme } from "@/hooks/use-color-scheme";

// ─── Dynamic Header Title ─────────────────────────────────────────────────────

function HeaderTitle() {
  const { user, isAuthenticated } = useAuth();
  const displayName =
    isAuthenticated && user?.firstName
      ? `Hi, ${user.firstName} 👋`
      : isAuthenticated && user?.name
        ? `Hi, ${user.name.split(" ")[0]} 👋`
        : "Super App";

  return (
    <Text style={styles.headerTitle} numberOfLines={1}>
      {displayName}
    </Text>
  );
}

// ─── Header Left: Avatar / Login ──────────────────────────────────────────────

function HeaderMenuButton() {
  const { isAuthenticated, user } = useAuth();
  const { open } = useDrawer();
  const router = useRouter();

  if (!isAuthenticated) {
    return (
      <Pressable
        onPress={() => router.push("/login")}
        style={({ pressed }) => [
          styles.headerButton,
          pressed ? styles.headerButtonPressed : null,
        ]}
        accessibilityLabel="Log in"
        accessibilityRole="button"
      >
        <Text style={styles.headerButtonText}>Login</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={open}
      hitSlop={10}
      style={styles.avatarBtn}
      accessibilityLabel="Open menu"
      accessibilityRole="button"
    >
      {user?.profilePictureUrl ? (
        <Image
          source={{ uri: user.profilePictureUrl }}
          style={styles.headerAvatar}
          contentFit="cover"
          transition={150}
        />
      ) : (
        <View style={styles.headerAvatarFallback}>
          <Text style={styles.headerAvatarInitials}>
            {(user?.name ?? "U")
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((w: string) => w[0].toUpperCase())
              .join("")}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

// ─── Root Layout ─────────────────────────────────────────────────────────────

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <DrawerProvider>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <Stack
            screenOptions={{
              headerBackTitle: "Back",
              headerStyle: { backgroundColor: "#0A2540" },
              headerTintColor: "#FFFFFF",
              headerTitleStyle: { color: "#FFFFFF" },
            }}
          >
            <Stack.Screen
              name="index"
              options={{
                headerTitle: HeaderTitle,
                headerLeft: HeaderMenuButton,
              }}
            />
            <Stack.Screen name="login" options={{ title: "Login" }} />
            <Stack.Screen name="feature/[key]" options={{ title: "Feature" }} />
            <Stack.Screen
              name="modal"
              options={{ presentation: "modal", title: "Modal" }}
            />
          </Stack>
          <DrawerMenu />
          <StatusBar style="auto" />
        </ThemeProvider>
      </DrawerProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerButton: {
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.32)",
    minHeight: 34,
    paddingHorizontal: 13,
    paddingVertical: 7,
    marginLeft: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  headerButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  headerButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  avatarBtn: {
    marginLeft: 8,
  },
  headerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: "#3B82F6",
  },
  headerAvatarFallback: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#0A2540",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#3B82F6",
  },
  headerAvatarInitials: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
