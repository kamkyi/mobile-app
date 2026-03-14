import type { ComponentProps } from "react";

import { Ionicons } from "@expo/vector-icons";

export type NearbyService = {
  id: string;
  title: string;
  subtitle: string;
  eta: string;
  distanceKm: number;
  icon: ComponentProps<typeof Ionicons>["name"];
  route?: `/feature/${string}`;
  accent: string;
};

export const NEARBY_SERVICES: NearbyService[] = [
  {
    id: "dating",
    title: "Dating",
    subtitle: "Nearby profiles and quick meetups",
    eta: "8 min away",
    distanceKm: 1.2,
    icon: "heart-outline",
    route: "/feature/dating",
    accent: "#DB2777",
  },
  {
    id: "car-rental",
    title: "Car Rental",
    subtitle: "Cars ready for local pickup",
    eta: "12 min away",
    distanceKm: 2.4,
    icon: "car-sport-outline",
    route: "/feature/car-rental",
    accent: "#F97316",
  },
  {
    id: "hostel-rental",
    title: "Hostel Rental",
    subtitle: "Budget rooms and short stays",
    eta: "15 min away",
    distanceKm: 2.8,
    icon: "bed-outline",
    accent: "#7C3AED",
  },
  {
    id: "bike-rental",
    title: "Bike Rental",
    subtitle: "Daily bikes for city movement",
    eta: "6 min away",
    distanceKm: 0.9,
    icon: "bicycle-outline",
    accent: "#0EA5E9",
  },
  {
    id: "myanmar-foods",
    title: "Myanmar Foods",
    subtitle: "Mohinga, noodles, tea shops, and grills",
    eta: "10 min away",
    distanceKm: 1.7,
    accent: "#059669",
    icon: "restaurant-outline",
  },
  {
    id: "thai-foods",
    title: "Thai Foods",
    subtitle: "Street food and local favorites nearby",
    eta: "7 min away",
    distanceKm: 1.1,
    accent: "#DC2626",
    icon: "nutrition-outline",
  },
];
