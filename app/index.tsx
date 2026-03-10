import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type Ref,
} from "react";
import {
  FlatList,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { PAGES, type FeatureItem, type PopularChip } from "@/constants/pages";
import { useAuth } from "@/context/AuthContext";
import { useHydratedWindowDimensions } from "@/hooks/use-hydrated-window-dimensions";

// ─── Responsive helpers ─────────────────────────────────────────────────────

/** Column count — grows with screen width so cards stay reasonably sized */
function getColumns(width: number): number {
  if (width >= 1200) return 6;
  if (width >= 900) return 5;
  if (width >= 768) return 4;
  if (width >= 480) return 3;
  return 2;
}

/** Split an array into rows of `size` for View-based grid rendering */
function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size)
    result.push(arr.slice(i, i + size));
  return result;
}

// ─── Layout constants ───────────────────────────────────────────────────────

const HERO_AUTO_MS = 45_000;
// CARD_H / GRID_GAP / GRID_H_PAD are computed inside the component
// so they react to the actual window dimensions safely.

// ─── Hero banner data ────────────────────────────────────────────────────────

type HeroSlide = {
  key: string;
  titleKey: string;
  subtitleKey: string;
  badgeKey: string;
  badgePrefix: string;
  image: string;
};

const HERO_SLIDES: HeroSlide[] = [
  {
    key: "hero-1",
    titleKey: "home.heroSlides.hero1.title",
    subtitleKey: "home.heroSlides.hero1.subtitle",
    badgeKey: "home.heroSlides.hero1.badge",
    badgePrefix: "\u26a1",
    image: "https://picsum.photos/id/338/1200/600",
  },
  {
    key: "hero-2",
    titleKey: "home.heroSlides.hero2.title",
    subtitleKey: "home.heroSlides.hero2.subtitle",
    badgeKey: "home.heroSlides.hero2.badge",
    badgePrefix: "\ud83d\udccd",
    image: "https://picsum.photos/id/1059/1200/600",
  },
  {
    key: "hero-3",
    titleKey: "home.heroSlides.hero3.title",
    subtitleKey: "home.heroSlides.hero3.subtitle",
    badgeKey: "home.heroSlides.hero3.badge",
    badgePrefix: "\u2728",
    image: "https://picsum.photos/id/1060/1200/600",
  },
];

// ─── Feature Card ───────────────────────────────────────────────────────────────

type FeatureCardProps = {
  item: FeatureItem;
  width: number;
  cardH: number;
  iconCircleSize: number;
  iconSize: number;
  onPress: (item: FeatureItem) => void;
};

const FeatureCard = memo(function FeatureCard({
  item,
  width,
  cardH,
  iconCircleSize,
  iconSize,
  onPress,
}: FeatureCardProps) {
  const anim = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: anim.value }],
  }));

  return (
    <Animated.View
      style={[styles.cardShell, { width, height: cardH }, animStyle]}
    >
      <Pressable
        accessibilityLabel={item.label}
        accessibilityRole="button"
        hitSlop={4}
        onPress={() => onPress(item)}
        onPressIn={() => {
          anim.value = withSpring(0.93, { damping: 18, stiffness: 280 });
        }}
        onPressOut={() => {
          anim.value = withSpring(1, { damping: 16, stiffness: 220 });
        }}
        style={styles.featureCard}
      >
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: `${item.color}20`,
              height: iconCircleSize,
              width: iconCircleSize,
              borderRadius: iconCircleSize / 2,
            },
          ]}
        >
          <Ionicons
            color={item.color}
            name={item.iconName as ComponentProps<typeof Ionicons>["name"]}
            size={iconSize}
          />
        </View>
        <Text numberOfLines={1} style={styles.featureLabel}>
          {item.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
});

// ─── Hero dot ──────────────────────────────────────────────────────────────────

function HeroDot({ active }: { active: boolean }) {
  return <View style={[styles.heroDot, active && styles.heroDotActive]} />;
}

// ─── Animated page dot ─────────────────────────────────────────────────────────

function PageDot({
  index,
  pageWidth,
  scrollX,
}: {
  index: number;
  pageWidth: number;
  scrollX: SharedValue<number>;
}) {
  const dotStyle = useAnimatedStyle(() => {
    const r = [
      (index - 1) * pageWidth,
      index * pageWidth,
      (index + 1) * pageWidth,
    ];
    return {
      opacity: interpolate(
        scrollX.value,
        r,
        [0.25, 1, 0.25],
        Extrapolation.CLAMP,
      ),
      width: interpolate(scrollX.value, r, [7, 20, 7], Extrapolation.CLAMP),
    };
  });

  return <Animated.View style={[styles.pageDot, dotStyle]} />;
}

export default function LandingScreen() {
  const { width: screenWidth, height: screenHeight } =
    useHydratedWindowDimensions();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();

  const heroListRef = useRef<FlatList<HeroSlide>>(null);
  // ScrollView ref for the horizontal feature page slider
  const featScrollRef = useRef<ScrollView>(null);
  const heroIdxRef = useRef(0);
  const [heroIdx, setHeroIdx] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const scrollX = useSharedValue(0);

  // ─── Responsive layout values ─────────────────────────────────────────────
  const isDesktop = screenWidth >= 1024;
  const isTablet = screenWidth >= 768;

  const cols = getColumns(screenWidth);

  // Horizontal padding & gap — fixed px, no scale() inflation
  const GRID_GAP = isDesktop ? 8 : 8;
  const GRID_H_PAD = isDesktop ? 12 : 10;

  // Content width — capped tightly so cards don't stretch on wide screens
  const contentW = Math.min(
    screenWidth - (isDesktop ? 40 : 28),
    isDesktop ? 720 : isTablet ? 680 : 540,
  );

  // Hero slider width — inset by horizontal padding for visual breathing room
  const HERO_H_PAD = 12;
  const heroW = contentW - HERO_H_PAD * 2;

  // Card height — fixed pixel values, no verticalScale inflation
  const CARD_H = isDesktop ? 72 : isTablet ? 76 : 80;

  // Icon circle & icon size
  const iconCircleSize = isDesktop ? 32 : isTablet ? 36 : 40;
  const iconSize = isDesktop ? 15 : isTablet ? 17 : 19;

  // Card width fills the row minus padding and gaps
  const cardW = (contentW - GRID_H_PAD * 2 - GRID_GAP * (cols - 1)) / cols;

  // Hero height — keep it compact so the grid is always visible
  const heroH = Math.round(
    screenHeight * (isDesktop ? 0.19 : isTablet ? 0.22 : 0.23),
  );

  // Hero font
  const heroFs = isDesktop ? 20 : isTablet ? 21 : screenWidth >= 414 ? 20 : 18;

  // ─── Hero autoplay ─────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => {
      const next = (heroIdxRef.current + 1) % HERO_SLIDES.length;
      heroListRef.current?.scrollToIndex({ index: next, animated: true });
      heroIdxRef.current = next;
      setHeroIdx(next);
    }, HERO_AUTO_MS);
    return () => clearInterval(timer);
  }, []);

  // ─── Navigation helpers ────────────────────────────────────────────────────
  const goHero = useCallback((idx: number) => {
    heroListRef.current?.scrollToIndex({ index: idx, animated: true });
    heroIdxRef.current = idx;
    setHeroIdx(idx);
  }, []);

  const goPage = useCallback(
    (idx: number) => {
      featScrollRef.current?.scrollTo({ x: contentW * idx, animated: true });
      setCurrentPage(idx);
    },
    [contentW],
  );

  const onFeatScroll = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x;
  });

  const openFeature = useCallback(
    async (item: FeatureItem) => {
      await Haptics.selectionAsync();
      if (!isAuthenticated && item.requiresAuth) {
        router.push("/login");
        return;
      }
      router.push(item.route);
    },
    [isAuthenticated, router],
  );

  const onChipPress = useCallback(
    async (chip: PopularChip) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const feat = PAGES.flatMap((p) => p.items).find(
        (i) => i.key === chip.featureKey,
      );
      if (!feat) return;
      if (!isAuthenticated && chip.requiresAuth) {
        router.push("/login");
        return;
      }
      router.push(feat.route);
    },
    [isAuthenticated, router],
  );

  const getFeatureLabel = useCallback(
    (featureKey: string) => t(`features.items.${featureKey}`),
    [t],
  );

  const getChipLabel = useCallback(
    (chipKey: string) => t(`features.chips.${chipKey}`),
    [t],
  );

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <View style={styles.page}>
        {/* ━━ Hero banner ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <View
          style={[
            styles.heroContainer,
            { width: contentW, paddingHorizontal: HERO_H_PAD },
          ]}
        >
          <FlatList
            bounces={false}
            data={HERO_SLIDES}
            decelerationRate="fast"
            getItemLayout={(_, i) => ({
              length: heroW,
              offset: heroW * i,
              index: i,
            })}
            horizontal
            keyExtractor={(s) => s.key}
            onMomentumScrollEnd={(e) => {
              const idx = Math.max(
                0,
                Math.min(
                  Math.round(e.nativeEvent.contentOffset.x / heroW),
                  HERO_SLIDES.length - 1,
                ),
              );
              heroIdxRef.current = idx;
              setHeroIdx(idx);
            }}
            onScrollToIndexFailed={({ index }) =>
              setTimeout(
                () =>
                  heroListRef.current?.scrollToOffset({
                    offset: heroW * index,
                    animated: true,
                  }),
                100,
              )
            }
            pagingEnabled
            ref={heroListRef}
            renderItem={({ item }) => (
              <ImageBackground
                imageStyle={styles.heroImgStyle}
                source={{ uri: item.image }}
                style={[styles.heroImg, { width: heroW, height: heroH }]}
              >
                <LinearGradient
                  colors={["rgba(5,10,30,0.05)", "rgba(5,10,30,0.80)"]}
                  end={{ x: 0.85, y: 1 }}
                  start={{ x: 0.15, y: 0 }}
                  style={styles.heroGrad}
                >
                  <View style={styles.heroBadgeWrap}>
                    <Text style={styles.heroBadgeText}>
                      {item.badgePrefix} {t(item.badgeKey)}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.heroTitle,
                      { fontSize: heroFs, lineHeight: heroFs * 1.28 },
                    ]}
                  >
                    {t(item.titleKey)}
                  </Text>
                  <Text style={styles.heroSubtitle}>{t(item.subtitleKey)}</Text>
                </LinearGradient>
              </ImageBackground>
            )}
            scrollEventThrottle={16}
            showsHorizontalScrollIndicator={false}
          />

          <View accessibilityLabel={t("home.heroSlidesA11y")} style={styles.heroDots}>
            {HERO_SLIDES.map((s, i) => (
              <Pressable hitSlop={10} key={s.key} onPress={() => goHero(i)}>
                <HeroDot active={i === heroIdx} />
              </Pressable>
            ))}
          </View>
        </View>

        {/* ━━ Feature section card ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <View
          style={[styles.sectionCard, styles.featureFlex, { width: contentW }]}
        >
          {/* Title/subtitle reflects the active page */}
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>
              {t(`home.pages.${currentPage}.title`)}
            </Text>
            <Text style={styles.sectionSub}>
              {t(`home.pages.${currentPage}.subtitle`)}
            </Text>
          </View>

          {/*
           * Horizontal paging ScrollView — NO nested FlatList,
           * so no VirtualizedList warning. Each page is a View with
           * View-rows built by chunkArray (professional grid pattern).
           */}
          <Animated.ScrollView
            bounces={false}
            horizontal
            onMomentumScrollEnd={(e) => {
              const p = Math.max(
                0,
                Math.min(
                  Math.round(e.nativeEvent.contentOffset.x / contentW),
                  PAGES.length - 1,
                ),
              );
              setCurrentPage(p);
            }}
            onScroll={onFeatScroll}
            pagingEnabled
            ref={featScrollRef as Ref<ScrollView>}
            scrollEventThrottle={16}
            showsHorizontalScrollIndicator={false}
          >
            {PAGES.map((page) => {
              const rows = chunkArray(page.items, cols);
              return (
                <View
                  key={page.title}
                  style={{
                    width: contentW,
                    paddingHorizontal: GRID_H_PAD,
                    paddingBottom: GRID_H_PAD,
                  }}
                >
                  {rows.map((row, ri) => (
                    <View
                      key={ri}
                      style={[
                        styles.gridRow,
                        ri > 0 && { marginTop: GRID_GAP },
                      ]}
                    >
                      {row.map((feat) => (
                        <FeatureCard
                          key={feat.key}
                          item={{ ...feat, label: getFeatureLabel(feat.key) }}
                          width={cardW}
                          cardH={CARD_H}
                          iconCircleSize={iconCircleSize}
                          iconSize={iconSize}
                          onPress={openFeature}
                        />
                      ))}
                      {/* Invisible fill so last row left-aligns */}
                      {row.length < cols &&
                        Array.from({ length: cols - row.length }).map(
                          (_, ei) => (
                            <View key={`fill-${ei}`} style={{ width: cardW }} />
                          ),
                        )}
                    </View>
                  ))}
                </View>
              );
            })}
          </Animated.ScrollView>

          {/* Page dots */}
          <View style={styles.pageDots}>
            {PAGES.map((_, i) => (
              <Pressable
                hitSlop={10}
                key={`pd-${i}`}
                onPress={() => goPage(i)}
                style={styles.dotHit}
              >
                <PageDot index={i} pageWidth={contentW} scrollX={scrollX} />
              </Pressable>
            ))}
          </View>
        </View>

        {/* ━━ Popular chips ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <View style={[styles.chipsSection, { width: contentW }]}>
          <Text style={styles.chipsTitle}>{t("home.popularNearYou")}</Text>
          <ScrollView
            contentContainerStyle={styles.chips}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {PAGES[currentPage]?.popularChips.map((chip) => (
              <Pressable
                accessibilityLabel={getChipLabel(chip.key)}
                accessibilityRole="button"
                hitSlop={8}
                key={chip.key}
                onPress={() => onChipPress(chip)}
                style={styles.chip}
              >
                <Text style={styles.chipText}>{getChipLabel(chip.key)}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ─── Root ────────────────────────────────────────────────────────────────
  safe: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  /** Single-page no-scroll container */
  page: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 8,
  },
  /** Lets the feature card grow to fill remaining vertical space */
  featureFlex: {
    flex: 1,
  },

  // ─── Hero banner ──────────────────────────────────────────────────────────
  heroContainer: {
    alignSelf: "center",
    marginBottom: 10,
  },
  heroImg: {
    borderRadius: 12,
    overflow: "hidden",
  },
  heroImgStyle: {
    borderRadius: 12,
  },
  heroGrad: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 14,
  },
  heroBadgeWrap: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 99,
    marginBottom: 6,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  heroBadgeText: {
    color: "#FAFCFF",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.7,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontWeight: "800",
    maxWidth: "88%",
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
    maxWidth: "90%",
  },
  heroDots: {
    alignItems: "center",
    columnGap: 6,
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
  },
  heroDot: {
    backgroundColor: "#E5E7EB",
    borderRadius: 99,
    height: 6,
    width: 6,
  },
  heroDotActive: {
    backgroundColor: "#3B82F6",
    width: 18,
  },

  // ─── Feature section card ─────────────────────────────────────────────────
  sectionCard: {
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    paddingTop: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#162050",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 14,
      },
      android: { elevation: 5 },
      web: {
        boxShadow: "0 4px 14px rgba(22,32,80,0.10)",
      } as object,
    }),
  },
  sectionHead: {
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  sectionTitle: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  sectionSub: {
    color: "#6B7280",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },

  // ─── Feature grid ─────────────────────────────────────────────────────────
  gridRow: {
    columnGap: 8,
    flexDirection: "row",
  },
  cardShell: {
    // height injected as inline style from the component
  },
  featureCard: {
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderColor: "rgba(100,130,250,0.1)",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    rowGap: 5,
    ...Platform.select({
      ios: {
        shadowColor: "#162050",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
      web: {
        boxShadow: "0 2px 6px rgba(22,32,80,0.07)",
      } as object,
    }),
  },
  iconCircle: {
    alignItems: "center",
    justifyContent: "center",
    // height/width/borderRadius injected as inline style from card props
  },
  featureLabel: {
    color: "#111827",
    fontSize: 10,
    fontWeight: "700",
    paddingHorizontal: 3,
    textAlign: "center",
  },

  // ─── Page pagination dots ─────────────────────────────────────────────────
  pageDots: {
    alignItems: "center",
    columnGap: 4,
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 10,
  },
  dotHit: {
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  pageDot: {
    backgroundColor: "#3B82F6",
    borderRadius: 99,
    height: 6,
  },

  // ─── Popular chips ────────────────────────────────────────────────────────
  chipsSection: {
    alignSelf: "center",
  },
  chipsTitle: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  chips: {
    columnGap: 7,
    flexDirection: "row",
    paddingBottom: 4,
  },
  chip: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(82,114,255,0.2)",
    borderRadius: 99,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 32,
    paddingHorizontal: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#162050",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
      web: {
        boxShadow: "0 2px 6px rgba(22,32,80,0.07)",
      } as object,
    }),
  },
  chipText: {
    color: "#3B82F6",
    fontSize: 11.5,
    fontWeight: "600",
  },
});
