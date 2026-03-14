import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  NEARBY_SERVICES,
  type NearbyService,
} from "@/constants/nearby-services";

type PermissionState = "loading" | "granted" | "denied";

function formatCoordinate(value: number) {
  return value.toFixed(3);
}

function NearbyCard({
  item,
  selected,
  onPress,
}: {
  item: NearbyService;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected ? styles.cardSelected : null,
        pressed ? styles.cardPressed : null,
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${item.accent}16` }]}>
        <Ionicons color={item.accent} name={item.icon} size={20} />
      </View>

      <View style={styles.cardCopy}>
        <View style={styles.cardTopRow}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <View style={styles.distanceChip}>
            <Text style={styles.distanceChipText}>{item.distanceKm.toFixed(1)} km</Text>
          </View>
        </View>
        <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
        <Text style={styles.cardMeta}>{item.eta}</Text>
      </View>

      {selected ? (
        <Ionicons color="#2563EB" name="checkmark-circle" size={20} />
      ) : (
        <Ionicons color="#94A3B8" name="ellipse-outline" size={20} />
      )}
    </Pressable>
  );
}

export default function NearbyScreen() {
  const router = useRouter();
  const [permissionState, setPermissionState] = useState<PermissionState>("loading");
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(
    null,
  );

  const requestLocation = useCallback(async () => {
    setPermissionState("loading");

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        setPermissionState("denied");
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setCoords({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setPermissionState("granted");
    } catch (error) {
      console.warn("Failed to load device location", error);
      setPermissionState("denied");
    }
  }, []);

  useEffect(() => {
    void requestLocation();
  }, [requestLocation]);

  const selectedService = useMemo(
    () => NEARBY_SERVICES.find((item) => item.id === selectedServiceId) ?? null,
    [selectedServiceId],
  );

  const handleServicePress = (item: NearbyService) => {
    setSelectedServiceId(item.id);

    if (item.route) {
      router.push(item.route);
    }
  };

  return (
    <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
      <Stack.Screen options={{ title: "Nearby" }} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {permissionState === "loading" ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color="#2563EB" />
            <Text style={styles.stateTitle}>Requesting device location</Text>
            <Text style={styles.stateBody}>
              Waiting for GPS permission before showing nearby services.
            </Text>
          </View>
        ) : null}

        {permissionState === "denied" ? (
          <View style={styles.stateCard}>
            <Ionicons color="#F97316" name="location-outline" size={24} />
            <Text style={styles.stateTitle}>Location permission needed</Text>
            <Text style={styles.stateBody}>
              Allow GPS access to load nearby services around your current location.
            </Text>
            <Pressable onPress={() => void requestLocation()} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Allow location again</Text>
            </Pressable>
          </View>
        ) : null}

        {permissionState === "granted" ? (
          <>
            <View style={styles.locationCard}>
              <View style={styles.locationTopRow}>
                <Text style={styles.locationTitle}>Nearby services</Text>
                <View style={styles.locationBadge}>
                  <Ionicons color="#2563EB" name="navigate" size={12} />
                  <Text style={styles.locationBadgeText}>GPS on</Text>
                </View>
              </View>
              <Text style={styles.locationBody}>
                Current location {coords ? `${formatCoordinate(coords.latitude)}, ${formatCoordinate(coords.longitude)}` : ""}
              </Text>
            </View>

            <View style={styles.list}>
              {NEARBY_SERVICES.map((item) => (
                <NearbyCard
                  key={item.id}
                  item={item}
                  selected={selectedServiceId === item.id}
                  onPress={() => handleServicePress(item)}
                />
              ))}
            </View>

            {selectedService ? (
              <View style={styles.selectionCard}>
                <Text style={styles.selectionTitle}>Selected</Text>
                <Text style={styles.selectionBody}>
                  {selectedService.title} is selected from your nearby list.
                </Text>
              </View>
            ) : null}
          </>
        ) : null}
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
    paddingBottom: 28,
    gap: 14,
  },
  stateCard: {
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 20,
    alignItems: "center",
    gap: 10,
  },
  stateTitle: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  stateBody: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 6,
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: "#2563EB",
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  locationCard: {
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
    padding: 16,
    gap: 8,
  },
  locationTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  locationTitle: {
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "800",
  },
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  locationBadgeText: {
    color: "#1D4ED8",
    fontSize: 12,
    fontWeight: "800",
  },
  locationBody: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 19,
  },
  list: {
    gap: 12,
  },
  card: {
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardSelected: {
    borderColor: "#93C5FD",
    backgroundColor: "#F8FBFF",
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  cardCopy: {
    flex: 1,
    gap: 4,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "800",
    flex: 1,
  },
  distanceChip: {
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  distanceChipText: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "700",
  },
  cardSubtitle: {
    color: "#475569",
    fontSize: 13,
    lineHeight: 18,
  },
  cardMeta: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
  },
  selectionCard: {
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    gap: 4,
  },
  selectionTitle: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "800",
  },
  selectionBody: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 18,
  },
});
