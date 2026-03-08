import { useEffect, useState } from "react";
import { useWindowDimensions, type ScaledSize } from "react-native";

const FALLBACK_DIMENSIONS: ScaledSize = {
  width: 390,
  height: 844,
  scale: 2,
  fontScale: 1,
};

export function useHydratedWindowDimensions(): ScaledSize {
  const dimensions = useWindowDimensions();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated ? dimensions : FALLBACK_DIMENSIONS;
}
