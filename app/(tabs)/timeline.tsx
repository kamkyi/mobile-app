import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TIMELINE_CARDS = [
  {
    key: "doctor",
    title: "Browse doctors",
    body: "Open the doctor list, scroll profiles, and filter by gender at the top.",
    icon: "medkit-outline" as const,
    route: "/feature/doctor" as const,
  },
  {
    key: "dating",
    title: "Browse daters",
    body: "See dater profiles in one scrollable list with the same gender filters.",
    icon: "heart-outline" as const,
    route: "/feature/dating" as const,
  },
  {
    key: "flow",
    title: "Open timeline tools",
    body: "Keep the cycle tracker and saved history one tap away from the footer.",
    icon: "calendar-outline" as const,
    route: "/feature/flow" as const,
  },
];

export default function TimelineTabScreen() {
  const router = useRouter();

  return (
    <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>Timeline</Text>
          <Text style={styles.headerBody}>
            Use this tab for quick activity-style jumps across the app.
          </Text>
        </View>

        {TIMELINE_CARDS.map((card) => (
          <Pressable
            key={card.key}
            onPress={() => router.push(card.route)}
            style={({ pressed }) => [
              styles.card,
              pressed ? styles.cardPressed : null,
            ]}
          >
            <View style={styles.iconWrap}>
              <Ionicons color="#2563EB" name={card.icon} size={20} />
            </View>
            <View style={styles.cardCopy}>
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.cardBody}>{card.body}</Text>
            </View>
            <Ionicons color="#94A3B8" name="chevron-forward" size={18} />
          </Pressable>
        ))}
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
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  cardCopy: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "800",
  },
  cardBody: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 19,
  },
});
