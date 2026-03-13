import type { ComponentProps } from "react";

import { Ionicons } from "@expo/vector-icons";

export const MAX_PROFESSIONAL_ROLE_SELECTION = 3;

export type ProfessionalRoleOption = {
  key: string;
  iconName: ComponentProps<typeof Ionicons>["name"];
  color: string;
  titleKey: string;
  descriptionKey: string;
};

export const PROFESSIONAL_ROLE_OPTIONS = [
  {
    key: "doctor",
    iconName: "medkit-outline",
    color: "#0EA5E9",
    titleKey: "professional.roles.doctor.title",
    descriptionKey: "professional.roles.doctor.description",
  },
  {
    key: "technician",
    iconName: "construct-outline",
    color: "#F97316",
    titleKey: "professional.roles.technician.title",
    descriptionKey: "professional.roles.technician.description",
  },
  {
    key: "dater",
    iconName: "heart-outline",
    color: "#EC4899",
    titleKey: "professional.roles.dater.title",
    descriptionKey: "professional.roles.dater.description",
  },
  {
    key: "tutor",
    iconName: "school-outline",
    color: "#8B5CF6",
    titleKey: "professional.roles.tutor.title",
    descriptionKey: "professional.roles.tutor.description",
  },
  {
    key: "lawyer",
    iconName: "briefcase-outline",
    color: "#1D4ED8",
    titleKey: "professional.roles.lawyer.title",
    descriptionKey: "professional.roles.lawyer.description",
  },
  {
    key: "chef",
    iconName: "restaurant-outline",
    color: "#EF4444",
    titleKey: "professional.roles.chef.title",
    descriptionKey: "professional.roles.chef.description",
  },
  {
    key: "designer",
    iconName: "color-palette-outline",
    color: "#7C3AED",
    titleKey: "professional.roles.designer.title",
    descriptionKey: "professional.roles.designer.description",
  },
  {
    key: "photographer",
    iconName: "camera-outline",
    color: "#14B8A6",
    titleKey: "professional.roles.photographer.title",
    descriptionKey: "professional.roles.photographer.description",
  },
  {
    key: "beauty-expert",
    iconName: "sparkles-outline",
    color: "#DB2777",
    titleKey: "professional.roles.beauty-expert.title",
    descriptionKey: "professional.roles.beauty-expert.description",
  },
  {
    key: "fitness-coach",
    iconName: "barbell-outline",
    color: "#F59E0B",
    titleKey: "professional.roles.fitness-coach.title",
    descriptionKey: "professional.roles.fitness-coach.description",
  },
  {
    key: "driver",
    iconName: "car-sport-outline",
    color: "#2563EB",
    titleKey: "professional.roles.driver.title",
    descriptionKey: "professional.roles.driver.description",
  },
  {
    key: "electrician",
    iconName: "flash-outline",
    color: "#06B6D4",
    titleKey: "professional.roles.electrician.title",
    descriptionKey: "professional.roles.electrician.description",
  },
] as const satisfies readonly ProfessionalRoleOption[];

export type ProfessionalRoleKey = (typeof PROFESSIONAL_ROLE_OPTIONS)[number]["key"];

const ROLE_KEYS = new Set<string>(
  PROFESSIONAL_ROLE_OPTIONS.map((option) => option.key),
);

export function isProfessionalRoleKey(value: string): value is ProfessionalRoleKey {
  return ROLE_KEYS.has(value);
}

export function normalizeProfessionalRoles(
  values: readonly string[],
): ProfessionalRoleKey[] {
  const seen = new Set<ProfessionalRoleKey>();

  return values.reduce<ProfessionalRoleKey[]>((result, value) => {
    if (!isProfessionalRoleKey(value) || seen.has(value)) {
      return result;
    }

    seen.add(value);
    result.push(value);
    return result;
  }, []);
}
