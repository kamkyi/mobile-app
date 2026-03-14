export type ExploreCategoryKey = "sports" | "science" | "beauty";

export type ExploreWeatherCard = {
  id: string;
  city: string;
  condition: string;
  temperatureC: number;
  humidity: number;
};

export type ExploreStory = {
  id: string;
  category: ExploreCategoryKey;
  title: string;
  summary: string;
  imageUrl: string;
  location: string;
  meta: string;
  score?: string;
};

export const EXPLORE_CATEGORY_LABELS: Record<ExploreCategoryKey, string> = {
  sports: "Sport",
  science: "Science",
  beauty: "Beauty",
};

export const EXPLORE_WEATHER_CARDS: ExploreWeatherCard[] = [
  {
    id: "weather-bkk",
    city: "Bangkok",
    condition: "Partly cloudy",
    temperatureC: 31,
    humidity: 68,
  },
  {
    id: "weather-cnx",
    city: "Chiang Mai",
    condition: "Warm breeze",
    temperatureC: 28,
    humidity: 52,
  },
  {
    id: "weather-hkt",
    city: "Phuket",
    condition: "Light rain",
    temperatureC: 29,
    humidity: 75,
  },
];

export const EXPLORE_STORIES: ExploreStory[] = [
  {
    id: "story-sports-1",
    category: "sports",
    title: "Champions final thriller ends 3-2 after a late winner",
    summary:
      "A dramatic night finished with two quick goals in the final ten minutes and a full-stadium celebration.",
    imageUrl: "https://picsum.photos/id/1011/1200/800",
    location: "London",
    meta: "Big event • Football",
    score: "FT 3-2",
  },
  {
    id: "story-sports-2",
    category: "sports",
    title: "Derby night delivers a clean sheet and a title-race shakeup",
    summary:
      "A disciplined back line held firm while a single counterattack goal changed the league table.",
    imageUrl: "https://picsum.photos/id/1040/1200/800",
    location: "Madrid",
    meta: "League update",
    score: "FT 1-0",
  },
  {
    id: "story-science-1",
    category: "science",
    title: "Ocean robotics team reveals a new deep-water mapping drone",
    summary:
      "The prototype is designed to scan coastal changes faster and give researchers clearer terrain models.",
    imageUrl: "https://picsum.photos/id/1025/1200/800",
    location: "Singapore",
    meta: "Research lab",
  },
  {
    id: "story-science-2",
    category: "science",
    title: "Battery materials breakthrough could shorten charging windows",
    summary:
      "Engineers reported stronger heat stability during high-speed charging in their latest test cycle.",
    imageUrl: "https://picsum.photos/id/1039/1200/800",
    location: "Seoul",
    meta: "Energy science",
  },
  {
    id: "story-beauty-1",
    category: "beauty",
    title: "Skin clinic trend: barrier-first routines are replacing harsh peels",
    summary:
      "Studios are shifting toward calmer recovery plans, lighter acids, and hydration-focused treatments.",
    imageUrl: "https://picsum.photos/id/1062/1200/800",
    location: "Bangkok",
    meta: "Beauty trend",
  },
  {
    id: "story-beauty-2",
    category: "beauty",
    title: "Editorial hair looks are moving toward glossy minimal styling",
    summary:
      "Designers are favoring shape, shine, and texture instead of heavier product layering.",
    imageUrl: "https://picsum.photos/id/1066/1200/800",
    location: "Tokyo",
    meta: "Style report",
  },
];
