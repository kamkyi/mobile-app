import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
import { ActivityIndicator, Platform, StyleSheet, Text, View } from "react-native";

export default function AuthCallbackScreen() {
  useEffect(() => {
    if (Platform.OS === "web") {
      WebBrowser.maybeCompleteAuthSession();
    }
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="small" color="#3B82F6" />
      <Text style={styles.label}>Completing sign in...</Text>
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
  },
  label: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "600",
  },
});
