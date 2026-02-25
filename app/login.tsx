import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect } from "react";
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
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isLoading, startWorkOSLogin } = useAuth();
  const horizontalPadding = width < 380 ? 12 : 16;
  const cardWidth = Math.min(width - horizontalPadding * 2, 380);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, router]);

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
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.loginButtonText}>Continue with WorkOS</Text>
          )}
        </Pressable>

        <Text style={styles.note}>
          Replace startWorkOSLogin() in AuthContext with your real AuthKit
          authorize + callback exchange.
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
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderWidth: 1,
    borderColor: "#E5ECFF",
    shadowColor: "#1D2F61",
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111F45",
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 18,
    fontSize: 13.5,
    lineHeight: 20,
    color: "#56668E",
  },
  loginButton: {
    minHeight: 46,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3359CA",
  },
  loginButtonPressed: {
    opacity: 0.86,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 15.5,
    fontWeight: "800",
  },
  note: {
    marginTop: 16,
    fontSize: 12,
    lineHeight: 18,
    color: "#7280A3",
  },
});
