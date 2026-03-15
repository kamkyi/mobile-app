import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  PROFESSIONAL_GENDER_OPTIONS,
  PROFESSIONAL_ROLE_OPTIONS,
  normalizeProfessionalGenders,
  normalizeProfessionalRoles,
} from "@/constants/professional";
import { useAppData } from "@/context/AppDataContext";
import { useScreenLayout } from "@/hooks/use-screen-layout";

function getRoleLabel(role: string) {
  const option = PROFESSIONAL_ROLE_OPTIONS.find((item) => item.key === role);

  if (!option) {
    return role;
  }

  return option.key
    .split("-")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

export default function LinkedTabScreen() {
  const router = useRouter();
  const { currentProfessionalProfile } = useAppData();
  const { contentContainerStyle } = useScreenLayout({
    bottomPadding: 32,
    gap: 14,
  });
  const roles = normalizeProfessionalRoles(currentProfessionalProfile?.roles ?? []);
  const genders = normalizeProfessionalGenders(currentProfessionalProfile?.genders ?? []);

  return (
    <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>Linked</Text>
          <Text style={styles.headerBody}>
            Your saved professional profile lives here, together with quick links into the directories.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Current roles</Text>
          <View style={styles.chipRow}>
            {roles.length > 0 ? (
              roles.map((role) => {
                return (
                  <View key={role} style={styles.roleChip}>
                    <Text style={styles.roleChipText}>{getRoleLabel(role)}</Text>
                  </View>
                );
              })
            ) : (
              <Text style={styles.mutedText}>No professional roles saved yet.</Text>
            )}
          </View>

          <Text style={styles.sectionTitle}>Genders</Text>
          <View style={styles.chipRow}>
            {genders.length > 0 ? (
              genders.map((gender) => {
                const option = PROFESSIONAL_GENDER_OPTIONS.find((item) => item.key === gender);

                return (
                  <View key={gender} style={styles.genderChip}>
                    <Text style={styles.genderChipText}>{option?.label ?? gender}</Text>
                  </View>
                );
              })
            ) : (
              <Text style={styles.mutedText}>No genders selected yet.</Text>
            )}
          </View>
        </View>

        <Pressable
          onPress={() => router.push("/feature/doctor")}
          style={({ pressed }) => [styles.linkCard, pressed ? styles.linkCardPressed : null]}
        >
          <Ionicons color="#0EA5E9" name="medkit-outline" size={20} />
          <Text style={styles.linkText}>Open doctor directory</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/feature/dating")}
          style={({ pressed }) => [styles.linkCard, pressed ? styles.linkCardPressed : null]}
        >
          <Ionicons color="#DB2777" name="heart-outline" size={20} />
          <Text style={styles.linkText}>Open dater directory</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  headerCard: {
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 18,
  },
  headerTitle: {
    color: "#0F172A",
    fontSize: 24,
    fontWeight: "800",
  },
  headerBody: {
    marginTop: 6,
    color: "#475569",
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "800",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  roleChip: {
    borderRadius: 999,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  roleChipText: {
    color: "#1D4ED8",
    fontSize: 12,
    fontWeight: "700",
  },
  genderChip: {
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  genderChipText: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "700",
  },
  mutedText: {
    color: "#64748B",
    fontSize: 13,
  },
  linkCard: {
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  linkCardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  linkText: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "700",
  },
});
