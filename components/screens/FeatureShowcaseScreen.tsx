import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  SHOWCASE_SECTIONS,
  type ShowcaseFeatureKey,
} from "@/constants/feature-showcase";

export default function FeatureShowcaseScreen({
  featureKey,
}: {
  featureKey: ShowcaseFeatureKey;
}) {
  const section = SHOWCASE_SECTIONS[featureKey];
  const isProfessionalList = featureKey === "beauty" || featureKey === "fitness";

  return (
    <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
      <Stack.Screen options={{ title: section.title }} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroCard, { borderColor: `${section.accentColor}32` }]}>
          <View
            style={[styles.heroBadge, { backgroundColor: `${section.accentColor}14` }]}
          >
            <Text style={[styles.heroBadgeText, { color: section.accentColor }]}>
              {section.heroLabel}
            </Text>
          </View>
          <Text style={styles.heroTitle}>{section.title}</Text>
          <Text style={styles.heroBody}>{section.subtitle}</Text>
        </View>

        <View style={styles.cardList}>
          {section.cards.map((card) => (
            <View key={card.id} style={styles.card}>
              <Image
                source={{ uri: card.imageUrl }}
                style={styles.cardImage}
                contentFit="cover"
                transition={180}
              />

              <View style={styles.cardBody}>
                <View style={styles.cardTitleRow}>
                  <View style={styles.cardTitleWrap}>
                    <Text style={styles.cardTitle}>{card.title}</Text>
                    <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
                  </View>
                  <View
                    style={[
                      styles.cardAccentDot,
                      { backgroundColor: section.accentColor },
                    ]}
                  />
                </View>

                <View style={styles.tagRow}>
                  {card.tags.map((tag) => (
                    <View key={`${card.id}-${tag}`} style={styles.tagChip}>
                      <Text style={styles.tagChipText}>{tag}</Text>
                    </View>
                  ))}
                </View>

                <Text style={styles.cardDescription}>{card.description}</Text>

                {isProfessionalList ? (
                  <View style={styles.metaColumn}>
                    <View style={styles.metaRow}>
                      <Ionicons color="#2563EB" name="call-outline" size={16} />
                      <Text style={styles.metaText}>{card.phoneNumber}</Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Ionicons color="#F59E0B" name="headset-outline" size={16} />
                      <Text style={styles.metaText}>{card.hotline}</Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Ionicons color="#059669" name="chatbubble-ellipses-outline" size={16} />
                      <Text style={styles.metaText}>{card.consultation}</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.metaColumn}>
                    <View style={styles.metaRow}>
                      <Ionicons color="#7C3AED" name="location-outline" size={16} />
                      <Text style={styles.metaText}>{card.location}</Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Ionicons color="#F97316" name="time-outline" size={16} />
                      <Text style={styles.metaText}>{card.hours}</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
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
    paddingBottom: 32,
    gap: 16,
  },
  heroCard: {
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    padding: 18,
    gap: 10,
  },
  heroBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: "#0F172A",
    fontSize: 24,
    fontWeight: "800",
  },
  heroBody: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 21,
  },
  cardList: {
    gap: 16,
  },
  card: {
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: 190,
  },
  cardBody: {
    padding: 16,
    gap: 12,
  },
  cardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },
  cardTitleWrap: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "800",
  },
  cardSubtitle: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "700",
  },
  cardAccentDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 6,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagChip: {
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagChipText: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "700",
  },
  cardDescription: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 21,
  },
  metaColumn: {
    gap: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaText: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "600",
  },
});
