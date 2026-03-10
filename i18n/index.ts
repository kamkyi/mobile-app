import * as SecureStore from "expo-secure-store";
import { getLocales } from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { Platform } from "react-native";

import { resources } from "@/i18n/resources";

const LANGUAGE_STORAGE_KEY = "app.language.v1";

export const SUPPORTED_LANGUAGES = ["en", "my", "zh", "th"] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const FALLBACK_LANGUAGE: AppLanguage = "en";

function isSupportedLanguage(value: string): value is AppLanguage {
  return SUPPORTED_LANGUAGES.includes(value as AppLanguage);
}

function toAppLanguage(value?: string): AppLanguage {
  const normalized = (value ?? "").toLowerCase();
  if (normalized.startsWith("my")) return "my";
  if (normalized.startsWith("zh")) return "zh";
  if (normalized.startsWith("th")) return "th";
  return "en";
}

function getDeviceLanguage(): AppLanguage {
  const locale = getLocales()?.[0];
  return toAppLanguage(locale?.languageTag ?? locale?.languageCode);
}

export function resolveAppLanguage(value?: string): AppLanguage {
  if (!value) return FALLBACK_LANGUAGE;
  if (isSupportedLanguage(value)) return value;
  return toAppLanguage(value);
}

async function readStoredLanguage(): Promise<AppLanguage | null> {
  if (Platform.OS === "web") {
    if (typeof window === "undefined") return null;
    try {
      const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
      return stored ? resolveAppLanguage(stored) : null;
    } catch {
      return null;
    }
  }

  const stored = await SecureStore.getItemAsync(LANGUAGE_STORAGE_KEY);
  return stored ? resolveAppLanguage(stored) : null;
}

async function persistLanguage(language: AppLanguage): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // Ignore persistence errors on web (private mode / quota).
    }
    return;
  }

  await SecureStore.setItemAsync(LANGUAGE_STORAGE_KEY, language);
}

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources,
    lng: getDeviceLanguage(),
    fallbackLng: FALLBACK_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES,
    interpolation: { escapeValue: false },
    returnNull: false,
  });
}

export async function initializeLanguageFromStorage(): Promise<void> {
  const storedLanguage = await readStoredLanguage();
  if (!storedLanguage) return;

  const activeLanguage = resolveAppLanguage(i18n.resolvedLanguage ?? i18n.language);
  if (activeLanguage !== storedLanguage) {
    await i18n.changeLanguage(storedLanguage);
  }
}

export async function setAppLanguage(language: AppLanguage): Promise<void> {
  const nextLanguage = resolveAppLanguage(language);
  await i18n.changeLanguage(nextLanguage);
  await persistLanguage(nextLanguage);
}

export default i18n;

