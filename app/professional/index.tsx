import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  MAX_PROFESSIONAL_ROLE_SELECTION,
  PROFESSIONAL_ROLE_OPTIONS,
  type ProfessionalRoleKey,
  normalizeProfessionalRoles,
} from "@/constants/professional";
import { useAppData } from "@/context/AppDataContext";
import { useAuth } from "@/context/AuthContext";
import { useScreenLayout } from "@/hooks/use-screen-layout";

function getRoleColumns(width: number): number {
  if (width >= 900) return 3;
  return 2;
}

export default function ProfessionalRoleScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { currentProfessionalProfile, isReady } = useAppData();
  const [selectedRoles, setSelectedRoles] = useState<ProfessionalRoleKey[]>([]);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [hasInitializedSelection, setHasInitializedSelection] = useState(false);
  const { contentContainerStyle, contentWidth, width } = useScreenLayout({
    bottomPadding: 24,
    maxWidth: 680,
    minHorizontalPadding: 14,
    topPadding: 16,
  });

  const columns = getRoleColumns(width);
  const cardGap = 12;
  const cardWidth = (contentWidth - cardGap * (columns - 1)) / columns;
  const storedRoles = normalizeProfessionalRoles(
    currentProfessionalProfile?.roles ?? [],
  ).slice(0, MAX_PROFESSIONAL_ROLE_SELECTION);

  useEffect(() => {
    if (!isReady || hasInitializedSelection) {
      return;
    }

    setSelectedRoles(storedRoles);
    setHasInitializedSelection(true);
  }, [hasInitializedSelection, isReady, storedRoles]);

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  const handleRolePress = (roleKey: ProfessionalRoleKey) => {
    setSelectedRoles((currentRoles) => {
      if (currentRoles.includes(roleKey)) {
        setIsLimitReached(false);
        return currentRoles.filter((currentRole) => currentRole !== roleKey);
      }

      if (currentRoles.length >= MAX_PROFESSIONAL_ROLE_SELECTION) {
        setIsLimitReached(true);
        return currentRoles;
      }

      setIsLimitReached(false);
      return [...currentRoles, roleKey];
    });
  };

  const handleNext = () => {
    if (selectedRoles.length === 0) {
      return;
    }

    router.push(`/professional/profile?roles=${selectedRoles.join(",")}`);
  };

  return (
    <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          bounces={false}
          contentContainerStyle={contentContainerStyle}
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={["#0A2540", "#1A3F6B", "#3B82F6"]}
            end={{ x: 1, y: 1 }}
            start={{ x: 0, y: 0 }}
            style={styles.heroCard}
          >
            <Text style={styles.heroEyebrow}>{t("professional.roleEyebrow")}</Text>
            <Text style={styles.heroTitle}>{t("professional.roleTitle")}</Text>
            <Text style={styles.heroBody}>{t("professional.roleSubtitle")}</Text>

            <View style={styles.counterRow}>
              <View style={styles.counterBadge}>
                <Text style={styles.counterText}>
                  {t("professional.selectionCount", {
                    count: selectedRoles.length,
                    max: MAX_PROFESSIONAL_ROLE_SELECTION,
                  })}
                </Text>
              </View>
              <Text
                style={[
                  styles.counterHint,
                  isLimitReached ? styles.counterHintWarning : null,
                ]}
              >
                {isLimitReached
                  ? t("professional.selectionLimitReached")
                  : t("professional.selectionHint")}
              </Text>
            </View>
          </LinearGradient>

          <View style={styles.roleGrid}>
            {PROFESSIONAL_ROLE_OPTIONS.map((option) => {
              const selected = selectedRoles.includes(option.key);

              return (
                <Pressable
                  accessibilityLabel={t(option.titleKey)}
                  accessibilityRole="button"
                  key={option.key}
                  onPress={() => handleRolePress(option.key)}
                  style={({ pressed }) => [
                    styles.roleCard,
                    {
                      width: cardWidth,
                      borderColor: selected
                        ? `${option.color}88`
                        : "rgba(148,163,184,0.18)",
                      backgroundColor: selected ? `${option.color}12` : "#FFFFFF",
                    },
                    pressed ? styles.roleCardPressed : null,
                  ]}
                >
                  <View style={styles.roleCardTop}>
                    <View
                      style={[
                        styles.roleIconWrap,
                        { backgroundColor: `${option.color}20` },
                      ]}
                    >
                      <Ionicons color={option.color} name={option.iconName} size={20} />
                    </View>
                    {selected ? (
                      <View
                        style={[
                          styles.roleCheck,
                          { backgroundColor: option.color },
                        ]}
                      >
                        <Ionicons color="#FFFFFF" name="checkmark" size={14} />
                      </View>
                    ) : null}
                  </View>

                  <Text style={styles.roleTitleText}>{t(option.titleKey)}</Text>
                  <Text style={styles.roleDescriptionText}>
                    {t(option.descriptionKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            accessibilityLabel={t("professional.nextAction")}
            accessibilityRole="button"
            disabled={selectedRoles.length === 0}
            onPress={handleNext}
            style={({ pressed }) => [
              styles.nextButton,
              selectedRoles.length === 0 ? styles.nextButtonDisabled : null,
              pressed && selectedRoles.length > 0 ? styles.nextButtonPressed : null,
            ]}
          >
            <Text style={styles.nextButtonText}>{t("professional.nextAction")}</Text>
            <Ionicons color="#FFFFFF" name="arrow-forward" size={18} />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F3F7FB",
  },
  container: {
    flex: 1,
  },
  heroCard: {
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 20,
    shadowColor: "#0A2540",
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 5,
  },
  heroEyebrow: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  heroTitle: {
    marginTop: 8,
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "800",
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  heroBody: {
    marginTop: 10,
    color: "rgba(255,255,255,0.84)",
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 520,
  },
  counterRow: {
    marginTop: 18,
    gap: 8,
  },
  counterBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.16)",
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  counterText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  counterHint: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12.5,
    lineHeight: 18,
  },
  counterHintWarning: {
    color: "#FDE68A",
  },
  roleGrid: {
    marginTop: 18,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  roleCard: {
    minHeight: 152,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 16,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 2,
  },
  roleCardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  roleCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  roleIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  roleCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  roleTitleText: {
    marginTop: 18,
    color: "#111827",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  roleDescriptionText: {
    marginTop: 6,
    color: "#64748B",
    fontSize: 12.5,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: "#F3F7FB",
  },
  nextButton: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: "#2563EB",
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#1D4ED8",
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 4,
  },
  nextButtonDisabled: {
    backgroundColor: "#93C5FD",
    shadowOpacity: 0,
    elevation: 0,
  },
  nextButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
