export const THAILAND_LOCATIONS = [
  "Bangkok",
  "Chiang Mai",
  "Phuket",
  "Pattaya",
  "Krabi",
  "Hat Yai",
] as const;

export const CAR_BRANDS = [
  "Toyota",
  "Honda",
  "Nissan",
  "Mazda",
  "BYD",
  "BMW",
] as const;

export type ThaiLocation = (typeof THAILAND_LOCATIONS)[number];
export type CarBrand = (typeof CAR_BRANDS)[number];

export type CarRentalItem = {
  id: string;
  name: string;
  brand: CarBrand;
  location: ThaiLocation;
  seats: number;
  transmission: "Automatic" | "Manual";
  fuel: "Petrol" | "Hybrid" | "EV";
  pricePerDayTHB: number;
  rating: number;
  trips: number;
  availableFrom: string; // ISO date: YYYY-MM-DD
  availableTo: string; // ISO date: YYYY-MM-DD
  gradient: readonly [string, string];
  imageUrl: string;
};

export const CAR_RENTAL_ITEMS: CarRentalItem[] = [
  {
    id: "toyota-yaris-bangkok",
    name: "Toyota Yaris ATIV",
    brand: "Toyota",
    location: "Bangkok",
    seats: 5,
    transmission: "Automatic",
    fuel: "Petrol",
    pricePerDayTHB: 980,
    rating: 4.8,
    trips: 640,
    availableFrom: "2026-02-20",
    availableTo: "2026-12-31",
    gradient: ["#0A2540", "#1A3F6B"],
    imageUrl:
      "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=600&h=240&fit=crop&q=80",
  },
  {
    id: "honda-city-chiang-mai",
    name: "Honda City Turbo",
    brand: "Honda",
    location: "Chiang Mai",
    seats: 5,
    transmission: "Automatic",
    fuel: "Petrol",
    pricePerDayTHB: 1120,
    rating: 4.7,
    trips: 429,
    availableFrom: "2026-02-24",
    availableTo: "2026-11-20",
    gradient: ["#0C3A63", "#3B82F6"],
    imageUrl:
      "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&h=240&fit=crop&q=80",
  },
  {
    id: "nissan-almera-phuket",
    name: "Nissan Almera",
    brand: "Nissan",
    location: "Phuket",
    seats: 5,
    transmission: "Automatic",
    fuel: "Petrol",
    pricePerDayTHB: 1050,
    rating: 4.6,
    trips: 311,
    availableFrom: "2026-02-18",
    availableTo: "2026-10-15",
    gradient: ["#0A2540", "#2563EB"],
    imageUrl:
      "https://images.unsplash.com/photo-1550355291-bbee04a92027?w=600&h=240&fit=crop&q=80",
  },
  {
    id: "mazda-cx30-pattaya",
    name: "Mazda CX-30",
    brand: "Mazda",
    location: "Pattaya",
    seats: 5,
    transmission: "Automatic",
    fuel: "Petrol",
    pricePerDayTHB: 1680,
    rating: 4.9,
    trips: 215,
    availableFrom: "2026-03-01",
    availableTo: "2026-12-20",
    gradient: ["#1D3557", "#457B9D"],
    imageUrl:
      "https://images.unsplash.com/photo-1611566026373-c6c38e3a5dd4?w=600&h=240&fit=crop&q=80",
  },
  {
    id: "byd-dolphin-bangkok",
    name: "BYD Dolphin",
    brand: "BYD",
    location: "Bangkok",
    seats: 5,
    transmission: "Automatic",
    fuel: "EV",
    pricePerDayTHB: 1490,
    rating: 4.8,
    trips: 278,
    availableFrom: "2026-02-15",
    availableTo: "2026-12-31",
    gradient: ["#0C4A6E", "#0891B2"],
    imageUrl:
      "https://images.unsplash.com/photo-1621491085158-897d16e8f571?w=600&h=240&fit=crop&q=80",
  },
  {
    id: "bmw-320i-phuket",
    name: "BMW 320i",
    brand: "BMW",
    location: "Phuket",
    seats: 5,
    transmission: "Automatic",
    fuel: "Hybrid",
    pricePerDayTHB: 2990,
    rating: 4.9,
    trips: 120,
    availableFrom: "2026-03-05",
    availableTo: "2026-12-10",
    gradient: ["#1E3A8A", "#1D4ED8"],
    imageUrl:
      "https://images.unsplash.com/photo-1555215695-3d98bc139fc1?w=600&h=240&fit=crop&q=80",
  },
  {
    id: "toyota-fortuner-hat-yai",
    name: "Toyota Fortuner",
    brand: "Toyota",
    location: "Hat Yai",
    seats: 7,
    transmission: "Automatic",
    fuel: "Petrol",
    pricePerDayTHB: 2100,
    rating: 4.7,
    trips: 201,
    availableFrom: "2026-02-22",
    availableTo: "2026-11-30",
    gradient: ["#1F2937", "#4B5563"],
    imageUrl:
      "https://images.unsplash.com/photo-1571607388263-1044f9ea01dd?w=600&h=240&fit=crop&q=80",
  },
  {
    id: "honda-hrv-krabi",
    name: "Honda HR-V",
    brand: "Honda",
    location: "Krabi",
    seats: 5,
    transmission: "Automatic",
    fuel: "Hybrid",
    pricePerDayTHB: 1780,
    rating: 4.8,
    trips: 188,
    availableFrom: "2026-02-26",
    availableTo: "2026-10-30",
    gradient: ["#0F172A", "#334155"],
    imageUrl:
      "https://images.unsplash.com/photo-1606611013016-969c19ba27bb?w=600&h=240&fit=crop&q=80",
  },
];
