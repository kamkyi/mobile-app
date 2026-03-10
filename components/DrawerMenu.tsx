import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useDrawer } from "@/context/DrawerContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  resolveAppLanguage,
  setAppLanguage,
  SUPPORTED_LANGUAGES,
  type AppLanguage,
} from "@/i18n";

// ─── Types ───────────────────────────────────────────────────────────────────

type NavItem = {
  key: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  route?: string;
  onPress?: () => void;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function formatAuthMethod(method?: string): string {
  if (!method) return "";
  if (method === "GoogleOAuth") return "Google";
  if (method === "MicrosoftOAuth") return "Microsoft";
  if (method === "GitHubOAuth") return "GitHub";
  return method
    .replace(/OAuth$/, "")
    .replace(/([A-Z])/g, " $1")
    .trim();
}

function formatDate(iso: string | undefined, locale: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getAuthMethodIcon(
  method?: string,
): React.ComponentProps<typeof Ionicons>["name"] {
  if (method === "GoogleOAuth") return "logo-google";
  if (method === "MicrosoftOAuth") return "logo-microsoft";
  if (method === "GitHubOAuth") return "logo-github";
  return "log-in-outline";
}

// ─── Avatar ──────────────────────────────────────────────────────────────────

function Avatar({
  uri,
  name,
  size,
  palette,
}: {
  uri?: string;
  name: string;
  size: number;
  palette: ColorPalette;
}) {
  const initials = getInitials(name);

  if (uri) {
    return (
      <View
        style={[
          styles.avatarWrapper,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: palette.avatarBorder,
          },
        ]}
      >
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          contentFit="cover"
          transition={200}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.avatarFallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: palette.accent,
          borderColor: palette.avatarBorder,
        },
      ]}
    >
      <Text style={[styles.avatarInitials, { fontSize: size * 0.36 }]}>
        {initials}
      </Text>
    </View>
  );
}

// ─── Nav Item ─────────────────────────────────────────────────────────────────

function NavRow({
  item,
  onPress,
  active,
  palette,
}: {
  item: NavItem;
  onPress: () => void;
  active: boolean;
  palette: ColorPalette;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.navRow,
        active && { backgroundColor: palette.navActive },
        pressed && { opacity: 0.7 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={item.label}
    >
      <View
        style={[
          styles.navIconWrap,
          { backgroundColor: active ? palette.accent : palette.navIconBg },
        ]}
      >
        <Ionicons
          name={item.icon}
          size={18}
          color={active ? "#fff" : palette.navIconColor}
        />
      </View>
      <Text
        style={[
          styles.navLabel,
          { color: active ? palette.accent : palette.text },
          active && { fontWeight: "700" },
        ]}
      >
        {item.label}
      </Text>
      {active && (
        <View
          style={[styles.navActiveDot, { backgroundColor: palette.accent }]}
        />
      )}
    </Pressable>
  );
}

// ─── Colour palettes ─────────────────────────────────────────────────────────

type ColorPalette = {
  bg: string;
  surface: string;
  text: string;
  subtext: string;
  divider: string;
  accent: string;
  navActive: string;
  navIconBg: string;
  navIconColor: string;
  badgeBg: string;
  badgeText: string;
  headerGradientStart: string;
  headerGradientEnd: string;
  avatarBorder: string;
  overlay: string;
};

function usePalette(colorScheme: "light" | "dark"): ColorPalette {
  const dark = colorScheme === "dark";
  return {
    bg: dark ? "#0F1117" : "#FFFFFF",
    surface: dark ? "#1A1D27" : "#F8FAFC",
    text: dark ? "#E8EAED" : "#111827",
    subtext: dark ? "#8A8FA8" : "#6B7280",
    divider: dark ? "#2A2D3A" : "#E5E7EB",
    accent: "#3B82F6",
    navActive: dark ? "#1E2235" : "#F8FAFC",
    navIconBg: dark ? "#252836" : "#F8FAFC",
    navIconColor: dark ? "#8A8FA8" : "#6B7280",
    badgeBg: dark ? "#1E3A2A" : "#DCFCE7",
    badgeText: dark ? "#4ADE80" : "#16A34A",
    headerGradientStart: dark ? "#1A1B2E" : "#0A2540",
    headerGradientEnd: dark ? "#252836" : "#3B82F6",
    avatarBorder: dark ? "#3A3D52" : "#FFFFFF",
    overlay: "rgba(0,0,0,0.55)",
  };
}

// ─── Main Drawer ──────────────────────────────────────────────────────────────

const DRAWER_WIDTH_FRACTION = 0.8;
const SPRING_CONFIG = { damping: 22, stiffness: 200, mass: 1 };

export default function DrawerMenu() {
  const { isOpen, close } = useDrawer();
  const { user, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const { t, i18n } = useTranslation();
  const palette = usePalette(colorScheme ?? "light");
  const activeLanguage = resolveAppLanguage(i18n.resolvedLanguage ?? i18n.language);

  const drawerWidth = Math.min(screenWidth * DRAWER_WIDTH_FRACTION, 320);

  // ─── Keep modal mounted during closing animation ───────────────────────────
  const [modalVisible, setModalVisible] = useState(false);

  // ─── Animation ────────────────────────────────────────────────────────────
  const translateX = useSharedValue(-drawerWidth);
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    if (isOpen) {
      setModalVisible(true);
      translateX.value = withSpring(0, SPRING_CONFIG);
      overlayOpacity.value = withTiming(1, { duration: 280 });
    } else {
      translateX.value = withSpring(-drawerWidth, SPRING_CONFIG);
      overlayOpacity.value = withTiming(0, { duration: 220 }, (finished) => {
        if (finished) runOnJS(setModalVisible)(false);
      });
    }
  }, [isOpen, drawerWidth, translateX, overlayOpacity]);

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  // ─── Navigation items ────────────────────────────────────────────────────
  const navItems: NavItem[] = [
    {
      key: "home",
      label: t("drawer.nav.home"),
      icon: "home-outline",
      route: "/",
    },
    {
      key: "explore",
      label: t("drawer.nav.explore"),
      icon: "compass-outline",
      route: "/(tabs)/explore",
    },
    {
      key: "settings",
      label: t("drawer.nav.settings"),
      icon: "settings-outline",
    },
    {
      key: "notifications",
      label: t("drawer.nav.notifications"),
      icon: "notifications-outline",
    },
  ];

  const handleNavPress = (item: NavItem) => {
    close();
    if (item.route) {
      setTimeout(() => router.push(item.route as never), 250);
    }
  };

  const handleLogout = () => {
    close();
    setTimeout(() => logout(), 300);
  };

  const handleLanguagePress = (language: AppLanguage) => {
    void setAppLanguage(language);
  };

  if (!modalVisible) return null;

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={close}
    >
      {/* Overlay */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.overlay,
          { backgroundColor: palette.overlay },
          overlayStyle,
        ]}
        pointerEvents={isOpen ? "auto" : "none"}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>

      {/* Drawer Panel */}
      <Animated.View
        style={[
          styles.panel,
          panelStyle,
          {
            width: drawerWidth,
            backgroundColor: palette.bg,
            paddingBottom: insets.bottom + 16,
          },
        ]}
      >
        {/* ── Header / Profile Banner ───────────────────── */}
        <View
          style={[
            styles.profileHeader,
            {
              paddingTop: insets.top + 20,
              backgroundColor: palette.headerGradientStart,
            },
          ]}
        >
          {/* Close Button */}
          <Pressable
            onPress={close}
            style={styles.closeBtn}
            hitSlop={12}
            accessibilityLabel={t("drawer.closeMenuA11y")}
          >
            <Ionicons name="close" size={22} color="rgba(255,255,255,0.85)" />
          </Pressable>

          {/* Avatar */}
          <Avatar
            uri={user?.profilePictureUrl}
            name={user?.name ?? "User"}
            size={72}
            palette={palette}
          />

          {/* Name */}
          <Text style={styles.profileName} numberOfLines={1}>
            {user?.name ?? t("common.appName")}
          </Text>

          {/* Email + verified badge */}
          <View style={styles.emailRow}>
            <Text style={styles.profileEmail} numberOfLines={1}>
              {user?.email ?? ""}
            </Text>
            {user?.emailVerified && (
              <View
                style={[
                  styles.verifiedBadge,
                  { backgroundColor: "rgba(74,222,128,0.2)" },
                ]}
              >
                <Ionicons name="checkmark-circle" size={12} color="#4ADE80" />
                <Text style={styles.verifiedText}>{t("drawer.verified")}</Text>
              </View>
            )}
          </View>

          {/* Auth method chip */}
          {user?.authenticationMethod && (
            <View style={styles.authMethodChip}>
              <Ionicons
                name={getAuthMethodIcon(user.authenticationMethod)}
                size={13}
                color="rgba(255,255,255,0.8)"
              />
              <Text style={styles.authMethodText}>
                {formatAuthMethod(user.authenticationMethod)}
              </Text>
            </View>
          )}
        </View>

        {/* ── User Info Card ────────────────────────────── */}
        <View
          style={[
            styles.infoCard,
            { backgroundColor: palette.surface, borderColor: palette.divider },
          ]}
        >
          {user?.locale && (
            <View style={styles.infoRow}>
              <Ionicons
                name="globe-outline"
                size={15}
                color={palette.subtext}
              />
              <Text style={[styles.infoLabel, { color: palette.subtext }]}>
                {t("drawer.locale")}
              </Text>
              <Text style={[styles.infoValue, { color: palette.text }]}>
                {user.locale}
              </Text>
            </View>
          )}
          {user?.createdAt && (
            <View style={styles.infoRow}>
              <Ionicons
                name="calendar-outline"
                size={15}
                color={palette.subtext}
              />
              <Text style={[styles.infoLabel, { color: palette.subtext }]}>
                {t("drawer.memberSince")}
              </Text>
              <Text style={[styles.infoValue, { color: palette.text }]}>
                {formatDate(user.createdAt, i18n.resolvedLanguage ?? "en")}
              </Text>
            </View>
          )}
        </View>

        <View
          style={[
            styles.languageCard,
            { backgroundColor: palette.surface, borderColor: palette.divider },
          ]}
        >
          <Text style={[styles.sectionLabel, styles.languageLabel, { color: palette.subtext }]}>
            {t("language.sectionTitle").toUpperCase()}
          </Text>
          <View style={styles.languageOptions}>
            {SUPPORTED_LANGUAGES.map((language) => {
              const selected = activeLanguage === language;
              const languageName = t(`language.${language}`);
              const shortKey =
                language === "en"
                  ? "shortEn"
                  : language === "my"
                    ? "shortMy"
                    : language === "zh"
                      ? "shortZh"
                      : "shortTh";

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={languageName}
                  key={language}
                  onPress={() => handleLanguagePress(language)}
                  style={({ pressed }) => [
                    styles.languageChip,
                    {
                      backgroundColor: selected
                        ? "rgba(59,130,246,0.15)"
                        : "rgba(148,163,184,0.1)",
                      borderColor: selected
                        ? "rgba(59,130,246,0.5)"
                        : "rgba(148,163,184,0.3)",
                    },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text
                    style={[
                      styles.languageChipText,
                      { color: selected ? palette.accent : palette.text },
                    ]}
                  >
                    {t(`language.${shortKey}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Divider ───────────────────────────────────── */}
        <View style={[styles.divider, { backgroundColor: palette.divider }]} />

        {/* ── Navigation ────────────────────────────────── */}
        <View style={styles.navSection}>
          <Text style={[styles.sectionLabel, { color: palette.subtext }]}>
            {t("drawer.navigation").toUpperCase()}
          </Text>
          {navItems.map((item) => (
            <NavRow
              key={item.key}
              item={item}
              onPress={() => handleNavPress(item)}
              active={false}
              palette={palette}
            />
          ))}
        </View>

        {/* ── Spacer ────────────────────────────────────── */}
        <View style={{ flex: 1 }} />

        {/* ── Divider ───────────────────────────────────── */}
        <View style={[styles.divider, { backgroundColor: palette.divider }]} />

        {/* ── Footer ────────────────────────────────────── */}
        <View style={styles.footer}>
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.logoutBtn,
              pressed && { opacity: 0.75 },
            ]}
            accessibilityLabel={t("drawer.logOutA11y")}
            accessibilityRole="button"
          >
            <View style={styles.logoutIconWrap}>
              <Ionicons name="log-out-outline" size={18} color="#EF4444" />
            </View>
            <Text style={styles.logoutLabel}>{t("drawer.logOut")}</Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color="#EF4444"
              style={{ marginLeft: "auto" }}
            />
          </Pressable>

          <Text style={[styles.footerVersion, { color: palette.subtext }]}>
            {t("common.appName")} · v1.0.0
          </Text>
        </View>
      </Animated.View>
    </Modal>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    zIndex: 1,
  },
  panel: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 2,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 24,
    overflow: "hidden",
  },

  // ── Profile header
  profileHeader: {
    paddingHorizontal: 20,
    paddingBottom: 22,
    alignItems: "flex-start",
  },
  closeBtn: {
    alignSelf: "flex-end",
    marginBottom: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarWrapper: {
    borderWidth: 2.5,
    marginBottom: 14,
    overflow: "hidden",
  },
  avatarFallback: {
    borderWidth: 2.5,
    marginBottom: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 1,
  },
  profileName: {
    fontSize: 19,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  emailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  profileEmail: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    letterSpacing: 0.1,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 20,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4ADE80",
  },
  authMethodChip: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignSelf: "flex-start",
  },
  authMethodText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.85)",
  },

  // ── Info card
  infoCard: {
    marginHorizontal: 14,
    marginTop: 14,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 14,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    flex: 1,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  languageCard: {
    marginHorizontal: 14,
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 10,
  },
  languageLabel: {
    marginBottom: 0,
    marginLeft: 0,
    letterSpacing: 0.7,
  },
  languageOptions: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  languageChip: {
    minWidth: 56,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  languageChipText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  // ── Divider
  divider: {
    height: 1,
    marginVertical: 12,
    marginHorizontal: 14,
  },

  // ── Nav section
  navSection: {
    paddingHorizontal: 14,
    gap: 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 6,
    marginLeft: 4,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 12,
  },
  navIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  navLabel: {
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
  },
  navActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // ── Footer
  footer: {
    paddingHorizontal: 14,
    paddingTop: 4,
    gap: 10,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 12,
    backgroundColor: "rgba(239,68,68,0.08)",
  },
  logoutIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,68,68,0.12)",
  },
  logoutLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#EF4444",
  },
  footerVersion: {
    fontSize: 11,
    textAlign: "center",
    paddingBottom: 4,
  },
});
