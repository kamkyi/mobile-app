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

function HeaderBrand() {
  return (
    <View style={styles.brandWrap}>
      <View style={styles.brandDot} />
      <Text style={styles.brandText}>Links</Text>
    </View>
  );
}

function HeaderActionButton() {
  const { isAuthenticated, user } = useAuth();
  const { open } = useDrawer();
  const router = useRouter();

  if (!isAuthenticated) {
    return (
      <Pressable
        onPress={() => router.push("/login")}
        style={({ pressed }) => [
          styles.headerButton,
          pressed ? styles.buttonPressed : null,
        ]}
        accessibilityLabel="Log in"
        accessibilityRole="button"
      >
        <Text style={styles.loginButtonText}>Login</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={open}
      hitSlop={10}
      style={({ pressed }) => [
        styles.accountButton,
        pressed && styles.buttonPressed,
      ]}
      accessibilityLabel="Open menu"
      accessibilityRole="button"
    >
      {user?.profilePictureUrl ? (
        <Image
          source={{ uri: user.profilePictureUrl }}
          style={styles.avatarImage}
          contentFit="cover"
          transition={150}
        />
      ) : (
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarInitials}>
            {(user?.name ?? "U")
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((w: string) => w[0].toUpperCase())
              .join("")}
          </Text>
        </View>
      )}
      <Text style={styles.accountText}>Menu</Text>
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
                headerTitle: HeaderBrand,
                headerTitleAlign: "left",
                headerLeft: () => null,
                headerRight: HeaderActionButton,
              }}
            />
            <Stack.Screen name="login" options={{ title: "Login" }} />
            <Stack.Screen name="feature/[key]" options={{ title: "Feature" }} />
            <Stack.Screen
              name="auth/callback"
              options={{ headerShown: false }}
            />
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
  brandWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#3B82F6",
    borderWidth: 1,
    borderColor: "#93C5FD",
  },
  brandText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  headerButton: {
    borderRadius: 8,
    backgroundColor: "#3B82F6",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    minHeight: 36,
    minWidth: 84,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  accountButton: {
    minHeight: 36,
    borderRadius: 18,
    paddingLeft: 4,
    paddingRight: 10,
    alignItems: "center",
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.32)",
    gap: 7,
  },
  accountText: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  avatarImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
  },
  avatarFallback: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
  },
  avatarInitials: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
});
