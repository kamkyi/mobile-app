import type { ComponentProps } from "react";

import { Ionicons } from "@expo/vector-icons";

export const DEFAULT_ELECTRONICS_COINS = 1280;
export const MAX_ROLE_GALLERY_IMAGES = 4;
export const MAX_SHOP_PRODUCT_IMAGES = 4;

export const PROFILE_MODE_ORDER = [
  "dater",
  "doctor",
  "driver",
  "shop-owner",
] as const;

export type ManagedProfileMode = (typeof PROFILE_MODE_ORDER)[number];

export type ProfileModeCard = {
  id: string;
  title: string;
  body: string;
  meta: string;
  accentColor: string;
  iconName: ComponentProps<typeof Ionicons>["name"];
};

export const PROFILE_MODE_CONFIG: Record<
  ManagedProfileMode,
  {
    accentColor: string;
    emptyGalleryLabel: string;
    headline: string;
    iconName: ComponentProps<typeof Ionicons>["name"];
    summary: string;
    tabLabel: string;
  }
> = {
  dater: {
    accentColor: "#DB2777",
    emptyGalleryLabel: "Add up to 4 profile or vibe photos for your dating mode.",
    headline: "Dating requests",
    iconName: "heart-outline",
    summary: "People looking for a respectful date are shown here.",
    tabLabel: "Dating",
  },
  doctor: {
    accentColor: "#0EA5E9",
    emptyGalleryLabel: "Add up to 4 clinic or practice photos for your doctor mode.",
    headline: "Patient requests",
    iconName: "medkit-outline",
    summary: "Patients who want appointments appear in this tab.",
    tabLabel: "Doctor",
  },
  driver: {
    accentColor: "#2563EB",
    emptyGalleryLabel: "Add up to 4 transport or vehicle photos for your driver mode.",
    headline: "Driver hiring requests",
    iconName: "car-sport-outline",
    summary: "People looking to hire a driver appear here.",
    tabLabel: "Driver",
  },
  "shop-owner": {
    accentColor: "#F59E0B",
    emptyGalleryLabel: "Add up to 4 business photos for your shop mode.",
    headline: "Shop products",
    iconName: "storefront-outline",
    summary: "Create products, manage photos, and show your shop identity here.",
    tabLabel: "Shop",
  },
};

export const PROFILE_MODE_ACTIVITY: Record<ManagedProfileMode, ProfileModeCard[]> = {
  dater: [
    {
      id: "dater-1",
      title: "Mia wants a dinner date",
      body: "Prefers calm conversation, Friday night, and a verified dater profile.",
      meta: "2 km away • Tonight",
      accentColor: "#DB2777",
      iconName: "wine-outline",
    },
    {
      id: "dater-2",
      title: "Noah is looking for a serious match",
      body: "Wants a dater who likes books, coffee, and weekend walks.",
      meta: "Online now • 5 mutual interests",
      accentColor: "#EC4899",
      iconName: "heart-circle-outline",
    },
    {
      id: "dater-3",
      title: "Ava wants a weekend meetup",
      body: "Open to movies, a casual cafe, and future relationship goals.",
      meta: "4 km away • Saturday",
      accentColor: "#F472B6",
      iconName: "chatbubble-ellipses-outline",
    },
  ],
  doctor: [
    {
      id: "doctor-1",
      title: "Nila needs a skin consultation",
      body: "Looking for a doctor profile to review allergy symptoms this week.",
      meta: "New patient • 10:30 AM request",
      accentColor: "#0EA5E9",
      iconName: "medkit-outline",
    },
    {
      id: "doctor-2",
      title: "Ko Min wants a follow-up visit",
      body: "Requested a review after last month’s prescription update.",
      meta: "Returning patient • Tomorrow",
      accentColor: "#38BDF8",
      iconName: "calendar-outline",
    },
    {
      id: "doctor-3",
      title: "Thiri needs a home visit",
      body: "Needs a nearby doctor for a family check-in and care advice.",
      meta: "3 km away • Home visit",
      accentColor: "#0284C7",
      iconName: "home-outline",
    },
  ],
  driver: [
    {
      id: "driver-1",
      title: "Family airport transfer needed",
      body: "Pickup at 5:30 AM with room for 4 passengers and 5 bags.",
      meta: "Airport job • Monday",
      accentColor: "#2563EB",
      iconName: "car-outline",
    },
    {
      id: "driver-2",
      title: "Office manager needs a private driver",
      body: "Recurring weekday schedule for school drop-off and downtown meetings.",
      meta: "Monthly contract • 8 km route",
      accentColor: "#1D4ED8",
      iconName: "briefcase-outline",
    },
    {
      id: "driver-3",
      title: "Tourist couple wants city driving help",
      body: "Half-day city tour with a polite driver who knows local stops.",
      meta: "Tour booking • Saturday",
      accentColor: "#3B82F6",
      iconName: "map-outline",
    },
  ],
  "shop-owner": [
    {
      id: "shop-owner-1",
      title: "Customers are browsing your newest products",
      body: "Keep your featured images fresh so they match your active business mode.",
      meta: "Shop insight • Updated now",
      accentColor: "#F59E0B",
      iconName: "sparkles-outline",
    },
    {
      id: "shop-owner-2",
      title: "Merchants nearby are promoting seasonal bundles",
      body: "Add product images and price points to stay visible in the profile feed.",
      meta: "Shop trend • This week",
      accentColor: "#FBBF24",
      iconName: "pricetags-outline",
    },
  ],
};

export const SHOP_OWNER_SAMPLE_PRODUCTS = [
  {
    id: "sample-product-1",
    title: "Glow Serum Set",
    description: "Best-selling skincare bundle for customers who want a fast routine.",
    price: 39,
    imageUris: [
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=900&q=80",
    ],
    createdAt: "2026-03-01T00:00:00.000Z",
  },
  {
    id: "sample-product-2",
    title: "Daily Driver Interior Care",
    description: "A compact cleaning pack for busy drivers and ride-share owners.",
    price: 22,
    imageUris: [
      "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&w=900&q=80",
    ],
    createdAt: "2026-03-03T00:00:00.000Z",
  },
] as const;
