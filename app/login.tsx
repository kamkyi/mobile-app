import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";

export default function LoginScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isLoading, startWorkOSLogin } = useAuth();
  const horizontalPadding = width < 380 ? 12 : 16;
  const cardWidth = Math.min(width - horizontalPadding * 2, 380);

  if (isAuthenticated) {
    return <Redirect href="/" />;
  }

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(18, insets.bottom + 12),
          paddingHorizontal: horizontalPadding,
          paddingTop: Math.max(18, insets.top + 10),
        },
      ]}
    >
      <LinearGradient
        colors={["#ECF3FF", "#F9FBFF"]}
        end={{ x: 0.8, y: 1 }}
        start={{ x: 0.2, y: 0 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.card, { width: cardWidth }]}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>
          Sign in to unlock all super app services.
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continue with WorkOS"
          disabled={isLoading}
          onPress={startWorkOSLogin}
          style={({ pressed }) => [
            styles.loginButton,
            pressed && !isLoading ? styles.loginButtonPressed : null,
            isLoading ? styles.loginButtonDisabled : null,
          ]}
        >
          <LinearGradient
            colors={["#0A2540", "#1A3F6B"]}
            end={{ x: 1, y: 1 }}
            start={{ x: 0, y: 0 }}
            style={styles.loginButtonGradient}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={styles.loginButtonRow}>
                <Ionicons color="#FFFFFF" name="log-in-outline" size={18} />
                <Text style={styles.loginButtonText}>Continue with WorkOS</Text>
              </View>
            )}
          </LinearGradient>
        </Pressable>

        <Text style={styles.note}>
          Uses WorkOS AuthKit PKCE flow. Ensure your WorkOS app includes this
          mobile redirect URI and your EXPO_PUBLIC_WORKOS_CLIENT_ID is set.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#0A2540",
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 20,
    fontSize: 14,
    lineHeight: 20,
    color: "#6B7280",
  },
  loginButton: {
    marginTop: 10,
    borderRadius: 8,
    overflow: "hidden",
    shadowColor: "#0A2540",
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 3,
  },
  loginButtonGradient: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  loginButtonRow: {
    alignItems: "center",
    flexDirection: "row",
    columnGap: 8,
  },
  loginButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }, { translateY: 1 }],
  },
  loginButtonDisabled: {
    opacity: 0.62,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  note: {
    marginTop: 16,
    fontSize: 12,
    lineHeight: 18,
    color: "#6B7280",
  },
});
