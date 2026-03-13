import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  MAX_PROFESSIONAL_ROLE_SELECTION,
  PROFESSIONAL_ROLE_OPTIONS,
  normalizeProfessionalRoles,
} from "@/constants/professional";
import { useAppData } from "@/context/AppDataContext";
import { useAuth } from "@/context/AuthContext";
import { useHydratedWindowDimensions } from "@/hooks/use-hydrated-window-dimensions";

function readQueryParam(value?: string | string[]): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function formatDateOfBirthInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  const year = digits.slice(0, 4);
  const month = digits.slice(4, 6);
  const day = digits.slice(6, 8);

  return [year, month, day].filter(Boolean).join("-");
}

function isValidDateOfBirth(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const candidate = new Date(Date.UTC(year, month - 1, day));

  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month - 1 ||
    candidate.getUTCDate() !== day
  ) {
    return false;
  }

  return candidate.getTime() <= Date.now();
}

export default function ProfessionalProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ roles?: string | string[] }>();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { currentProfessionalProfile, saveProfessionalProfile } = useAppData();
  const { width } = useHydratedWindowDimensions();
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const contentWidth = Math.min(width - 28, 640);
  const rolesParam = readQueryParam(params.roles);
  const selectedRoles = normalizeProfessionalRoles(
    rolesParam
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  ).slice(0, MAX_PROFESSIONAL_ROLE_SELECTION);

  useEffect(() => {
    if (!currentProfessionalProfile) {
      return;
    }

    setNickname((currentValue) => currentValue || currentProfessionalProfile.nickname);
    setDateOfBirth(
      (currentValue) => currentValue || currentProfessionalProfile.dateOfBirth,
    );
    setProfileImageUri(
      (currentValue) => currentValue ?? currentProfessionalProfile.profileImageUri ?? null,
    );
  }, [currentProfessionalProfile]);

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (selectedRoles.length === 0) {
    return <Redirect href="/professional" />;
  }

  const trimmedNickname = nickname.trim();
  const hasValidDateOfBirth = isValidDateOfBirth(dateOfBirth);
  const nicknameError = showErrors && trimmedNickname.length === 0;
  const dateOfBirthError = showErrors && !hasValidDateOfBirth;

  const handlePickImage = async () => {
    if (Platform.OS !== "web") {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          t("professional.photoPermissionTitle"),
          t("professional.photoPermissionBody"),
        );
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.4,
      base64: true,
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    const asset = result.assets[0];
    const nextUri = asset.base64
      ? `data:${asset.mimeType ?? "image/jpeg"};base64,${asset.base64}`
      : asset.uri;

    setProfileImageUri(nextUri);
  };

  const handleSave = async () => {
    setShowErrors(true);

    if (trimmedNickname.length === 0 || !hasValidDateOfBirth) {
      return;
    }

    try {
      setIsSaving(true);
      await saveProfessionalProfile({
        roles: selectedRoles,
        nickname: trimmedNickname,
        dateOfBirth,
        profileImageUri: profileImageUri ?? undefined,
      });
      router.replace("/");
    } catch (error) {
      console.warn("Failed to save professional profile", error);
      Alert.alert(t("professional.saveErrorTitle"), t("professional.saveErrorBody"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          bounces={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: Math.max(14, (width - contentWidth) / 2) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={["#0F172A", "#1E3A8A", "#2563EB"]}
            end={{ x: 1, y: 1 }}
            start={{ x: 0, y: 0 }}
            style={styles.heroCard}
          >
            <Text style={styles.heroEyebrow}>{t("professional.profileEyebrow")}</Text>
            <Text style={styles.heroTitle}>{t("professional.profileTitle")}</Text>
            <Text style={styles.heroBody}>{t("professional.profileSubtitle")}</Text>

            <View style={styles.roleChipWrap}>
              {selectedRoles.map((roleKey) => {
                const role = PROFESSIONAL_ROLE_OPTIONS.find(
                  (option) => option.key === roleKey,
                );

                if (!role) {
                  return null;
                }

                return (
                  <View key={roleKey} style={styles.roleChip}>
                    <Ionicons color="#FFFFFF" name={role.iconName} size={13} />
                    <Text style={styles.roleChipText}>{t(role.titleKey)}</Text>
                  </View>
                );
              })}
            </View>
          </LinearGradient>

          <View style={styles.formCard}>
            <Text style={styles.fieldLabel}>{t("professional.photoLabel")}</Text>
            <View style={styles.photoRow}>
              <View style={styles.photoPreview}>
                {profileImageUri ? (
                  <Image
                    source={{ uri: profileImageUri }}
                    style={styles.photoImage}
                    contentFit="cover"
                    transition={180}
                  />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Ionicons color="#3B82F6" name="image-outline" size={28} />
                  </View>
                )}
              </View>

              <View style={styles.photoActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={handlePickImage}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    pressed ? styles.secondaryButtonPressed : null,
                  ]}
                >
                  <Text style={styles.secondaryButtonText}>
                    {profileImageUri
                      ? t("professional.changePhoto")
                      : t("professional.pickPhoto")}
                  </Text>
                </Pressable>

                {profileImageUri ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setProfileImageUri(null)}
                    style={({ pressed }) => [
                      styles.tertiaryButton,
                      pressed ? styles.secondaryButtonPressed : null,
                    ]}
                  >
                    <Text style={styles.tertiaryButtonText}>
                      {t("professional.removePhoto")}
                    </Text>
                  </Pressable>
                ) : null}

                <Text style={styles.fieldHint}>{t("professional.photoHint")}</Text>
              </View>
            </View>

            <Text style={styles.fieldLabel}>{t("professional.nicknameLabel")}</Text>
            <TextInput
              accessibilityLabel={t("professional.nicknameLabel")}
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={32}
              onChangeText={setNickname}
              placeholder={t("professional.nicknamePlaceholder")}
              placeholderTextColor="#94A3B8"
              style={[
                styles.textInput,
                nicknameError ? styles.textInputError : null,
              ]}
              value={nickname}
            />
            {nicknameError ? (
              <Text style={styles.errorText}>{t("professional.nicknameRequired")}</Text>
            ) : null}

            <Text style={styles.fieldLabel}>{t("professional.dobLabel")}</Text>
            <TextInput
              accessibilityLabel={t("professional.dobLabel")}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="number-pad"
              maxLength={10}
              onChangeText={(value) => setDateOfBirth(formatDateOfBirthInput(value))}
              placeholder={t("professional.dobPlaceholder")}
              placeholderTextColor="#94A3B8"
              style={[
                styles.textInput,
                dateOfBirthError ? styles.textInputError : null,
              ]}
              value={dateOfBirth}
            />
            <Text
              style={[styles.fieldHint, dateOfBirthError ? styles.errorText : null]}
            >
              {dateOfBirthError
                ? t("professional.dobInvalid")
                : t("professional.dobHint")}
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            accessibilityLabel={t("professional.saveAction")}
            accessibilityRole="button"
            disabled={isSaving}
            onPress={handleSave}
            style={({ pressed }) => [
              styles.saveButton,
              pressed && !isSaving ? styles.saveButtonPressed : null,
              isSaving ? styles.saveButtonDisabled : null,
            ]}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.saveButtonText}>{t("professional.saveAction")}</Text>
                <Ionicons color="#FFFFFF" name="checkmark-circle-outline" size={18} />
              </>
            )}
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
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  heroCard: {
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 20,
    shadowColor: "#0F172A",
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 5,
  },
  heroEyebrow: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  heroTitle: {
    marginTop: 8,
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 31,
    letterSpacing: -0.4,
  },
  heroBody: {
    marginTop: 10,
    color: "rgba(255,255,255,0.84)",
    fontSize: 14,
    lineHeight: 21,
  },
  roleChipWrap: {
    marginTop: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  roleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.16)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  roleChipText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  formCard: {
    marginTop: 18,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 18,
    shadowColor: "#0F172A",
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 3,
  },
  fieldLabel: {
    marginTop: 12,
    color: "#111827",
    fontSize: 13,
    fontWeight: "700",
  },
  photoRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  photoPreview: {
    width: 92,
    height: 92,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#EFF6FF",
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.18)",
    borderStyle: "dashed",
    borderRadius: 28,
  },
  photoActions: {
    flex: 1,
    gap: 10,
  },
  secondaryButton: {
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  secondaryButtonText: {
    color: "#1D4ED8",
    fontSize: 13,
    fontWeight: "700",
  },
  tertiaryButton: {
    alignSelf: "flex-start",
    paddingVertical: 2,
  },
  tertiaryButtonText: {
    color: "#64748B",
    fontSize: 12.5,
    fontWeight: "600",
  },
  fieldHint: {
    color: "#64748B",
    fontSize: 12,
    lineHeight: 18,
  },
  textInput: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D7DFEB",
    backgroundColor: "#F8FAFC",
    marginTop: 10,
    paddingHorizontal: 14,
    color: "#111827",
    fontSize: 14,
  },
  textInputError: {
    borderColor: "#DC2626",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
    marginTop: 6,
  },
  footer: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: "#F3F7FB",
  },
  saveButton: {
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
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
