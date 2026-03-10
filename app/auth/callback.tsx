import * as WebBrowser from "expo-web-browser";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAuth } from "@/context/AuthContext";

function getSingleParam(
  value: string | string[] | undefined,
): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  return Array.isArray(value) ? value[0] : undefined;
}

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isAuthenticated, isLoading, finishWorkOSLoginFromCallback } =
    useAuth();
  const [callbackError, setCallbackError] = useState<string | null>(null);
  const callbackParams = useMemo(
    () => ({
      code: getSingleParam(params.code),
      state: getSingleParam(params.state),
      error: getSingleParam(params.error),
      errorDescription: getSingleParam(params.error_description),
    }),
    [params.code, params.error, params.error_description, params.state],
  );

  useEffect(() => {
    if (Platform.OS === "web") {
      WebBrowser.maybeCompleteAuthSession();
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      return;
    }

    if (!callbackParams.code && !callbackParams.error) {
      setCallbackError("Missing WorkOS callback details. Start the login flow again.");
      return;
    }

    let isMounted = true;

    void finishWorkOSLoginFromCallback(callbackParams)
      .then(() => {
        if (isMounted) {
          setCallbackError(null);
        }
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setCallbackError(
          error instanceof Error
            ? error.message
            : "Unable to complete WorkOS sign in.",
        );
      });

    return () => {
      isMounted = false;
    };
  }, [callbackParams, finishWorkOSLoginFromCallback, isAuthenticated]);

  if (isAuthenticated) {
    return <Redirect href="/" />;
  }

  return (
    <View style={styles.container}>
      {callbackError ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Sign in failed</Text>
          <Text style={styles.errorMessage}>{callbackError}</Text>
          <Pressable
            accessibilityLabel="Back to login"
            accessibilityRole="button"
            onPress={() => router.replace("/login")}
            style={({ pressed }) => [
              styles.retryButton,
              pressed ? styles.retryButtonPressed : null,
            ]}
          >
            <Text style={styles.retryButtonLabel}>Back to login</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text style={styles.label}>
            {isLoading ? "Completing sign in..." : "Finishing WorkOS login..."}
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 24,
  },
  label: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "600",
  },
  errorCard: {
    width: "100%",
    maxWidth: 360,
    gap: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    padding: 20,
  },
  errorTitle: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "700",
  },
  errorMessage: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 20,
  },
  retryButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: "#0A2540",
  },
  retryButtonPressed: {
    opacity: 0.9,
  },
  retryButtonLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
