import type {
  ProfessionalGenderKey,
  ProfessionalRoleKey,
} from "@/constants/professional";

export type DirectorySeedProfile = {
  id: string;
  role: Extract<ProfessionalRoleKey, "doctor" | "dater">;
  nickname: string;
  genders: ProfessionalGenderKey[];
  dateOfBirth: string;
  bio: string;
  city: string;
};

export const DIRECTORY_SEED_PROFILES: DirectorySeedProfile[] = [
  {
    id: "seed-doctor-1",
    role: "doctor",
    nickname: "Dr. Nadiya",
    genders: ["female"],
    dateOfBirth: "1991-02-14",
    bio: "General physician focused on checkups, preventive care, and clear follow-up plans.",
    city: "Bangkok",
  },
  {
    id: "seed-doctor-2",
    role: "doctor",
    nickname: "Dr. Min Khant",
    genders: ["male"],
    dateOfBirth: "1988-08-03",
    bio: "Family doctor available for routine consultations and practical wellness advice.",
    city: "Chiang Mai",
  },
  {
    id: "seed-doctor-3",
    role: "doctor",
    nickname: "Dr. Alex",
    genders: ["lgbt"],
    dateOfBirth: "1993-11-20",
    bio: "Inclusive care with a calm bedside manner and a strong focus on patient comfort.",
    city: "Pattaya",
  },
  {
    id: "seed-dater-1",
    role: "dater",
    nickname: "Mia",
    genders: ["female"],
    dateOfBirth: "1997-04-18",
    bio: "Warm, direct, and looking for genuine conversation before anything else.",
    city: "Bangkok",
  },
  {
    id: "seed-dater-2",
    role: "dater",
    nickname: "Ethan",
    genders: ["male"],
    dateOfBirth: "1995-09-09",
    bio: "Easygoing profile for coffee dates, city walks, and respectful connections.",
    city: "Phuket",
  },
  {
    id: "seed-dater-3",
    role: "dater",
    nickname: "River",
    genders: ["lgbt"],
    dateOfBirth: "1998-12-01",
    bio: "Creative, social, and open to thoughtful connections across the city.",
    city: "Chiang Mai",
  },
];
