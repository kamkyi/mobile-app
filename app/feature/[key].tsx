import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo } from "react";
import { LinearGradient } from "expo-linear-gradient";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FEATURE_MAP } from "@/constants/pages";
import { useAuth } from "@/context/AuthContext";

export default function FeatureScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ key?: string }>();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const horizontalPadding = width < 380 ? 12 : 16;
  const contentWidth = Math.min(width - horizontalPadding * 2, 640);

  const feature = useMemo(() => {
    if (!params.key) {
      return null;
    }

    return FEATURE_MAP[params.key] ?? null;
  }, [params.key]);

  useEffect(() => {
    if (feature?.requiresAuth && !isAuthenticated) {
      router.replace("/login");
    }
  }, [feature, isAuthenticated, router]);

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
        colors={["#ECF3FF", "#F7F9FF"]}
        end={{ x: 0.8, y: 1 }}
        start={{ x: 0.2, y: 0 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.card, { width: contentWidth }]}>
        <Text style={styles.title}>{feature?.label ?? "Feature"}</Text>
        <Text style={styles.subtitle}>Route key: {params.key ?? "unknown"}</Text>
        <Text style={styles.body}>
          This is a placeholder screen. Add your real feature module here.
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4ECFF",
    padding: 24,
    shadowColor: "#253463",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0F1D42",
  },
  subtitle: {
    marginTop: 8,
    color: "#4C5D89",
    fontSize: 14,
    fontWeight: "700",
  },
  body: {
    marginTop: 14,
    color: "#55668F",
    fontSize: 15,
    lineHeight: 22,
  },
  button: {
    marginTop: 22,
    alignSelf: "flex-start",
    minHeight: 44,
    minWidth: 100,
    borderRadius: 12,
    backgroundColor: "#3359CA",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
