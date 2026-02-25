import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

export type FeatureItem = {
  key: string;
  label: string;
  iconName: ComponentProps<typeof Ionicons>["name"];
  route: `/feature/${string}`;
  requiresAuth: boolean;
  /** Hex colour used for the icon tint and a soft-tinted circle background */
  color: string;
};

export type PopularChip = {
  key: string;
  label: string;
  featureKey: string;
  requiresAuth: boolean;
};

export type FeaturePage = {
  title: string;
  subtitle: string;
  items: FeatureItem[];
  popularChips: PopularChip[];
};

export const PAGES: FeaturePage[] = [
  {
    title: "Essentials",
    subtitle: "Everything you need for everyday city life",
    items: [
      {
        key: "car-rental",
        label: "Car Rental",
        iconName: "car-sport-outline",
        route: "/feature/car-rental",
        requiresAuth: true,
        color: "#FF6B2B",
      },
      {
        key: "nearby",
        label: "Nearby",
        iconName: "navigate-outline",
        route: "/feature/nearby",
        requiresAuth: true,
        color: "#10B981",
      },
      {
        key: "dating",
        label: "Dating",
        iconName: "heart-outline",
        route: "/feature/dating",
        requiresAuth: true,
        color: "#F43F5E",
      },
      {
        key: "visit",
        label: "Visit",
        iconName: "map-outline",
        route: "/feature/visit",
        requiresAuth: true,
        color: "#8B5CF6",
      },
      {
        key: "food",
        label: "Food",
        iconName: "restaurant-outline",
        route: "/feature/food",
        requiresAuth: true,
        color: "#EF4444",
      },
      {
        key: "delivery",
        label: "Delivery",
        iconName: "bicycle-outline",
        route: "/feature/delivery",
        requiresAuth: true,
        color: "#2563EB",
      },
    ],
    popularChips: [
      {
        key: "plumber",
        label: "Plumber",
        featureKey: "nearby",
        requiresAuth: true,
      },
      {
        key: "myanmar-food",
        label: "Myanmar Food",
        featureKey: "food",
        requiresAuth: true,
      },
      {
        key: "massage",
        label: "Massage",
        featureKey: "nearby",
        requiresAuth: true,
      },
      {
        key: "cleaning",
        label: "Cleaning",
        featureKey: "delivery",
        requiresAuth: true,
      },
    ],
  },
  {
    title: "Services",
    subtitle: "Book trusted services in a few taps",
    items: [
      {
        key: "doctor",
        label: "Doctor",
        iconName: "medkit-outline",
        route: "/feature/doctor",
        requiresAuth: true,
        color: "#06B6D4",
      },
      {
        key: "beauty",
        label: "Beauty",
        iconName: "sparkles-outline",
        route: "/feature/beauty",
        requiresAuth: true,
        color: "#EC4899",
      },
      {
        key: "fitness",
        label: "Fitness",
        iconName: "barbell-outline",
        route: "/feature/fitness",
        requiresAuth: true,
        color: "#F59E0B",
      },
      {
        key: "shopping",
        label: "Shopping",
        iconName: "bag-handle-outline",
        route: "/feature/shopping",
        requiresAuth: true,
        color: "#7C3AED",
      },
      {
        key: "travel",
        label: "Travel",
        iconName: "airplane-outline",
        route: "/feature/travel",
        requiresAuth: true,
        color: "#0EA5E9",
      },
      {
        key: "support",
        label: "Support",
        iconName: "chatbubbles-outline",
        route: "/feature/support",
        requiresAuth: true,
        color: "#22C55E",
      },
    ],
    popularChips: [
      {
        key: "tire-service",
        label: "Tire Service",
        featureKey: "car-rental",
        requiresAuth: true,
      },
      {
        key: "haircut",
        label: "Haircut",
        featureKey: "beauty",
        requiresAuth: true,
      },
      {
        key: "airport-ride",
        label: "Airport Ride",
        featureKey: "travel",
        requiresAuth: true,
      },
      {
        key: "pharmacy",
        label: "Pharmacy",
        featureKey: "doctor",
        requiresAuth: true,
      },
    ],
  },
];

export const FEATURE_MAP = Object.fromEntries(
  PAGES.flatMap((page) => page.items.map((item) => [item.key, item])),
) as Record<string, FeatureItem>;
