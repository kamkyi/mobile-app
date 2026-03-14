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
import { useAuth } from "@/context/AuthContext";

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

export default function ProfileTabScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { currentProfessionalProfile } = useAppData();
  const roles = normalizeProfessionalRoles(currentProfessionalProfile?.roles ?? []);
  const genders = normalizeProfessionalGenders(currentProfessionalProfile?.genders ?? []);

  const handleEditProfile = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const route =
      roles.length > 0
        ? `/professional/profile?roles=${roles.join(",")}`
        : "/professional";

    router.push(route as never);
  };

  return (
    <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.name ?? "U")
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase() ?? "")
                .join("")}
            </Text>
          </View>
          <Text style={styles.headerTitle}>{user?.name ?? "Your profile"}</Text>
          <Text style={styles.headerBody}>{user?.email ?? "Log in to save your profile."}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Professional profile</Text>
          <Text style={styles.primaryText}>
            {currentProfessionalProfile?.nickname ?? "No professional nickname saved yet."}
          </Text>
          <Text style={styles.secondaryText}>
            {currentProfessionalProfile?.bio ?? "Add roles, genders, and a short intro so your profile appears well in the list."}
          </Text>
          {currentProfessionalProfile?.serviceLocation ? (
            <Text style={styles.secondaryText}>
              Service location: {currentProfessionalProfile.serviceLocation}
            </Text>
          ) : null}

          <View style={styles.chipRow}>
            {roles.map((role) => (
              <View key={role} style={styles.roleChip}>
                <Text style={styles.roleChipText}>{getRoleLabel(role)}</Text>
              </View>
            ))}
            {genders.map((gender) => {
              const option = PROFESSIONAL_GENDER_OPTIONS.find((item) => item.key === gender);

              return (
                <View key={gender} style={styles.genderChip}>
                  <Text style={styles.genderChipText}>{option?.label ?? gender}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <Pressable
          onPress={handleEditProfile}
          style={({ pressed }) => [styles.actionButton, pressed ? styles.actionButtonPressed : null]}
        >
          <Text style={styles.actionButtonText}>
            {roles.length > 0 ? "Edit profile" : "Create profile"}
          </Text>
          <Ionicons color="#FFFFFF" name="chevron-forward" size={18} />
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
  content: {
    padding: 16,
    gap: 14,
  },
  headerCard: {
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 18,
    alignItems: "center",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
  },
  headerTitle: {
    marginTop: 12,
    color: "#0F172A",
    fontSize: 22,
    fontWeight: "800",
  },
  headerBody: {
    marginTop: 6,
    color: "#64748B",
    fontSize: 13,
    textAlign: "center",
  },
  card: {
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    gap: 10,
  },
  sectionTitle: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "800",
  },
  primaryText: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "800",
  },
  secondaryText: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 19,
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
    textTransform: "capitalize",
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
  actionButton: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: "#2563EB",
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});
