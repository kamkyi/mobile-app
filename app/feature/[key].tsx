import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  Redirect,
  Stack,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
import { useAuth } from "@/context/AuthContext";
import { useHydratedWindowDimensions } from "@/hooks/use-hydrated-window-dimensions";

type PriceFilter = {
  label: string;
  value: number | null;
};

const PRICE_FILTERS: PriceFilter[] = [
  { label: "Any price", value: null },
  { label: "Up to THB 1,200", value: 1200 },
  { label: "Up to THB 1,800", value: 1800 },
  { label: "Up to THB 2,500", value: 2500 },
];

const ALL_LOCATIONS = "All Thailand";
const ALL_BRANDS = "All Brands";

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

function CarCard({ car }: { car: CarRentalItem }) {
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
              {car.brand} · {car.transmission} · {car.seats} seats
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
            <Text style={styles.specTagText}>{car.trips} trips</Text>
          </View>
        </View>

        <View style={styles.availabilityRow}>
          <Ionicons
            color={Brand.textSecondary}
            name="calendar-outline"
            size={13}
          />
          <Text style={styles.availabilityText}>
            {car.availableFrom} to {car.availableTo}
          </Text>
        </View>

        <View style={styles.priceRow}>
          <View>
            <Text style={styles.priceText}>
              {formatTHB(car.pricePerDayTHB)}
            </Text>
            <Text style={styles.perDayText}>per day</Text>
          </View>

          <Pressable
            accessibilityLabel={`Book ${car.name}`}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.bookButton,
              pressed ? styles.bookButtonPressed : null,
            ]}
          >
            <Text style={styles.bookButtonText}>Book now</Text>
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

  const horizontalPadding = width < 380 ? 12 : 16;
  const contentWidth = Math.min(width - horizontalPadding * 2, 760);

  const feature = useMemo(() => {
    if (!params.key) {
      return null;
    }

    return FEATURE_MAP[params.key] ?? null;
  }, [params.key]);

  const [pickupDateInput, setPickupDateInput] = useState("");
  const [selectedMaxPrice, setSelectedMaxPrice] = useState<number | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<
    ThaiLocation | typeof ALL_LOCATIONS
  >(ALL_LOCATIONS);
  const [selectedBrand, setSelectedBrand] = useState<
    CarBrand | typeof ALL_BRANDS
  >(ALL_BRANDS);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const pickupDate = pickupDateInput.trim();
  const pickupDay = useMemo(() => parseIsoDay(pickupDate), [pickupDate]);
  const isDateInvalid = pickupDate.length > 0 && pickupDay === null;
  const isCarRental = params.key === "car-rental";
  const shouldRedirectToLogin =
    hasMounted && Boolean(feature?.requiresAuth) && !isAuthenticated;

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
    setSelectedMaxPrice(null);
    setSelectedLocation(ALL_LOCATIONS);
    setSelectedBrand(ALL_BRANDS);
  }, []);

  if (shouldRedirectToLogin) {
    return <Redirect href="/login" />;
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
        <Stack.Screen options={{ title: "Car Rental" }} />

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
                  <Text style={styles.heroTagText}>Thailand fleet</Text>
                </View>
                <Text style={styles.heroCount}>{filteredCars.length} cars</Text>
              </View>

              <Text style={styles.heroTitle}>Find your perfect rental car</Text>
              <Text style={styles.heroSubtitle}>
                Filter by date, price, Thailand location, and brand in one
                place.
              </Text>
            </LinearGradient>
          </View>

          <View style={[styles.filterPanel, { width: contentWidth }]}>
            <View style={styles.filterHeaderRow}>
              <Text style={styles.filterTitle}>Filters</Text>
              <Pressable onPress={resetFilters} style={styles.resetButton}>
                <Text style={styles.resetButtonText}>Reset all</Text>
              </Pressable>
            </View>

            <Text style={styles.filterLabel}>Pickup date (YYYY-MM-DD)</Text>
            <TextInput
              accessibilityLabel="Pickup date"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="numbers-and-punctuation"
              onChangeText={setPickupDateInput}
              placeholder="2026-03-10"
              placeholderTextColor="#94A3B8"
              style={[
                styles.dateInput,
                isDateInvalid ? styles.dateInputInvalid : null,
              ]}
              value={pickupDateInput}
            />
            <Text
              style={[
                styles.filterHint,
                isDateInvalid ? styles.filterError : null,
              ]}
            >
              {isDateInvalid
                ? "Invalid format. Use YYYY-MM-DD."
                : "Leave empty to show cars for all dates."}
            </Text>

            <Text style={styles.filterLabel}>Price per day</Text>
            <View style={styles.filterChipWrap}>
              {PRICE_FILTERS.map((option) => (
                <FilterChip
                  active={selectedMaxPrice === option.value}
                  key={option.label}
                  label={option.label}
                  onPress={() => setSelectedMaxPrice(option.value)}
                />
              ))}
            </View>

            <Text style={styles.filterLabel}>Location (Thailand)</Text>
            <View style={styles.filterChipWrap}>
              <FilterChip
                active={selectedLocation === ALL_LOCATIONS}
                label={ALL_LOCATIONS}
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

            <Text style={styles.filterLabel}>Car brand</Text>
            <View style={styles.filterChipWrap}>
              <FilterChip
                active={selectedBrand === ALL_BRANDS}
                label={ALL_BRANDS}
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
            <Text style={styles.resultTitle}>Available cars</Text>
            <Text style={styles.resultSubtitle}>
              Sorted by best daily price for your filters.
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
                  No cars match this filter set
                </Text>
                <Text style={styles.emptyStateText}>
                  Try a higher price limit or switch location and brand filters.
                </Text>
                <Pressable
                  accessibilityLabel="Reset filters"
                  accessibilityRole="button"
                  onPress={resetFilters}
                  style={({ pressed }) => [
                    styles.emptyResetButton,
                    pressed ? styles.emptyResetButtonPressed : null,
                  ]}
                >
                  <Text style={styles.emptyResetButtonText}>Reset filters</Text>
                </Pressable>
              </View>
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
      <Stack.Screen options={{ title: feature?.label ?? "Feature" }} />

      <LinearGradient
        colors={["#ECF3FF", "#F7F9FF"]}
        end={{ x: 0.8, y: 1 }}
        start={{ x: 0.2, y: 0 }}
        style={StyleSheet.absoluteFill}
      />

      <View
        style={[styles.placeholderCard, { width: Math.min(contentWidth, 640) }]}
      >
        <Text style={styles.placeholderTitle}>
          {feature?.label ?? "Feature"}
        </Text>
        <Text style={styles.placeholderSubtitle}>
          Route key: {params.key ?? "unknown"}
        </Text>
        <Text style={styles.placeholderBody}>
          This module is still a placeholder. Car Rental now has a dedicated
          list + filters experience.
        </Text>

        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.placeholderButton}
        >
          <Text style={styles.placeholderButtonText}>Go back</Text>
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
