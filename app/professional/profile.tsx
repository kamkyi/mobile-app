import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
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
  PROFESSIONAL_GENDER_OPTIONS,
  PROFESSIONAL_ROLE_OPTIONS,
  normalizeProfessionalGenders,
  normalizeProfessionalRoles,
  type ProfessionalGenderKey,
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

function parseIsoDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  const candidate = new Date(year, month - 1, day);

  if (
    candidate.getFullYear() !== year ||
    candidate.getMonth() !== month - 1 ||
    candidate.getDate() !== day
  ) {
    return null;
  }

  return candidate;
}

function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function ProfessionalProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ roles?: string | string[] }>();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { currentProfessionalProfile, isReady, saveProfessionalProfile } =
    useAppData();
  const { width } = useHydratedWindowDimensions();
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [serviceLocation, setServiceLocation] = useState("");
  const [serviceLatitude, setServiceLatitude] = useState<number | undefined>();
  const [serviceLongitude, setServiceLongitude] = useState<number | undefined>();
  const [bio, setBio] = useState("");
  const [selectedGenders, setSelectedGenders] = useState<ProfessionalGenderKey[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const contentWidth = Math.min(width - 28, 640);
  const rolesParam = readQueryParam(params.roles);
  const queriedRoles = normalizeProfessionalRoles(
    rolesParam
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  ).slice(0, MAX_PROFESSIONAL_ROLE_SELECTION);
  const selectedRoles =
    queriedRoles.length > 0
      ? queriedRoles
      : normalizeProfessionalRoles(currentProfessionalProfile?.roles ?? []).slice(
          0,
          MAX_PROFESSIONAL_ROLE_SELECTION,
        );

  useEffect(() => {
    if (!currentProfessionalProfile) {
      return;
    }

    setNickname((currentValue) => currentValue || currentProfessionalProfile.nickname);
    setDateOfBirth(
      (currentValue) => currentValue || currentProfessionalProfile.dateOfBirth,
    );
    setServiceLocation(
      (currentValue) => currentValue || currentProfessionalProfile.serviceLocation || "",
    );
    setServiceLatitude((currentValue) =>
      currentValue ?? currentProfessionalProfile.serviceLatitude,
    );
    setServiceLongitude((currentValue) =>
      currentValue ?? currentProfessionalProfile.serviceLongitude,
    );
    setProfileImageUri(
      (currentValue) => currentValue ?? currentProfessionalProfile.profileImageUri ?? null,
    );
    setBio((currentValue) => currentValue || currentProfessionalProfile.bio || "");
    setSelectedGenders((currentValue) =>
      currentValue.length > 0
        ? currentValue
        : normalizeProfessionalGenders(currentProfessionalProfile.genders ?? []),
    );
  }, [currentProfessionalProfile]);

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (!isReady) {
    return (
      <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
        <View style={styles.loadingState}>
          <ActivityIndicator color="#2563EB" />
        </View>
      </SafeAreaView>
    );
  }

  if (selectedRoles.length === 0) {
    return <Redirect href="/professional" />;
  }

  const trimmedNickname = nickname.trim();
  const trimmedServiceLocation = serviceLocation.trim();
  const trimmedBio = bio.trim();
  const hasValidDateOfBirth = isValidDateOfBirth(dateOfBirth);
  const nicknameError = showErrors && trimmedNickname.length === 0;
  const dateOfBirthError = showErrors && !hasValidDateOfBirth;
  const serviceLocationError = showErrors && trimmedServiceLocation.length === 0;
  const genderError = showErrors && selectedGenders.length === 0;
  const selectedDateOfBirth = parseIsoDate(dateOfBirth) ?? new Date(2000, 0, 1);

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

    if (
      trimmedNickname.length === 0 ||
      !hasValidDateOfBirth ||
      trimmedServiceLocation.length === 0 ||
      selectedGenders.length === 0
    ) {
      return;
    }

    try {
      setIsSaving(true);
      await saveProfessionalProfile({
        roles: selectedRoles,
        genders: selectedGenders,
        nickname: trimmedNickname,
        dateOfBirth,
        serviceLocation: trimmedServiceLocation,
        serviceLatitude,
        serviceLongitude,
        bio: trimmedBio || undefined,
        profileImageUri: profileImageUri ?? undefined,
      });
      router.replace("/(tabs)/profile");
    } catch (error) {
      console.warn("Failed to save professional profile", error);
      Alert.alert(t("professional.saveErrorTitle"), t("professional.saveErrorBody"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenderToggle = (gender: ProfessionalGenderKey) => {
    setSelectedGenders((currentValue) =>
      currentValue.includes(gender)
        ? currentValue.filter((value) => value !== gender)
        : [...currentValue, gender],
    );
  };

  const handleServiceLocationChange = (value: string) => {
    setServiceLocation(value);
    setServiceLatitude(undefined);
    setServiceLongitude(undefined);
  };

  const handleUseCurrentLocation = async () => {
    try {
      setIsLocating(true);
      const permission = await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          t("professional.locationPermissionTitle", {
            defaultValue: "Location access needed",
          }),
          t("professional.locationPermissionBody", {
            defaultValue:
              "Allow location access to use your current service location.",
          }),
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      setServiceLatitude(latitude);
      setServiceLongitude(longitude);

      try {
        const places = await Location.reverseGeocodeAsync({ latitude, longitude });
        const place = places[0];
        const approximateLabel = [place?.district, place?.city, place?.region]
          .filter(Boolean)
          .join(", ");

        setServiceLocation(
          approximateLabel || `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`,
        );
      } catch {
        setServiceLocation(`${latitude.toFixed(3)}, ${longitude.toFixed(3)}`);
      }
    } catch (error) {
      console.warn("Failed to capture current service location", error);
      Alert.alert(
        t("professional.locationLookupTitle", {
          defaultValue: "Could not get current location",
        }),
        t("professional.locationLookupBody", {
          defaultValue: "Try again or type your service location manually.",
        }),
      );
    } finally {
      setIsLocating(false);
    }
  };

  const handleDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    if (event.type !== "set" || !selectedDate) {
      return;
    }

    setDateOfBirth(formatIsoDate(selectedDate));
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

            <Text style={styles.fieldLabel}>
              {t("professional.genderLabel", { defaultValue: "Genders" })}
            </Text>
            <View style={styles.genderGrid}>
              {PROFESSIONAL_GENDER_OPTIONS.map((option) => {
                const active = selectedGenders.includes(option.key);

                return (
                  <Pressable
                    accessibilityRole="button"
                    key={option.key}
                    onPress={() => handleGenderToggle(option.key)}
                    style={({ pressed }) => [
                      styles.genderButton,
                      active
                        ? { backgroundColor: `${option.color}16`, borderColor: option.color }
                        : null,
                      pressed ? styles.secondaryButtonPressed : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.genderButtonText,
                        active ? { color: option.color } : null,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={[styles.fieldHint, genderError ? styles.errorText : null]}>
              {genderError
                ? t("professional.genderRequired", {
                    defaultValue: "Select at least one gender.",
                  })
                : t("professional.genderHint", {
                    defaultValue: "Choose one or more genders for your profile.",
                  })}
            </Text>

            <Text style={styles.fieldLabel}>{t("professional.dobLabel")}</Text>
            {Platform.OS === "web" ? (
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
            ) : (
              <>
                <Pressable
                  accessibilityLabel={t("professional.dobLabel")}
                  accessibilityRole="button"
                  onPress={() => setShowDatePicker(true)}
                  style={({ pressed }) => [
                    styles.dateFieldButton,
                    dateOfBirthError ? styles.textInputError : null,
                    pressed ? styles.secondaryButtonPressed : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.dateFieldValue,
                      !dateOfBirth ? styles.dateFieldPlaceholder : null,
                    ]}
                  >
                    {dateOfBirth || t("professional.dobPlaceholder")}
                  </Text>
                  <Ionicons color="#64748B" name="calendar-outline" size={18} />
                </Pressable>
                {showDatePicker ? (
                  <DateTimePicker
                    display={Platform.OS === "ios" ? "inline" : "default"}
                    maximumDate={new Date()}
                    mode="date"
                    onChange={handleDateChange}
                    value={selectedDateOfBirth}
                  />
                ) : null}
              </>
            )}
            <Text
              style={[styles.fieldHint, dateOfBirthError ? styles.errorText : null]}
            >
              {dateOfBirthError
                ? t("professional.dobInvalid")
                : t("professional.dobHint")}
            </Text>

            <Text style={styles.fieldLabel}>
              {t("professional.serviceLocationLabel", {
                defaultValue: "Service location",
              })}
            </Text>
            <TextInput
              accessibilityLabel={t("professional.serviceLocationLabel", {
                defaultValue: "Service location",
              })}
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={90}
              onChangeText={handleServiceLocationChange}
              placeholder={t("professional.serviceLocationPlaceholder", {
                defaultValue: "Enter service area, city, or district",
              })}
              placeholderTextColor="#94A3B8"
              style={[
                styles.textInput,
                serviceLocationError ? styles.textInputError : null,
              ]}
              value={serviceLocation}
            />
            <Pressable
              accessibilityRole="button"
              disabled={isLocating}
              onPress={handleUseCurrentLocation}
              style={({ pressed }) => [
                styles.locationButton,
                pressed && !isLocating ? styles.secondaryButtonPressed : null,
                isLocating ? styles.locationButtonDisabled : null,
              ]}
            >
              {isLocating ? (
                <ActivityIndicator color="#1D4ED8" />
              ) : (
                <>
                  <Ionicons color="#1D4ED8" name="locate-outline" size={16} />
                  <Text style={styles.locationButtonText}>
                    {t("professional.useCurrentLocation", {
                      defaultValue: "Use current location",
                    })}
                  </Text>
                </>
              )}
            </Pressable>
            <Text
              style={[styles.fieldHint, serviceLocationError ? styles.errorText : null]}
            >
              {serviceLocationError
                ? t("professional.serviceLocationRequired", {
                    defaultValue: "Service location is required.",
                  })
                : t("professional.serviceLocationHint", {
                    defaultValue:
                      "Type an area manually or use your current GPS location.",
                  })}
            </Text>

            <Text style={styles.fieldLabel}>
              {t("professional.bioLabel", { defaultValue: "About" })}
            </Text>
            <TextInput
              accessibilityLabel={t("professional.bioLabel", {
                defaultValue: "About",
              })}
              autoCapitalize="sentences"
              autoCorrect
              maxLength={180}
              multiline
              onChangeText={setBio}
              placeholder={t("professional.bioPlaceholder", {
                defaultValue: "Write a short intro people will see in the list.",
              })}
              placeholderTextColor="#94A3B8"
              style={[styles.textInput, styles.textAreaInput]}
              textAlignVertical="top"
              value={bio}
            />
            <Text style={styles.fieldHint}>
              {t("professional.bioHint", {
                defaultValue: "Keep it short and clear.",
              })}
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
  genderGrid: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  genderButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D7DFEB",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  genderButtonText: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "700",
  },
  locationButton: {
    marginTop: 10,
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  locationButtonDisabled: {
    opacity: 0.75,
  },
  locationButtonText: {
    color: "#1D4ED8",
    fontSize: 13,
    fontWeight: "700",
  },
  dateFieldButton: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D7DFEB",
    backgroundColor: "#F8FAFC",
    marginTop: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  dateFieldValue: {
    color: "#111827",
    fontSize: 14,
    flex: 1,
  },
  dateFieldPlaceholder: {
    color: "#94A3B8",
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
  textAreaInput: {
    minHeight: 110,
    paddingTop: 14,
    paddingBottom: 14,
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
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
