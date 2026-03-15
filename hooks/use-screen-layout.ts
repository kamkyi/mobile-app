import { useMemo } from "react";
import type { ViewStyle } from "react-native";

import { Spacing } from "@/constants/theme";

import { useHydratedWindowDimensions } from "./use-hydrated-window-dimensions";

type ScreenLayoutOptions = {
  bottomPadding?: number;
  gap?: number;
  maxWidth?: number;
  minHorizontalPadding?: number;
  topPadding?: number;
};

type ScreenLayoutResult = {
  contentContainerStyle: ViewStyle;
  contentWidth: number;
  horizontalPadding: number;
  width: number;
};

export function useScreenLayout({
  bottomPadding = Spacing.xl,
  gap,
  maxWidth = 720,
  minHorizontalPadding = Spacing.base,
  topPadding,
}: ScreenLayoutOptions = {}): ScreenLayoutResult {
  const { width } = useHydratedWindowDimensions();
  const safeWidth = Math.max(width, minHorizontalPadding * 2);
  const contentWidth = Math.min(safeWidth - minHorizontalPadding * 2, maxWidth);
  const horizontalPadding = Math.max(
    minHorizontalPadding,
    (safeWidth - contentWidth) / 2,
  );

  const contentContainerStyle = useMemo(
    () => ({
      ...(typeof topPadding === "number" ? { paddingTop: topPadding } : {}),
      paddingBottom: bottomPadding,
      paddingHorizontal: horizontalPadding,
      ...(typeof gap === "number" ? { gap } : {}),
    }),
    [bottomPadding, gap, horizontalPadding, topPadding],
  );

  return {
    contentContainerStyle,
    contentWidth,
    horizontalPadding,
    width,
  };
}
