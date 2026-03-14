export type ShowcaseFeatureKey = "beauty" | "fitness" | "visit" | "food";

export type ShowcaseCard = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  tags: string[];
  phoneNumber?: string;
  hotline?: string;
  consultation?: string;
  location?: string;
  hours?: string;
};

export type ShowcaseSection = {
  title: string;
  subtitle: string;
  heroLabel: string;
  accentColor: string;
  cards: ShowcaseCard[];
};

export const SHOWCASE_SECTIONS: Record<ShowcaseFeatureKey, ShowcaseSection> = {
  beauty: {
    title: "Beauty professionals",
    subtitle:
      "Sample beauty specialists with direct hotline and consultation details.",
    heroLabel: "Beauty list",
    accentColor: "#DB2777",
    cards: [
      {
        id: "beauty-1",
        title: "Nora Skin Studio",
        subtitle: "Facial therapist",
        description:
          "Barrier-friendly facials, hydration plans, and calm skin consultations for weekly maintenance.",
        imageUrl: "https://picsum.photos/id/1074/1200/800",
        tags: ["Facial", "Glow", "Hydration"],
        phoneNumber: "+66 81 224 1199",
        hotline: "24/7 beauty hotline",
        consultation: "Consult available",
      },
      {
        id: "beauty-2",
        title: "Aura Hair Lab",
        subtitle: "Hair and scalp expert",
        description:
          "Cut, styling, and scalp recovery plans with a strong focus on texture and healthy shine.",
        imageUrl: "https://picsum.photos/id/1060/1200/800",
        tags: ["Hair", "Scalp", "Styling"],
        phoneNumber: "+66 82 440 0033",
        hotline: "Priority booking line",
        consultation: "Video consult",
      },
    ],
  },
  fitness: {
    title: "Fitness professionals",
    subtitle:
      "Sample fitness coaches with contact, hotline, and consultation cards.",
    heroLabel: "Fitness list",
    accentColor: "#F59E0B",
    cards: [
      {
        id: "fitness-1",
        title: "Coach Ethan Core",
        subtitle: "Strength coach",
        description:
          "Private strength sessions, beginner lifting programs, and form-correction consultations.",
        imageUrl: "https://picsum.photos/id/1004/1200/800",
        tags: ["Strength", "Mobility", "Beginner"],
        phoneNumber: "+66 89 515 7001",
        hotline: "Training hotline",
        consultation: "Consult before booking",
      },
      {
        id: "fitness-2",
        title: "Maya Fit Flow",
        subtitle: "Yoga and mobility coach",
        description:
          "Mobility-first coaching for posture, recovery, and balanced weekly programs.",
        imageUrl: "https://picsum.photos/id/1027/1200/800",
        tags: ["Yoga", "Stretch", "Recovery"],
        phoneNumber: "+66 94 720 7788",
        hotline: "Coach support line",
        consultation: "In-app consult",
      },
    ],
  },
  visit: {
    title: "Places to visit",
    subtitle: "Sample places with image cards, location details, and visiting hours.",
    heroLabel: "Visit ideas",
    accentColor: "#8B5CF6",
    cards: [
      {
        id: "visit-1",
        title: "Riverlight Night Market",
        subtitle: "Evening destination",
        description:
          "Open-air shopping, local street food, and live music beside the water every weekend.",
        imageUrl: "https://picsum.photos/id/1043/1200/800",
        tags: ["Night market", "Local food", "Live music"],
        location: "Bangkok Riverside",
        hours: "5:00 PM - 11:30 PM",
      },
      {
        id: "visit-2",
        title: "Cliff Garden Viewpoint",
        subtitle: "Scenic stop",
        description:
          "A quiet elevated stop for sunset views, photo spots, and short walking trails.",
        imageUrl: "https://picsum.photos/id/1056/1200/800",
        tags: ["Sunset", "Photos", "Nature"],
        location: "Phuket Coast",
        hours: "8:00 AM - 7:00 PM",
      },
    ],
  },
  food: {
    title: "Food picks",
    subtitle: "Sample food cards with images, cuisine highlights, and opening hours.",
    heroLabel: "Food cards",
    accentColor: "#EF4444",
    cards: [
      {
        id: "food-1",
        title: "Golden Bowl Kitchen",
        subtitle: "Myanmar and Thai comfort food",
        description:
          "A relaxed dining spot known for noodle bowls, grilled dishes, and spicy house sauces.",
        imageUrl: "https://picsum.photos/id/1080/1200/800",
        tags: ["Noodles", "Comfort", "Spicy"],
        location: "Sukhumvit",
        hours: "11:00 AM - 10:00 PM",
      },
      {
        id: "food-2",
        title: "Lantern Garden Cafe",
        subtitle: "Dessert and coffee",
        description:
          "Soft desserts, fruit drinks, and a bright indoor space for easy meetups and quick breaks.",
        imageUrl: "https://picsum.photos/id/1081/1200/800",
        tags: ["Coffee", "Dessert", "Cafe"],
        location: "Chiang Mai Old Town",
        hours: "9:00 AM - 9:00 PM",
      },
    ],
  },
};
