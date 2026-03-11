import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { StyleSheet, View } from "react-native";

const FRAME_INSET = 2;

export type FeatureIconName =
  | ComponentProps<typeof Ionicons>["name"]
  | "flow";

type FeatureIconProps = {
  name: FeatureIconName;
  size: number;
  color: string;
};

export function FeatureIcon({ name, size, color }: FeatureIconProps) {
  if (name !== "flow") {
    return (
      <Ionicons
        color={color}
        name={name as ComponentProps<typeof Ionicons>["name"]}
        size={size}
      />
    );
  }

  const frameSize = Math.max(size, 16);
  const borderWidth = Math.max(1.5, Math.round(frameSize * 0.08));
  const ringHeight = Math.max(3, Math.round(frameSize * 0.22));

  return (
    <View style={[styles.flowRoot, { width: frameSize, height: frameSize }]}>
      <View
        style={[
          styles.flowFrame,
          {
            borderColor: color,
            borderRadius: frameSize * 0.26,
            borderWidth,
          },
        ]}
      />
      <View
        style={[
          styles.flowHeader,
          {
            backgroundColor: color,
            borderRadius: frameSize * 0.12,
            left: frameSize * 0.14,
            opacity: 0.16,
            right: frameSize * 0.14,
            top: frameSize * 0.2,
          },
        ]}
      />
      <View
        style={[
          styles.flowRing,
          {
            backgroundColor: color,
            borderRadius: borderWidth,
            height: ringHeight,
            left: frameSize * 0.26,
            top: frameSize * 0.04,
            width: borderWidth,
          },
        ]}
      />
      <View
        style={[
          styles.flowRing,
          {
            backgroundColor: color,
            borderRadius: borderWidth,
            height: ringHeight,
            right: frameSize * 0.26,
            top: frameSize * 0.04,
            width: borderWidth,
          },
        ]}
      />
      <Ionicons
        color={color}
        name="water"
        size={frameSize * 0.52}
        style={styles.flowGlyph}
      />
      <View
        style={[
          styles.flowAccent,
          {
            backgroundColor: color,
            borderRadius: frameSize * 0.08,
            height: frameSize * 0.16,
            right: frameSize * 0.08,
            top: frameSize * 0.6,
            width: frameSize * 0.16,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flowRoot: {
    alignItems: "center",
    justifyContent: "center",
  },
  flowFrame: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: FRAME_INSET,
  },
  flowHeader: {
    height: "16%",
    position: "absolute",
  },
  flowRing: {
    position: "absolute",
  },
  flowGlyph: {
    marginTop: 1,
  },
  flowAccent: {
    position: "absolute",
  },
});
