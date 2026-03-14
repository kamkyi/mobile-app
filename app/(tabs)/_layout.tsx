import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { HapticTab } from "@/components/haptic-tab";

const TAB_ICON_MAP = {
  home: "home",
  explore: "compass",
  timeline: "time",
  linked: "people",
  profile: "person",
} as const;

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#1877F2",
        tabBarInactiveTintColor: "#64748B",
        tabBarButton: HapticTab,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
        },
        tabBarStyle: {
          height: 68,
          paddingTop: 8,
          paddingBottom: 10,
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E2E8F0",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Ionicons color={color} name={TAB_ICON_MAP.home} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color }) => (
            <Ionicons color={color} name={TAB_ICON_MAP.explore} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="timeline"
        options={{
          title: "Timeline",
          tabBarIcon: ({ color }) => (
            <Ionicons color={color} name={TAB_ICON_MAP.timeline} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="linked"
        options={{
          title: "Linked",
          tabBarIcon: ({ color }) => (
            <Ionicons color={color} name={TAB_ICON_MAP.linked} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <Ionicons color={color} name={TAB_ICON_MAP.profile} size={22} />
          ),
        }}
      />
    </Tabs>
  );
}
