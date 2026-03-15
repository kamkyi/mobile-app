import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  EXPLORE_CATEGORY_LABELS,
  EXPLORE_STORIES,
  EXPLORE_WEATHER_CARDS,
  type ExploreCategoryKey,
} from "@/constants/explore-feed";
import { useScreenLayout } from "@/hooks/use-screen-layout";

type ExploreFilter = "all" | ExploreCategoryKey;

export default function ExploreScreen() {
  const [selectedFilter, setSelectedFilter] = useState<ExploreFilter>("all");
  const { contentContainerStyle } = useScreenLayout({
    bottomPadding: 32,
    gap: 18,
  });

  const stories = useMemo(() => {
    if (selectedFilter === "all") {
      return EXPLORE_STORIES;
    }

    return EXPLORE_STORIES.filter((story) => story.category === selectedFilter);
  }, [selectedFilter]);

  return (
    <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
      <Stack.Screen options={{ title: "Explore" }} />

      <ScrollView
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>Explore feed</Text>
          <Text style={styles.heroTitle}>Big event cards, weather, and quick filters</Text>
          <Text style={styles.heroBody}>
            Browse football match highlights, science stories, beauty topics, and weather cards in one place.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weather</Text>
          <ScrollView
            horizontal
            contentContainerStyle={styles.weatherRow}
            showsHorizontalScrollIndicator={false}
          >
            {EXPLORE_WEATHER_CARDS.map((weatherCard) => (
              <View key={weatherCard.id} style={styles.weatherCard}>
                <View style={styles.weatherTopRow}>
                  <Text style={styles.weatherCity}>{weatherCard.city}</Text>
                  <Ionicons color="#1D4ED8" name="partly-sunny-outline" size={18} />
                </View>
                <Text style={styles.weatherTemp}>{weatherCard.temperatureC}C</Text>
                <Text style={styles.weatherCondition}>{weatherCard.condition}</Text>
                <Text style={styles.weatherHumidity}>Humidity {weatherCard.humidity}%</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Filter</Text>
          <ScrollView
            horizontal
            contentContainerStyle={styles.filterRow}
            showsHorizontalScrollIndicator={false}
          >
            <Pressable
              onPress={() => setSelectedFilter("all")}
              style={[
                styles.filterChip,
                selectedFilter === "all" ? styles.filterChipActive : null,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === "all" ? styles.filterChipTextActive : null,
                ]}
              >
                All
              </Text>
            </Pressable>

            {Object.entries(EXPLORE_CATEGORY_LABELS).map(([key, label]) => {
              const active = selectedFilter === key;

              return (
                <Pressable
                  key={key}
                  onPress={() => setSelectedFilter(key as ExploreCategoryKey)}
                  style={[styles.filterChip, active ? styles.filterChipActive : null]}
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
            })}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stories</Text>
          <View style={styles.storyList}>
            {stories.map((story) => (
              <View key={story.id} style={styles.storyCard}>
                <Image
                  source={{ uri: story.imageUrl }}
                  style={styles.storyImage}
                  contentFit="cover"
                  transition={180}
                />
                <View style={styles.storyBody}>
                  <View style={styles.storyTopRow}>
                    <View style={styles.categoryChip}>
                      <Text style={styles.categoryChipText}>
                        {EXPLORE_CATEGORY_LABELS[story.category]}
                      </Text>
                    </View>
                    {story.score ? (
                      <View style={styles.scoreChip}>
                        <Text style={styles.scoreChipText}>{story.score}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.storyTitle}>{story.title}</Text>
                  <Text style={styles.storySummary}>{story.summary}</Text>
                  <View style={styles.storyMetaRow}>
                    <Text style={styles.storyMeta}>{story.location}</Text>
                    <Text style={styles.storyMeta}>{story.meta}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
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
  heroCard: {
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 18,
  },
  heroEyebrow: {
    color: "#2563EB",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  heroTitle: {
    marginTop: 8,
    color: "#0F172A",
    fontSize: 25,
    fontWeight: "800",
    lineHeight: 30,
  },
  heroBody: {
    marginTop: 8,
    color: "#475569",
    fontSize: 14,
    lineHeight: 21,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "800",
  },
  weatherRow: {
    gap: 12,
  },
  weatherCard: {
    width: 170,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
    padding: 16,
    gap: 6,
  },
  weatherTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  weatherCity: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "800",
  },
  weatherTemp: {
    color: "#1D4ED8",
    fontSize: 28,
    fontWeight: "800",
  },
  weatherCondition: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "600",
  },
  weatherHumidity: {
    color: "#64748B",
    fontSize: 12,
  },
  filterRow: {
    gap: 10,
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
  storyList: {
    gap: 14,
  },
  storyCard: {
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  storyImage: {
    width: "100%",
    height: 180,
  },
  storyBody: {
    padding: 16,
    gap: 10,
  },
  storyTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  categoryChip: {
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  categoryChipText: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "700",
  },
  scoreChip: {
    borderRadius: 999,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  scoreChipText: {
    color: "#15803D",
    fontSize: 12,
    fontWeight: "800",
  },
  storyTitle: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 24,
  },
  storySummary: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 21,
  },
  storyMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  storyMeta: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
  },
});
