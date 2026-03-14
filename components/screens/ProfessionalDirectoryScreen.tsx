import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DIRECTORY_SEED_PROFILES } from "@/constants/professional-directory";
import {
  PROFESSIONAL_GENDER_OPTIONS,
  normalizeProfessionalGenders,
  normalizeProfessionalRoles,
  type ProfessionalGenderKey,
  type ProfessionalRoleKey,
} from "@/constants/professional";
import { listProfessionalProfiles, listUserProfiles } from "@/db/storage";
import type {
  StoredProfessionalProfile,
  StoredUserProfile,
} from "@/db/types";

type DirectoryRole = Extract<ProfessionalRoleKey, "doctor" | "dater">;
type GenderFilter = "all" | ProfessionalGenderKey;

type DirectoryEntry = {
  id: string;
  nickname: string;
  dateOfBirth: string;
  bio: string;
  genders: ProfessionalGenderKey[];
  city: string;
  profileImageUri?: string;
  isSavedProfile: boolean;
};

function getRoleTitle(role: DirectoryRole) {
  return role === "doctor" ? "Doctors" : "Daters";
}

function getRoleLabel(role: DirectoryRole) {
  return role === "doctor" ? "Doctor" : "Dater";
}

function getDefaultBio(role: DirectoryRole) {
  return role === "doctor"
    ? "Available for appointments, checkups, and practical care guidance."
    : "Open to respectful conversation and genuine connections.";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getAge(dateOfBirth: string) {
  const parts = dateOfBirth.split("-").map(Number);

  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
    return null;
  }

  const [year, month, day] = parts;
  const today = new Date();
  let age = today.getFullYear() - year;
  const hasBirthdayPassed =
    today.getMonth() + 1 > month ||
    (today.getMonth() + 1 === month && today.getDate() >= day);

  if (!hasBirthdayPassed) {
    age -= 1;
  }

  return age > 0 ? age : null;
}

function buildStoredEntries(
  role: DirectoryRole,
  professionalProfiles: StoredProfessionalProfile[],
  userProfiles: StoredUserProfile[],
): DirectoryEntry[] {
  const userMap = new Map(userProfiles.map((userProfile) => [userProfile.userId, userProfile]));

  return professionalProfiles
    .filter((profile) => normalizeProfessionalRoles(profile.roles).includes(role))
    .map((profile) => {
      const user = userMap.get(profile.userId);

      return {
        id: `saved-${profile.userId}`,
        nickname: profile.nickname || user?.name || getRoleLabel(role),
        dateOfBirth: profile.dateOfBirth,
        bio: profile.bio?.trim() || getDefaultBio(role),
        genders: normalizeProfessionalGenders(profile.genders ?? []),
        city: profile.serviceLocation || user?.locale || "Local profile",
        profileImageUri: profile.profileImageUri ?? user?.profilePictureUrl,
        isSavedProfile: true,
      };
    });
}

function DirectoryCard({
  entry,
  role,
}: {
  entry: DirectoryEntry;
  role: DirectoryRole;
}) {
  const age = getAge(entry.dateOfBirth);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {entry.profileImageUri ? (
          <Image
            source={{ uri: entry.profileImageUri }}
            style={styles.avatarImage}
            contentFit="cover"
            transition={180}
          />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(entry.nickname)}</Text>
          </View>
        )}

        <View style={styles.cardHeaderCopy}>
          <View style={styles.titleRow}>
            <Text numberOfLines={1} style={styles.nameText}>
              {entry.nickname}
            </Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{getRoleLabel(role)}</Text>
            </View>
          </View>

          <Text numberOfLines={1} style={styles.metaText}>
            {age ? `${age} years old` : "Age hidden"} • {entry.city}
          </Text>
        </View>
      </View>

      <View style={styles.tagRow}>
        {entry.genders.length > 0 ? (
          entry.genders.map((gender) => {
            const option = PROFESSIONAL_GENDER_OPTIONS.find(
              (genderOption) => genderOption.key === gender,
            );

            if (!option) {
              return null;
            }

            return (
              <View
                key={`${entry.id}-${gender}`}
                style={[styles.genderChip, { backgroundColor: `${option.color}14` }]}
              >
                <Text style={[styles.genderChipText, { color: option.color }]}>
                  {option.label}
                </Text>
              </View>
            );
          })
        ) : (
          <View style={styles.genderChipMuted}>
            <Text style={styles.genderChipMutedText}>No gender selected yet</Text>
          </View>
        )}

        {entry.isSavedProfile ? (
          <View style={styles.savedBadge}>
            <Ionicons color="#2563EB" name="sparkles-outline" size={13} />
            <Text style={styles.savedBadgeText}>Saved profile</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.bioText}>{entry.bio}</Text>
    </View>
  );
}

export default function ProfessionalDirectoryScreen({
  role,
}: {
  role: DirectoryRole;
}) {
  const [entries, setEntries] = useState<DirectoryEntry[]>([]);
  const [selectedGender, setSelectedGender] = useState<GenderFilter>("all");
  const [isLoading, setIsLoading] = useState(true);

  const loadEntries = useCallback(async () => {
    setIsLoading(true);

    try {
      const [professionalProfiles, userProfiles] = await Promise.all([
        listProfessionalProfiles(),
        listUserProfiles(),
      ]);

      const storedEntries = buildStoredEntries(role, professionalProfiles, userProfiles);
      const seedEntries = DIRECTORY_SEED_PROFILES.filter((profile) => profile.role === role).map(
        (profile) => ({
          id: profile.id,
          nickname: profile.nickname,
          dateOfBirth: profile.dateOfBirth,
          bio: profile.bio,
          genders: profile.genders,
          city: profile.city,
          isSavedProfile: false,
        }),
      );

      setEntries([...storedEntries, ...seedEntries]);
    } finally {
      setIsLoading(false);
    }
  }, [role]);

  useFocusEffect(
    useCallback(() => {
      void loadEntries();
    }, [loadEntries]),
  );

  const filteredEntries = useMemo(() => {
    if (selectedGender === "all") {
      return entries;
    }

    return entries.filter((entry) => entry.genders.includes(selectedGender));
  }, [entries, selectedGender]);

  return (
    <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
      <Stack.Screen options={{ title: getRoleTitle(role) }} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>{getRoleTitle(role)}</Text>
          <Text style={styles.headerBody}>
            Scroll the list and filter by gender from the top.
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.filterRow}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          <Pressable
            accessibilityRole="button"
            onPress={() => setSelectedGender("all")}
            style={[
              styles.filterChip,
              selectedGender === "all" ? styles.filterChipActive : null,
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedGender === "all" ? styles.filterChipTextActive : null,
              ]}
            >
              All
            </Text>
          </Pressable>

          {PROFESSIONAL_GENDER_OPTIONS.map((option) => {
            const active = selectedGender === option.key;

            return (
              <Pressable
                accessibilityRole="button"
                key={option.key}
                onPress={() => setSelectedGender(option.key)}
                style={[
                  styles.filterChip,
                  active ? styles.filterChipActive : null,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    active ? styles.filterChipTextActive : null,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {isLoading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color="#2563EB" />
          </View>
        ) : filteredEntries.length > 0 ? (
          filteredEntries.map((entry) => (
            <DirectoryCard key={entry.id} entry={entry} role={role} />
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons color="#64748B" name="search-outline" size={20} />
            <Text style={styles.emptyTitle}>No profiles for this gender</Text>
            <Text style={styles.emptyBody}>
              Pick another filter to see more {getRoleTitle(role).toLowerCase()}.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 28,
    gap: 14,
  },
  headerCard: {
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  headerTitle: {
    color: "#0F172A",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  headerBody: {
    marginTop: 6,
    color: "#475569",
    fontSize: 14,
    lineHeight: 20,
  },
  filterRow: {
    gap: 10,
    paddingVertical: 2,
  },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  filterChipActive: {
    borderColor: "#2563EB",
    backgroundColor: "#DBEAFE",
  },
  filterChipText: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "700",
  },
  filterChipTextActive: {
    color: "#1D4ED8",
  },
  loadingCard: {
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    paddingVertical: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E2E8F0",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  cardHeaderCopy: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  nameText: {
    flex: 1,
    color: "#0F172A",
    fontSize: 17,
    fontWeight: "800",
  },
  roleBadge: {
    borderRadius: 999,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  roleBadgeText: {
    color: "#1D4ED8",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metaText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  genderChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  genderChipText: {
    fontSize: 12,
    fontWeight: "700",
  },
  genderChipMuted: {
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  genderChipMutedText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
  },
  savedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  savedBadgeText: {
    color: "#1D4ED8",
    fontSize: 12,
    fontWeight: "700",
  },
  bioText: {
    color: "#334155",
    fontSize: 14,
    lineHeight: 21,
  },
  emptyCard: {
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 28,
    gap: 8,
  },
  emptyTitle: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "800",
  },
  emptyBody: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
});
