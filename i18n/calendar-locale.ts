import { LocaleConfig } from "react-native-calendars";

import {
  getAppLocaleTag,
  resolveAppLanguage,
  SUPPORTED_LANGUAGES,
  type AppLanguage,
} from "@/i18n";
import { resources } from "@/i18n/resources";

let localesReady = false;

function getMonthNames(localeTag: string, month: "long" | "short") {
  const formatter = new Intl.DateTimeFormat(localeTag, {
    month,
    timeZone: "UTC",
  });

  return Array.from({ length: 12 }, (_, index) =>
    formatter.format(new Date(Date.UTC(2026, index, 1))),
  );
}

function getWeekdayNames(
  localeTag: string,
  weekday: "long" | "short" | "narrow",
) {
  const formatter = new Intl.DateTimeFormat(localeTag, {
    timeZone: "UTC",
    weekday,
  });

  return Array.from({ length: 7 }, (_, index) =>
    formatter.format(new Date(Date.UTC(2026, 2, 1 + index))),
  );
}

function getTodayLabel(language: AppLanguage): string {
  return resources[language].translation.feature.flow.today;
}

function ensureCalendarLocales() {
  if (localesReady) {
    return;
  }

  SUPPORTED_LANGUAGES.forEach((language) => {
    const localeTag = getAppLocaleTag(language);

    LocaleConfig.locales[language] = {
      dayNames: getWeekdayNames(localeTag, "long"),
      dayNamesShort: getWeekdayNames(localeTag, "short"),
      monthNames: getMonthNames(localeTag, "long"),
      monthNamesShort: getMonthNames(localeTag, "short"),
      today: getTodayLabel(language),
    };
  });

  localesReady = true;
}

export function syncCalendarLocale(language?: string): AppLanguage {
  ensureCalendarLocales();

  const resolvedLanguage = resolveAppLanguage(language);
  LocaleConfig.defaultLocale = resolvedLanguage;

  return resolvedLanguage;
}
