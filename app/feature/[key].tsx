import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import {
  Redirect,
  Stack,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  type TextStyle,
  TextInput,
  View,
  type ViewStyle,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Calendar, type DateData } from "react-native-calendars";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FeatureIcon } from "@/components/ui/feature-icon";
import FeatureShowcaseScreen from "@/components/screens/FeatureShowcaseScreen";
import NearbyScreen from "@/components/screens/NearbyScreen";
import ProfessionalDirectoryScreen from "@/components/screens/ProfessionalDirectoryScreen";
import {
  CAR_BRANDS,
  CAR_RENTAL_ITEMS,
  THAILAND_LOCATIONS,
  type CarBrand,
  type CarRentalItem,
  type ThaiLocation,
} from "@/constants/car-rental";
import { FEATURE_MAP } from "@/constants/pages";
import { Brand, Radius, Spacing } from "@/constants/theme";
import { useAppData } from "@/context/AppDataContext";
import { useAuth } from "@/context/AuthContext";
import { useHydratedWindowDimensions } from "@/hooks/use-hydrated-window-dimensions";
import { getAppLocaleTag, resolveAppLanguage } from "@/i18n";

type PriceFilter = {
  key: "any" | "upTo1200" | "upTo1800" | "upTo2500";
  value: number | null;
};

const PRICE_FILTERS: PriceFilter[] = [
  { key: "any", value: null },
  { key: "upTo1200", value: 1200 },
  { key: "upTo1800", value: 1800 },
  { key: "upTo2500", value: 2500 },
];

const CYCLE_LENGTH_OPTIONS = [26, 28, 30] as const;
const PERIOD_LENGTH_OPTIONS = [4, 5, 6] as const;

const ALL_LOCATIONS = "All Thailand";
const ALL_BRANDS = "All Brands";

type FlowPhase = "fertile" | "period" | "upcoming";
type FlowSelectionMode = "start" | "end";

type CalendarMark = {
  customStyles: {
    container?: ViewStyle;
    text?: TextStyle;
  };
};

/*
 * Extraction hints for i18next-parser.
 * t('features.items.nearby')
 * t('features.items.dating')
 * t('features.items.visit')
 * t('features.items.food')
 * t('features.items.delivery')
 * t('features.items.doctor')
 * t('features.items.beauty')
 * t('features.items.fitness')
 * t('features.items.shopping')
 * t('features.items.travel')
 * t('features.items.support')
 * t('feature.carRental.priceFilters.any')
 * t('feature.carRental.priceFilters.upTo1200')
 * t('feature.carRental.priceFilters.upTo1800')
 * t('feature.carRental.priceFilters.upTo2500')
 * t('feature.flow.activePhases.period')
 * t('feature.flow.activePhases.fertile')
 * t('feature.flow.activePhases.upcoming')
 */

function parseIsoDay(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  const utc = Date.UTC(year, month - 1, day);
  const parsed = new Date(utc);

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return Math.floor(utc / 86_400_000);
}

function isWithinAvailability(
  targetDay: number,
  fromIso: string,
  toIso: string,
): boolean {
  const fromDay = parseIsoDay(fromIso);
  const toDay = parseIsoDay(toIso);

  if (fromDay === null || toDay === null) {
    return true;
  }

  return targetDay >= fromDay && targetDay <= toDay;
}

function formatTHB(value: number): string {
  return `THB ${value.toLocaleString("en-US")}`;
}

function getTodayIsoDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = `${today.getMonth() + 1}`.padStart(2, "0");
  const day = `${today.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isoFromDay(day: number): string {
  return new Date(day * 86_400_000).toISOString().slice(0, 10);
}

function addDaysToIso(iso: string, offset: number): string {
  const day = parseIsoDay(iso);
  return day === null ? iso : isoFromDay(day + offset);
}

function diffInDays(fromIso: string, toIso: string): number {
  const fromDay = parseIsoDay(fromIso);
  const toDay = parseIsoDay(toIso);

  if (fromDay === null || toDay === null) {
    return 0;
  }

  return toDay - fromDay;
}

function formatIsoDate(iso: string, localeTag: string): string {
  const day = parseIsoDay(iso);

  if (day === null) {
    return iso;
  }

  return new Intl.DateTimeFormat(localeTag, {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(day * 86_400_000));
}

function parseIsoDateToLocalDate(value: string): Date | null {
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

function formatLocalDateToIso(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function setCalendarMark(
  marks: Record<string, CalendarMark>,
  date: string,
  container: ViewStyle,
  text: TextStyle,
) {
  const current = marks[date]?.customStyles;

  marks[date] = {
    customStyles: {
      container: { ...current?.container, ...container },
      text: { ...current?.text, ...text },
    },
  };
}

function FilterChip({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.filterChip,
        active ? styles.filterChipActive : null,
        pressed ? styles.filterChipPressed : null,
      ]}
    >
      <Text
        style={[
          styles.filterChipText,
          active ? styles.filterChipTextActive : null,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function FlowStatCard({
  accent,
  label,
  value,
}: {
  accent: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.flowStatCard}>
      <View style={[styles.flowStatAccent, { backgroundColor: accent }]} />
      <Text style={styles.flowStatLabel}>{label}</Text>
      <Text style={styles.flowStatValue}>{value}</Text>
    </View>
  );
}

function FlowLegendItem({
  color,
  label,
  outlined = false,
}: {
  color: string;
  label: string;
  outlined?: boolean;
}) {
  return (
    <View style={styles.flowLegendItem}>
      <View
        style={[
          styles.flowLegendSwatch,
          { backgroundColor: color },
          outlined ? styles.flowLegendSwatchOutline : null,
        ]}
      />
      <Text style={styles.flowLegendLabel}>{label}</Text>
    </View>
  );
}

function CarCard({ car }: { car: CarRentalItem }) {
  const { t } = useTranslation();

  return (
    <View style={styles.carCard}>
      <View style={styles.carBanner}>
        <Image
          accessibilityLabel={car.name}
          resizeMode="cover"
          source={{ uri: car.imageUrl }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={[`${car.gradient[0]}CC`, `${car.gradient[1]}80`]}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.bannerBadge}>
          <Ionicons color="#FFFFFF" name="location-outline" size={12} />
          <Text style={styles.bannerBadgeText}>{car.location}</Text>
        </View>
      </View>

      <View style={styles.carBody}>
        <View style={styles.carHeader}>
          <View style={styles.carHeaderTextWrap}>
            <Text style={styles.carName}>{car.name}</Text>
            <Text style={styles.carMeta}>
              {car.brand} · {car.transmission} ·{" "}
              {t("feature.carRental.seats", { count: car.seats })}
            </Text>
          </View>
          <View style={styles.ratingPill}>
            <Ionicons color="#F59E0B" name="star" size={12} />
            <Text style={styles.ratingText}>{car.rating.toFixed(1)}</Text>
          </View>
        </View>

        <View style={styles.specRow}>
          <View style={styles.specTag}>
            <Ionicons color={Brand.accent} name="flash-outline" size={12} />
            <Text style={styles.specTagText}>{car.fuel}</Text>
          </View>
          <View style={styles.specTag}>
            <Ionicons color={Brand.accent} name="car-outline" size={12} />
            <Text style={styles.specTagText}>
              {t("feature.carRental.trips", { count: car.trips })}
            </Text>
          </View>
        </View>

        <View style={styles.availabilityRow}>
          <Ionicons
            color={Brand.textSecondary}
            name="calendar-outline"
            size={13}
          />
          <Text style={styles.availabilityText}>
            {t("feature.carRental.availableRange", {
              from: car.availableFrom,
              to: car.availableTo,
            })}
          </Text>
        </View>

        <View style={styles.priceRow}>
          <View>
            <Text style={styles.priceText}>
              {formatTHB(car.pricePerDayTHB)}
            </Text>
            <Text style={styles.perDayText}>{t("feature.carRental.perDay")}</Text>
          </View>

          <Pressable
            accessibilityLabel={t("feature.carRental.bookCarA11y", {
              name: car.name,
            })}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.bookButton,
              pressed ? styles.bookButtonPressed : null,
            ]}
          >
            <Text style={styles.bookButtonText}>{t("feature.carRental.bookNow")}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function FeatureScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ key?: string }>();
  const { width } = useHydratedWindowDimensions();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const { isReady: isAppDataReady, loadFlowCycles, saveFlowRecord } = useAppData();
  const { t, i18n } = useTranslation();

  const horizontalPadding = width < 380 ? 12 : 16;
  const contentWidth = Math.min(width - horizontalPadding * 2, 760);
  const todayIso = getTodayIsoDate();

  const feature = useMemo(() => {
    if (!params.key) {
      return null;
    }

    return FEATURE_MAP[params.key] ?? null;
  }, [params.key]);

  const [pickupDateInput, setPickupDateInput] = useState("");
  const [showPickupDatePicker, setShowPickupDatePicker] = useState(false);
  const [selectedMaxPrice, setSelectedMaxPrice] = useState<number | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<
    ThaiLocation | typeof ALL_LOCATIONS
  >(ALL_LOCATIONS);
  const [selectedBrand, setSelectedBrand] = useState<
    CarBrand | typeof ALL_BRANDS
  >(ALL_BRANDS);
  const [activeFlowSelection, setActiveFlowSelection] =
    useState<FlowSelectionMode>("start");
  const [flowRecordId, setFlowRecordId] = useState<string | undefined>();
  const [flowStartDate, setFlowStartDate] = useState(() => addDaysToIso(todayIso, -4));
  const [flowEndDate, setFlowEndDate] = useState(() => todayIso);
  const [cycleLength, setCycleLength] =
    useState<(typeof CYCLE_LENGTH_OPTIONS)[number]>(28);
  const [periodLength, setPeriodLength] = useState(5);
  const [flowHistory, setFlowHistory] = useState<
    {
      id: string;
      startDate: string;
      endDate: string;
      cycleLength: number;
      periodLength: number;
      updatedAt: string;
    }[]
  >([]);
  const [isFlowLoading, setIsFlowLoading] = useState(false);
  const [isFlowSaving, setIsFlowSaving] = useState(false);
  const [flowToast, setFlowToast] = useState<{
    kind: "error" | "success";
    message: string;
  } | null>(null);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const pickupDate = pickupDateInput.trim();
  const selectedPickupDate = parseIsoDateToLocalDate(pickupDateInput) ?? new Date();
  const pickupDay = useMemo(() => parseIsoDay(pickupDate), [pickupDate]);
  const isDateInvalid = pickupDate.length > 0 && pickupDay === null;
  const isCarRental = params.key === "car-rental";
  const isFlow = params.key === "flow";
  const isNearby = params.key === "nearby";
  const directoryRole =
    params.key === "doctor" ? "doctor" : params.key === "dating" ? "dater" : null;
  const showcaseFeature =
    params.key === "beauty" ||
    params.key === "fitness" ||
    params.key === "visit" ||
    params.key === "food"
      ? params.key
      : null;
  const activeLanguage = resolveAppLanguage(
    i18n.resolvedLanguage ?? i18n.language,
  );
  const localeTag = getAppLocaleTag(activeLanguage);
  const shouldRedirectToLogin =
    hasMounted && Boolean(feature?.requiresAuth) && !isAuthenticated;
  const featureTitle = params.key
    ? t(`features.items.${params.key}`, {
        defaultValue: feature?.label ?? t("feature.defaultTitle"),
      })
    : t("feature.defaultTitle");

  const filteredCars = useMemo(() => {
    if (!isCarRental) {
      return [];
    }

    return CAR_RENTAL_ITEMS.filter((car) => {
      if (
        selectedLocation !== ALL_LOCATIONS &&
        car.location !== selectedLocation
      ) {
        return false;
      }

      if (selectedBrand !== ALL_BRANDS && car.brand !== selectedBrand) {
        return false;
      }

      if (selectedMaxPrice !== null && car.pricePerDayTHB > selectedMaxPrice) {
        return false;
      }

      if (pickupDay !== null) {
        return isWithinAvailability(
          pickupDay,
          car.availableFrom,
          car.availableTo,
        );
      }

      return true;
    }).sort((a, b) => a.pricePerDayTHB - b.pricePerDayTHB);
  }, [
    isCarRental,
    pickupDay,
    selectedBrand,
    selectedLocation,
    selectedMaxPrice,
  ]);

  const resetFilters = useCallback(() => {
    setPickupDateInput("");
    setShowPickupDatePicker(false);
    setSelectedMaxPrice(null);
    setSelectedLocation(ALL_LOCATIONS);
    setSelectedBrand(ALL_BRANDS);
  }, []);

  const handlePickupDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    if (Platform.OS === "android") {
      setShowPickupDatePicker(false);
    }

    if (event.type !== "set" || !selectedDate) {
      return;
    }

    setPickupDateInput(formatLocalDateToIso(selectedDate));
  };

  const handleFlowCalendarPress = useCallback(
    (day: DateData) => {
      setFlowToast(null);

      if (activeFlowSelection === "start") {
        setFlowStartDate(day.dateString);
        if (diffInDays(day.dateString, flowEndDate) < 0) {
          setFlowEndDate(day.dateString);
          setPeriodLength(1);
        } else {
          setPeriodLength(diffInDays(day.dateString, flowEndDate) + 1);
        }
        return;
      }

      const nextEndDate =
        diffInDays(flowStartDate, day.dateString) < 0
          ? flowStartDate
          : day.dateString;

      setFlowEndDate(nextEndDate);
      setPeriodLength(diffInDays(flowStartDate, nextEndDate) + 1);
    },
    [activeFlowSelection, flowEndDate, flowStartDate],
  );

  const handlePeriodLengthPress = useCallback((option: (typeof PERIOD_LENGTH_OPTIONS)[number]) => {
    setFlowToast(null);
    setPeriodLength(option);
    setFlowEndDate(addDaysToIso(flowStartDate, option - 1));
  }, [flowStartDate]);

  const handleSaveFlow = useCallback(async () => {
    setIsFlowSaving(true);
    setFlowToast(null);

    try {
      const savedRecord = await saveFlowRecord({
        id: flowRecordId,
        startDate: flowStartDate,
        endDate: flowEndDate,
        cycleLength,
        periodLength,
      });

      setFlowRecordId(savedRecord.id);
      setFlowToast({
        kind: "success",
        message: t("feature.flow.savedMessage"),
      });

      const cycles = await loadFlowCycles();
      setFlowHistory(cycles);
    } catch (error) {
      console.warn("Failed to save flow cycle", error);
      setFlowToast({
        kind: "error",
        message: t("feature.flow.saveError"),
      });
    } finally {
      setIsFlowSaving(false);
    }
  }, [
    cycleLength,
    flowEndDate,
    flowRecordId,
    flowStartDate,
    loadFlowCycles,
    periodLength,
    saveFlowRecord,
    t,
  ]);

  useEffect(() => {
    if (!isFlow || !isAppDataReady || !isAuthenticated) {
      return;
    }

    let isMounted = true;

    const hydrateFlow = async () => {
      setIsFlowLoading(true);
      setFlowToast(null);

      try {
        const cycles = await loadFlowCycles();

        if (!isMounted) {
          return;
        }

        setFlowHistory(cycles);

        const latest = cycles[0];
        if (!latest) {
          setFlowRecordId(undefined);
          setFlowStartDate(addDaysToIso(todayIso, -4));
          setFlowEndDate(todayIso);
          setCycleLength(28);
          setPeriodLength(5);
          return;
        }

        setFlowRecordId(latest.id);
        setFlowStartDate(latest.startDate);
        setFlowEndDate(latest.endDate);
        setCycleLength(
          CYCLE_LENGTH_OPTIONS.includes(
            latest.cycleLength as (typeof CYCLE_LENGTH_OPTIONS)[number],
          )
            ? (latest.cycleLength as (typeof CYCLE_LENGTH_OPTIONS)[number])
            : 28,
        );
        setPeriodLength(latest.periodLength);
      } catch (error) {
        console.warn("Failed to load flow data", error);
      } finally {
        if (isMounted) {
          setIsFlowLoading(false);
        }
      }
    };

    void hydrateFlow();

    return () => {
      isMounted = false;
    };
  }, [isAppDataReady, isAuthenticated, isFlow, loadFlowCycles, todayIso]);

  useEffect(() => {
    if (!flowToast) {
      return;
    }

    const timer = setTimeout(() => {
      setFlowToast(null);
    }, 2600);

    return () => clearTimeout(timer);
  }, [flowToast]);

  const flowStartDay = parseIsoDay(flowStartDate) ?? parseIsoDay(todayIso) ?? 0;
  const todayDay = parseIsoDay(todayIso) ?? flowStartDay;
  const nextPeriodDate = isoFromDay(flowStartDay + cycleLength);
  const fertileStartDate = isoFromDay(flowStartDay + cycleLength - 19);
  const ovulationDate = isoFromDay(flowStartDay + cycleLength - 14);
  const fertileEndDate = isoFromDay(flowStartDay + cycleLength - 13);
  const cycleDay = ((todayDay - flowStartDay) % cycleLength + cycleLength) % cycleLength + 1;
  const activePhase: FlowPhase =
    todayDay >= flowStartDay && todayDay < flowStartDay + periodLength
      ? "period"
      : todayDay >= flowStartDay + cycleLength - 19 &&
          todayDay <= flowStartDay + cycleLength - 13
        ? "fertile"
        : "upcoming";

  const flowMarkedDates = useMemo(() => {
    const marks: Record<string, CalendarMark> = {};

    for (let offset = 0; offset < periodLength; offset += 1) {
      setCalendarMark(
        marks,
        isoFromDay(flowStartDay + offset),
        { backgroundColor: "#FEE2E2", borderRadius: 12 },
        { color: "#BE123C", fontWeight: "700" },
      );
    }

    for (let offset = 0; offset <= 6; offset += 1) {
      setCalendarMark(
        marks,
        isoFromDay(flowStartDay + cycleLength - 19 + offset),
        { backgroundColor: "#FCE7F3", borderRadius: 12 },
        { color: "#9D174D", fontWeight: "700" },
      );
    }

    setCalendarMark(
      marks,
      ovulationDate,
      {
        backgroundColor: "#FBCFE8",
        borderColor: "#E11D48",
        borderRadius: 12,
        borderWidth: 1.5,
      },
      { color: "#881337", fontWeight: "800" },
    );

    setCalendarMark(
      marks,
      flowStartDate,
      {
        borderColor: Brand.primary,
        borderRadius: 12,
        borderWidth: 2,
      },
      { color: "#881337", fontWeight: "800" },
    );

    setCalendarMark(
      marks,
      flowEndDate,
      {
        borderColor: "#BE123C",
        borderRadius: 12,
        borderWidth: 2,
      },
      { color: "#881337", fontWeight: "800" },
    );

    return marks;
  }, [
    cycleLength,
    flowEndDate,
    flowStartDate,
    flowStartDay,
    ovulationDate,
    periodLength,
  ]);

  if (shouldRedirectToLogin) {
    return <Redirect href="/login" />;
  }

  if (directoryRole) {
    return <ProfessionalDirectoryScreen role={directoryRole} />;
  }

  if (isNearby) {
    return <NearbyScreen />;
  }

  if (showcaseFeature) {
    return <FeatureShowcaseScreen featureKey={showcaseFeature} />;
  }

  if (isCarRental) {
    return (
      <View
        style={[
          styles.container,
          {
            paddingTop: Math.max(14, insets.top + 6),
            paddingBottom: Math.max(14, insets.bottom + 8),
            paddingHorizontal: horizontalPadding,
          },
        ]}
      >
        <Stack.Screen options={{ title: t("features.items.car-rental") }} />

        <LinearGradient
          colors={["#EAF1FF", "#F7FAFF"]}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={StyleSheet.absoluteFill}
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.heroCard, { width: contentWidth }]}>
            <LinearGradient
              colors={["#0A2540", "#1A3F6B"]}
              end={{ x: 1, y: 1 }}
              start={{ x: 0, y: 0 }}
              style={styles.heroGradient}
            >
              <View style={styles.heroTopRow}>
                <View style={styles.heroTag}>
                  <Ionicons
                    color="#FFFFFF"
                    name="car-sport-outline"
                    size={12}
                  />
                  <Text style={styles.heroTagText}>
                    {t("feature.carRental.heroTag")}
                  </Text>
                </View>
                <Text style={styles.heroCount}>
                  {t("feature.carRental.heroCount", { count: filteredCars.length })}
                </Text>
              </View>

              <Text style={styles.heroTitle}>{t("feature.carRental.heroTitle")}</Text>
              <Text style={styles.heroSubtitle}>
                {t("feature.carRental.heroSubtitle")}
              </Text>
            </LinearGradient>
          </View>

          <View style={[styles.filterPanel, { width: contentWidth }]}>
            <View style={styles.filterHeaderRow}>
              <Text style={styles.filterTitle}>{t("feature.carRental.filtersTitle")}</Text>
              <Pressable onPress={resetFilters} style={styles.resetButton}>
                <Text style={styles.resetButtonText}>
                  {t("feature.carRental.resetAll")}
                </Text>
              </Pressable>
            </View>

            <Text style={styles.filterLabel}>
              {t("feature.carRental.pickupDateLabel")}
            </Text>
            {Platform.OS === "web" ? (
              <TextInput
                accessibilityLabel={t("feature.carRental.pickupDateA11y")}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="numbers-and-punctuation"
                onChangeText={setPickupDateInput}
                placeholder={t("feature.carRental.pickupDatePlaceholder")}
                placeholderTextColor="#94A3B8"
                style={[
                  styles.dateInput,
                  isDateInvalid ? styles.dateInputInvalid : null,
                ]}
                value={pickupDateInput}
              />
            ) : (
              <>
                <Pressable
                  accessibilityLabel={t("feature.carRental.pickupDateA11y")}
                  accessibilityRole="button"
                  onPress={() => setShowPickupDatePicker(true)}
                  style={({ pressed }) => [
                    styles.dateInput,
                    styles.nativeDateButton,
                    isDateInvalid ? styles.dateInputInvalid : null,
                    pressed ? styles.filterChipPressed : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.nativeDateValue,
                      !pickupDateInput ? styles.nativeDatePlaceholder : null,
                    ]}
                  >
                    {pickupDateInput || t("feature.carRental.pickupDatePlaceholder")}
                  </Text>
                  <Ionicons color="#64748B" name="calendar-outline" size={18} />
                </Pressable>
                {showPickupDatePicker ? (
                  <DateTimePicker
                    display={Platform.OS === "ios" ? "inline" : "default"}
                    mode="date"
                    onChange={handlePickupDateChange}
                    value={selectedPickupDate}
                  />
                ) : null}
              </>
            )}
            <Text
              style={[
                styles.filterHint,
                isDateInvalid ? styles.filterError : null,
              ]}
            >
              {isDateInvalid
                ? t("feature.carRental.invalidDateHint")
                : t("feature.carRental.validDateHint")}
            </Text>

            <Text style={styles.filterLabel}>
              {t("feature.carRental.pricePerDayLabel")}
            </Text>
            <View style={styles.filterChipWrap}>
              {PRICE_FILTERS.map((option) => (
                <FilterChip
                  active={selectedMaxPrice === option.value}
                  key={option.key}
                  label={t(`feature.carRental.priceFilters.${option.key}`)}
                  onPress={() => setSelectedMaxPrice(option.value)}
                />
              ))}
            </View>

            <Text style={styles.filterLabel}>
              {t("feature.carRental.locationLabel")}
            </Text>
            <View style={styles.filterChipWrap}>
              <FilterChip
                active={selectedLocation === ALL_LOCATIONS}
                label={t("feature.carRental.allThailand")}
                onPress={() => setSelectedLocation(ALL_LOCATIONS)}
              />
              {THAILAND_LOCATIONS.map((location) => (
                <FilterChip
                  active={selectedLocation === location}
                  key={location}
                  label={location}
                  onPress={() => setSelectedLocation(location)}
                />
              ))}
            </View>

            <Text style={styles.filterLabel}>{t("feature.carRental.brandLabel")}</Text>
            <View style={styles.filterChipWrap}>
              <FilterChip
                active={selectedBrand === ALL_BRANDS}
                label={t("feature.carRental.allBrands")}
                onPress={() => setSelectedBrand(ALL_BRANDS)}
              />
              {CAR_BRANDS.map((brand) => (
                <FilterChip
                  active={selectedBrand === brand}
                  key={brand}
                  label={brand}
                  onPress={() => setSelectedBrand(brand)}
                />
              ))}
            </View>
          </View>

          <View style={[styles.resultHeader, { width: contentWidth }]}>
            <Text style={styles.resultTitle}>
              {t("feature.carRental.availableCarsTitle")}
            </Text>
            <Text style={styles.resultSubtitle}>
              {t("feature.carRental.availableCarsSubtitle")}
            </Text>
          </View>

          <View style={[styles.carList, { width: contentWidth }]}>
            {filteredCars.length > 0 ? (
              filteredCars.map((car) => <CarCard car={car} key={car.id} />)
            ) : (
              <View style={styles.emptyState}>
                <Ionicons
                  color={Brand.accent}
                  name="search-outline"
                  size={22}
                />
                <Text style={styles.emptyStateTitle}>
                  {t("feature.carRental.noResultsTitle")}
                </Text>
                <Text style={styles.emptyStateText}>
                  {t("feature.carRental.noResultsBody")}
                </Text>
                <Pressable
                  accessibilityLabel={t("feature.carRental.resetFilters")}
                  accessibilityRole="button"
                  onPress={resetFilters}
                  style={({ pressed }) => [
                    styles.emptyResetButton,
                    pressed ? styles.emptyResetButtonPressed : null,
                  ]}
                >
                  <Text style={styles.emptyResetButtonText}>
                    {t("feature.carRental.resetFilters")}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  if (isFlow) {
    return (
      <View
        style={[
          styles.container,
          {
            paddingTop: Math.max(14, insets.top + 6),
            paddingBottom: Math.max(14, insets.bottom + 8),
            paddingHorizontal: horizontalPadding,
          },
        ]}
      >
        <Stack.Screen options={{ title: t("features.items.flow") }} />

        <LinearGradient
          colors={["#FFF1F5", "#FFF8FB"]}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={StyleSheet.absoluteFill}
        />

        {flowToast ? (
          <View
            pointerEvents="none"
            style={[
              styles.flowToast,
              flowToast.kind === "error"
                ? styles.flowToastError
                : styles.flowToastSuccess,
              { top: Math.max(18, insets.top + 8) },
            ]}
          >
            <Ionicons
              color={flowToast.kind === "error" ? "#991B1B" : "#166534"}
              name={
                flowToast.kind === "error"
                  ? "alert-circle-outline"
                  : "checkmark-circle-outline"
              }
              size={16}
            />
            <Text
              style={[
                styles.flowToastText,
                flowToast.kind === "error"
                  ? styles.flowToastTextError
                  : styles.flowToastTextSuccess,
              ]}
            >
              {flowToast.message}
            </Text>
          </View>
        ) : null}

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.heroCard, { width: contentWidth }]}>
            <LinearGradient
              colors={["#881337", "#BE123C"]}
              end={{ x: 1, y: 1 }}
              start={{ x: 0, y: 0 }}
              style={styles.heroGradient}
            >
              <View style={styles.heroTopRow}>
                <View style={styles.heroTag}>
                  <FeatureIcon color="#FFFFFF" name="flow" size={14} />
                  <Text style={styles.heroTagText}>{t("feature.flow.heroTag")}</Text>
                </View>
                <Text style={styles.heroCount}>
                  {t("feature.flow.activePhaseValue", {
                    value: t(`feature.flow.activePhases.${activePhase}`),
                  })}
                </Text>
              </View>

              <Text style={styles.heroTitle}>{t("feature.flow.heroTitle")}</Text>
              <Text style={styles.heroSubtitle}>
                {t("feature.flow.heroSubtitle")}
              </Text>
            </LinearGradient>
          </View>

          <View style={[styles.filterPanel, { width: contentWidth }]}>
            <Text style={styles.filterTitle}>{t("feature.flow.summaryTitle")}</Text>
            <Text style={styles.flowSummarySubtitle}>
              {t("feature.flow.summarySubtitle")}
            </Text>

            {isFlowLoading ? (
              <Text style={styles.filterHint}>{t("feature.flow.loading")}</Text>
            ) : null}

            <View style={styles.flowStatGrid}>
              <FlowStatCard
                accent="#E11D48"
                label={t("feature.flow.cycleDay")}
                value={t("feature.flow.cycleDayValue", { count: cycleDay })}
              />
              <FlowStatCard
                accent="#BE123C"
                label={t("feature.flow.nextPeriod")}
                value={t("feature.flow.inDays", {
                  count: Math.max(0, diffInDays(todayIso, nextPeriodDate)),
                })}
              />
              <FlowStatCard
                accent="#DB2777"
                label={t("feature.flow.ovulation")}
                value={t("feature.flow.inDays", {
                  count: Math.max(0, diffInDays(todayIso, ovulationDate)),
                })}
              />
            </View>

            <Text style={styles.filterLabel}>{t("feature.flow.lastPeriodStart")}</Text>
            <View style={styles.flowDateCardRow}>
              <Pressable
                onPress={() => setActiveFlowSelection("start")}
                style={[
                  styles.flowDateCard,
                  activeFlowSelection === "start"
                    ? styles.flowDateCardActive
                    : null,
                ]}
              >
                <Text style={styles.flowDateLabel}>
                  {t("feature.flow.periodStart")}
                </Text>
                <Text style={styles.flowDateValue}>
                  {formatIsoDate(flowStartDate, localeTag)}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setActiveFlowSelection("end")}
                style={[
                  styles.flowDateCard,
                  activeFlowSelection === "end"
                    ? styles.flowDateCardActive
                    : null,
                ]}
              >
                <Text style={styles.flowDateLabel}>
                  {t("feature.flow.periodEnd")}
                </Text>
                <Text style={styles.flowDateValue}>
                  {formatIsoDate(flowEndDate, localeTag)}
                </Text>
              </Pressable>
            </View>
            <Text style={styles.filterHint}>
              {t("feature.flow.tapToUpdate", {
                value:
                  activeFlowSelection === "start"
                    ? t("feature.flow.periodStart")
                    : t("feature.flow.periodEnd"),
              })}
            </Text>

            <Text style={styles.filterLabel}>{t("feature.flow.cycleLength")}</Text>
            <View style={styles.filterChipWrap}>
              {CYCLE_LENGTH_OPTIONS.map((option) => (
                <FilterChip
                  active={cycleLength === option}
                  key={option}
                  label={t("feature.flow.dayCount", { count: option })}
                  onPress={() => setCycleLength(option)}
                />
              ))}
            </View>

            <Text style={styles.filterLabel}>{t("feature.flow.periodLength")}</Text>
            <View style={styles.filterChipWrap}>
              {PERIOD_LENGTH_OPTIONS.map((option) => (
                <FilterChip
                  active={periodLength === option}
                  key={option}
                  label={t("feature.flow.dayCount", { count: option })}
                  onPress={() => handlePeriodLengthPress(option)}
                />
              ))}
            </View>

            <Pressable
              accessibilityLabel={t("feature.flow.saveCycle")}
              accessibilityRole="button"
              onPress={handleSaveFlow}
              style={({ pressed }) => [
                styles.flowSaveButton,
                (pressed || isFlowSaving) && styles.flowSaveButtonPressed,
              ]}
            >
              {isFlowSaving ? (
                <View style={styles.flowSaveButtonContent}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.flowSaveButtonText}>
                    {t("feature.flow.saving")}
                  </Text>
                </View>
              ) : (
                <Text style={styles.flowSaveButtonText}>
                  {t("feature.flow.saveCycle")}
                </Text>
              )}
            </Pressable>
          </View>

          <View style={[styles.flowCalendarCard, { width: contentWidth }]}>
            <Calendar
              current={flowStartDate}
              enableSwipeMonths
              firstDay={1}
              key={activeLanguage}
              markedDates={flowMarkedDates}
              markingType="custom"
              onDayPress={handleFlowCalendarPress}
              style={styles.flowCalendar}
              theme={{
                arrowColor: Brand.accent,
                calendarBackground: "#FFFFFF",
                dayTextColor: Brand.textPrimary,
                monthTextColor: Brand.primary,
                textDayFontWeight: "600",
                textDayHeaderFontWeight: "700",
                textMonthFontSize: 18,
                textMonthFontWeight: "800",
                textSectionTitleColor: Brand.textSecondary,
                todayTextColor: Brand.primary,
              }}
            />

            <View style={styles.flowLegend}>
              <FlowLegendItem
                color="#FEE2E2"
                label={t("feature.flow.legend.period")}
              />
              <FlowLegendItem
                color="#FCE7F3"
                label={t("feature.flow.legend.fertile")}
              />
              <FlowLegendItem
                color="#FBCFE8"
                label={t("feature.flow.legend.ovulation")}
              />
              <FlowLegendItem
                color="#FFFFFF"
                label={t("feature.flow.legend.selected")}
                outlined
              />
              <FlowLegendItem
                color="#FFFFFF"
                label={t("feature.flow.legend.end")}
                outlined
              />
            </View>
          </View>

          <View style={[styles.flowTimelineCard, { width: contentWidth }]}>
            <Text style={styles.resultTitle}>{t("feature.flow.timelineTitle")}</Text>
            <Text style={styles.resultSubtitle}>{t("feature.flow.timelineSubtitle")}</Text>

            <View style={styles.flowTimelineRow}>
              <Ionicons color="#BE123C" name="ellipse" size={10} />
              <Text style={styles.flowTimelineLabel}>
                {t("feature.flow.lastPeriodStart")}
              </Text>
              <Text style={styles.flowTimelineValue}>
                {formatIsoDate(flowStartDate, localeTag)}
              </Text>
            </View>

            <View style={styles.flowTimelineRow}>
              <Ionicons color="#F43F5E" name="ellipse" size={10} />
              <Text style={styles.flowTimelineLabel}>
                {t("feature.flow.periodEnd")}
              </Text>
              <Text style={styles.flowTimelineValue}>
                {formatIsoDate(flowEndDate, localeTag)}
              </Text>
            </View>

            <View style={styles.flowTimelineRow}>
              <Ionicons color="#DB2777" name="ellipse" size={10} />
              <Text style={styles.flowTimelineLabel}>
                {t("feature.flow.fertileWindow")}
              </Text>
              <Text style={styles.flowTimelineValue}>
                {t("feature.flow.dateRange", {
                  from: formatIsoDate(fertileStartDate, localeTag),
                  to: formatIsoDate(fertileEndDate, localeTag),
                })}
              </Text>
            </View>

            <View style={styles.flowTimelineRow}>
              <Ionicons color="#E11D48" name="ellipse" size={10} />
              <Text style={styles.flowTimelineLabel}>
                {t("feature.flow.nextPeriod")}
              </Text>
              <Text style={styles.flowTimelineValue}>
                {formatIsoDate(nextPeriodDate, localeTag)}
              </Text>
            </View>

            <View style={styles.flowNotice}>
              <Ionicons color="#BE123C" name="information-circle-outline" size={16} />
              <Text style={styles.flowNoticeText}>{t("feature.flow.note")}</Text>
            </View>
          </View>

          <View style={[styles.flowTimelineCard, { width: contentWidth }]}>
            <Text style={styles.resultTitle}>{t("feature.flow.historyTitle")}</Text>
            <Text style={styles.resultSubtitle}>
              {t("feature.flow.historySubtitle")}
            </Text>
            {flowHistory.length > 0 ? (
              flowHistory.slice(0, 4).map((entry) => (
                <Pressable
                  key={entry.id}
                  onPress={() => {
                    setFlowRecordId(entry.id);
                    setFlowStartDate(entry.startDate);
                    setFlowEndDate(entry.endDate);
                    setCycleLength(
                      CYCLE_LENGTH_OPTIONS.includes(
                        entry.cycleLength as (typeof CYCLE_LENGTH_OPTIONS)[number],
                      )
                        ? (entry.cycleLength as (typeof CYCLE_LENGTH_OPTIONS)[number])
                        : 28,
                    );
                    setPeriodLength(entry.periodLength);
                    setFlowToast(null);
                  }}
                  style={styles.flowHistoryCard}
                >
                  <Text style={styles.flowHistoryTitle}>
                    {t("feature.flow.dateRange", {
                      from: formatIsoDate(entry.startDate, localeTag),
                      to: formatIsoDate(entry.endDate, localeTag),
                    })}
                  </Text>
                  <Text style={styles.flowHistoryMeta}>
                    {t("feature.flow.savedOn", {
                      value: formatIsoDate(entry.updatedAt.slice(0, 10), localeTag),
                    })}
                  </Text>
                </Pressable>
              ))
            ) : (
              <Text style={styles.filterHint}>{t("feature.flow.noHistory")}</Text>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          justifyContent: "center",
          paddingBottom: Math.max(18, insets.bottom + 12),
          paddingHorizontal: horizontalPadding,
          paddingTop: Math.max(18, insets.top + 10),
        },
      ]}
    >
      <Stack.Screen options={{ title: featureTitle }} />

      <LinearGradient
        colors={["#ECF3FF", "#F7F9FF"]}
        end={{ x: 0.8, y: 1 }}
        start={{ x: 0.2, y: 0 }}
        style={StyleSheet.absoluteFill}
      />

      <View
        style={[styles.placeholderCard, { width: Math.min(contentWidth, 640) }]}
      >
        <Text style={styles.placeholderTitle}>{featureTitle}</Text>
        <Text style={styles.placeholderSubtitle}>
          {t("feature.routeKey", { key: params.key ?? "unknown" })}
        </Text>
        <Text style={styles.placeholderBody}>{t("feature.placeholderBody")}</Text>

        <Pressable
          accessibilityLabel={t("common.goBack")}
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.placeholderButton}
        >
          <Text style={styles.placeholderButtonText}>{t("common.goBack")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: Brand.background,
  },
  scrollContent: {
    alignItems: "center",
    paddingBottom: Spacing.xl,
    rowGap: Spacing.base,
  },
  heroCard: {
    borderRadius: Radius.lg,
    overflow: "hidden",
    shadowColor: Brand.primary,
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 5,
  },
  heroGradient: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.lg,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  heroTag: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  heroTagText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  heroCount: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    opacity: 0.95,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 26,
    lineHeight: 31,
    fontWeight: "800",
    maxWidth: "92%",
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.92)",
    marginTop: Spacing.sm,
    fontSize: 13,
    lineHeight: 19,
    maxWidth: "92%",
  },
  filterPanel: {
    backgroundColor: "#FFFFFF",
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.base,
    rowGap: Spacing.sm,
    shadowColor: Brand.primary,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 3,
  },
  filterHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  filterTitle: {
    color: Brand.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  resetButton: {
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.25)",
    backgroundColor: "rgba(59,130,246,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  resetButtonText: {
    color: Brand.accent,
    fontSize: 12,
    fontWeight: "700",
  },
  filterLabel: {
    color: Brand.textPrimary,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
  },
  dateInput: {
    minHeight: 42,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.border,
    paddingHorizontal: 12,
    color: Brand.textPrimary,
    fontSize: 14,
    backgroundColor: "#FFFFFF",
  },
  nativeDateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  nativeDateValue: {
    color: Brand.textPrimary,
    fontSize: 14,
    flex: 1,
  },
  nativeDatePlaceholder: {
    color: "#94A3B8",
  },
  dateInputInvalid: {
    borderColor: "#DC2626",
  },
  filterHint: {
    color: Brand.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  filterError: {
    color: "#DC2626",
    fontWeight: "600",
  },
  filterChipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.12)",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  filterChipActive: {
    backgroundColor: "rgba(59,130,246,0.12)",
    borderColor: "rgba(59,130,246,0.55)",
  },
  filterChipPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  filterChipText: {
    color: Brand.textSecondary,
    fontSize: 12.5,
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: Brand.accent,
  },
  flowSummarySubtitle: {
    color: Brand.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  flowStatGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 4,
  },
  flowStatCard: {
    flex: 1,
    minWidth: 150,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: "rgba(225,29,72,0.12)",
    backgroundColor: "#FFF7FA",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  flowStatAccent: {
    width: 28,
    height: 4,
    borderRadius: 999,
    marginBottom: 10,
  },
  flowStatLabel: {
    color: Brand.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  flowStatValue: {
    color: "#881337",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 4,
  },
  flowDateValue: {
    color: Brand.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  flowDateCardRow: {
    flexDirection: "row",
    gap: 10,
  },
  flowDateCard: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.12)",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  flowDateCardActive: {
    borderColor: "rgba(225,29,72,0.45)",
    backgroundColor: "#FFF7FA",
  },
  flowDateLabel: {
    color: Brand.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  flowSaveButton: {
    minHeight: 42,
    borderRadius: Radius.md,
    backgroundColor: "#BE123C",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  flowSaveButtonPressed: {
    opacity: 0.86,
  },
  flowSaveButtonContent: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  flowSaveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  flowToast: {
    alignItems: "center",
    borderRadius: Radius.md,
    columnGap: 8,
    left: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    position: "absolute",
    right: 16,
    shadowColor: Brand.primary,
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 5,
    flexDirection: "row",
    zIndex: 20,
  },
  flowToastSuccess: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#86EFAC",
  },
  flowToastError: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  flowToastText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: "600",
    lineHeight: 18,
  },
  flowToastTextSuccess: {
    color: "#166534",
  },
  flowToastTextError: {
    color: "#991B1B",
  },
  flowCalendarCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: "rgba(225,29,72,0.12)",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 14,
    shadowColor: Brand.primary,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 3,
  },
  flowCalendar: {
    borderRadius: Radius.lg,
  },
  flowLegend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
    paddingHorizontal: 8,
  },
  flowLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 6,
  },
  flowLegendSwatch: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(225,29,72,0.18)",
  },
  flowLegendSwatchOutline: {
    borderColor: Brand.primary,
    borderWidth: 2,
  },
  flowLegendLabel: {
    color: Brand.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  flowTimelineCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: "rgba(225,29,72,0.12)",
    backgroundColor: "#FFFFFF",
    padding: Spacing.base,
    rowGap: Spacing.sm,
    shadowColor: Brand.primary,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 3,
  },
  flowTimelineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    columnGap: 8,
  },
  flowTimelineLabel: {
    color: Brand.textPrimary,
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
  },
  flowTimelineValue: {
    color: Brand.textSecondary,
    flex: 1.2,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "right",
  },
  flowNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    columnGap: 8,
    borderRadius: Radius.md,
    backgroundColor: "#FFF1F5",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  flowNoticeText: {
    color: "#9D174D",
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  flowHistoryCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.08)",
    backgroundColor: "#FFF9FB",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  flowHistoryTitle: {
    color: Brand.textPrimary,
    fontSize: 13,
    fontWeight: "700",
  },
  flowHistoryMeta: {
    color: Brand.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  resultHeader: {
    marginTop: 2,
  },
  resultTitle: {
    color: Brand.textPrimary,
    fontSize: 20,
    fontWeight: "700",
  },
  resultSubtitle: {
    color: Brand.textSecondary,
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
  },
  carList: {
    rowGap: Spacing.base,
  },
  carCard: {
    borderRadius: Radius.lg,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.08)",
    shadowColor: Brand.primary,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 7 },
    shadowRadius: 16,
    elevation: 3,
  },
  carBanner: {
    height: 148,
    overflow: "hidden",
    padding: Spacing.base,
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  bannerBadge: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.20)",
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  bannerBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  carBody: {
    padding: Spacing.base,
    rowGap: Spacing.sm,
  },
  carHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    columnGap: 10,
  },
  carHeaderTextWrap: {
    flex: 1,
  },
  carName: {
    color: Brand.textPrimary,
    fontSize: 17,
    fontWeight: "700",
  },
  carMeta: {
    color: Brand.textSecondary,
    marginTop: 2,
    fontSize: 12.5,
    lineHeight: 18,
  },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 4,
    borderRadius: 999,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FDE4CC",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ratingText: {
    color: "#B45309",
    fontSize: 12,
    fontWeight: "700",
  },
  specRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  specTag: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 5,
    borderRadius: Radius.sm,
    backgroundColor: Brand.surface,
    borderWidth: 1,
    borderColor: Brand.border,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  specTagText: {
    color: Brand.textPrimary,
    fontSize: 12,
    fontWeight: "600",
  },
  availabilityRow: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 6,
  },
  availabilityText: {
    color: Brand.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  priceRow: {
    marginTop: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priceText: {
    color: Brand.primary,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  perDayText: {
    color: Brand.textSecondary,
    fontSize: 11.5,
    marginTop: 1,
  },
  bookButton: {
    minHeight: 38,
    borderRadius: Radius.md,
    backgroundColor: Brand.accent,
    paddingHorizontal: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  bookButtonPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  bookButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  emptyState: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.25)",
    backgroundColor: "#F8FBFF",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  emptyStateTitle: {
    color: Brand.textPrimary,
    marginTop: 10,
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyStateText: {
    color: Brand.textSecondary,
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  emptyResetButton: {
    marginTop: 14,
    borderRadius: Radius.sm,
    backgroundColor: Brand.primary,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  emptyResetButtonPressed: {
    opacity: 0.88,
  },
  emptyResetButtonText: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "700",
  },
  placeholderCard: {
    borderRadius: Radius.lg,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.lg,
    shadowColor: Brand.primary,
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 4,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Brand.textPrimary,
  },
  placeholderSubtitle: {
    marginTop: 8,
    color: Brand.textSecondary,
    fontSize: 14,
    fontWeight: "400",
  },
  placeholderBody: {
    marginTop: 14,
    color: Brand.textSecondary,
    fontSize: 16,
    lineHeight: 24,
  },
  placeholderButton: {
    marginTop: 22,
    alignSelf: "flex-start",
    minHeight: 44,
    minWidth: 100,
    borderRadius: Radius.sm,
    backgroundColor: Brand.accent,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  placeholderButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
